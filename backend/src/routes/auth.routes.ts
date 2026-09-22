import { createHash, randomBytes } from "node:crypto";

import { compare, hash } from "bcryptjs";
import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { z } from "zod";

import { endSession, requireAuthentication, startSession } from "../auth.js";
import { prisma } from "../database/prisma.js";
import { sendPasswordResetEmail } from "../email.js";

export const authRoutes = Router();

const credentialsLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: "draft-8", legacyHeaders: false });
const emailSchema = z.string().trim().toLowerCase().email("Informe um e-mail válido");
const passwordSchema = z.string().min(8, "A senha deve possuir pelo menos 8 caracteres").max(128);
const adminEmails = new Set((process.env.ADMIN_EMAILS ?? "").split(",").map((email) => email.trim().toLowerCase()).filter(Boolean));

function publicUser(user: { id: number; name: string; email: string; role: "USER" | "ADMIN" }) {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

function validationMessage(error: z.ZodError) {
  return error.issues[0]?.message ?? "Dados inválidos";
}

authRoutes.post("/register", credentialsLimiter, async (request, response) => {
  const parsed = z.object({ name: z.string().trim().min(2).max(80), email: emailSchema, password: passwordSchema }).safeParse(request.body);
  if (!parsed.success) return response.status(400).json({ message: validationMessage(parsed.error) });

  const { name, email, password } = parsed.data;
  if (await prisma.user.findUnique({ where: { email } })) return response.status(409).json({ message: "Este e-mail já está cadastrado" });

  const user = await prisma.user.create({
    data: { name, email, passwordHash: await hash(password, 12), role: adminEmails.has(email) ? "ADMIN" : "USER" },
  });
  await startSession(response, user.id);
  return response.status(201).json({ user: publicUser(user) });
});

authRoutes.post("/login", credentialsLimiter, async (request, response) => {
  const parsed = z.object({ email: emailSchema, password: z.string() }).safeParse(request.body);
  if (!parsed.success) return response.status(401).json({ message: "E-mail ou senha incorretos" });

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user?.isActive || user.passwordHash === "LOGIN_DISABLED" || !(await compare(parsed.data.password, user.passwordHash))) {
    return response.status(401).json({ message: "E-mail ou senha incorretos" });
  }

  await startSession(response, user.id);
  return response.json({ user: publicUser(user) });
});

authRoutes.post("/logout", (request, response) => {
  endSession(response);
  return response.status(204).send();
});

authRoutes.get("/me", requireAuthentication, async (request, response) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: request.userId } });
  return response.json(publicUser(user));
});

authRoutes.post("/forgot-password", credentialsLimiter, async (request, response) => {
  const parsed = z.object({ email: emailSchema }).safeParse(request.body);
  const success = { message: "Se o e-mail estiver cadastrado, enviaremos as instruções" };
  if (!parsed.success) return response.json(success);

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user?.isActive || user.passwordHash === "LOGIN_DISABLED") return response.json(success);

  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  await prisma.$transaction([
    prisma.passwordResetToken.deleteMany({ where: { userId: user.id } }),
    prisma.passwordResetToken.create({ data: { userId: user.id, tokenHash, expiresAt: new Date(Date.now() + 30 * 60 * 1000) } }),
  ]);
  await sendPasswordResetEmail(user.email, user.name, token);
  return response.json(process.env.NODE_ENV === "production" ? success : { ...success, resetToken: token });
});

authRoutes.post("/reset-password", credentialsLimiter, async (request, response) => {
  const parsed = z.object({ token: z.string().min(32), password: passwordSchema }).safeParse(request.body);
  if (!parsed.success) return response.status(400).json({ message: parsed.success ? "Dados inválidos" : validationMessage(parsed.error) });

  const tokenHash = createHash("sha256").update(parsed.data.token).digest("hex");
  const resetToken = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });
  if (!resetToken || resetToken.usedAt || resetToken.expiresAt <= new Date()) return response.status(400).json({ message: "Link inválido ou expirado" });

  await prisma.$transaction([
    prisma.user.update({ where: { id: resetToken.userId }, data: { passwordHash: await hash(parsed.data.password, 12) } }),
    prisma.passwordResetToken.update({ where: { id: resetToken.id }, data: { usedAt: new Date() } }),
  ]);
  endSession(response);
  return response.json({ message: "Senha redefinida com sucesso" });
});
