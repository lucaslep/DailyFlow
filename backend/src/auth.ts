import "dotenv/config";

import type { NextFunction, Request, Response } from "express";
import { jwtVerify, SignJWT } from "jose";

import { prisma } from "./database/prisma.js";

const jwtSecret = process.env.JWT_SECRET;
export const SESSION_COOKIE = "taskpulse_session";

if (!jwtSecret || jwtSecret.length < 32) {
  throw new Error("JWT_SECRET deve possuir pelo menos 32 caracteres");
}

const secret = new TextEncoder().encode(jwtSecret);
const production = process.env.NODE_ENV === "production";

export type SessionUser = {
  id: number;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
};

function readCookie(request: Request, name: string) {
  const item = request.headers.cookie?.split(";").map((cookie) => cookie.trim()).find((cookie) => cookie.startsWith(`${name}=`));
  return item ? decodeURIComponent(item.slice(name.length + 1)) : undefined;
}

export async function createSessionToken(userId: number) {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .setSubject(String(userId))
    .sign(secret);
}

export async function startSession(response: Response, userId: number) {
  response.cookie(SESSION_COOKIE, await createSessionToken(userId), {
    httpOnly: true,
    secure: production,
    sameSite: "lax",
    maxAge: 8 * 60 * 60 * 1000,
    path: "/",
  });
}

export function endSession(response: Response) {
  response.clearCookie(SESSION_COOKIE, { httpOnly: true, secure: production, sameSite: "lax", path: "/" });
}

export async function requireAuthentication(request: Request, response: Response, next: NextFunction) {
  const token = readCookie(request, SESSION_COOKIE);
  if (!token) return response.status(401).json({ message: "Autenticação necessária" });

  try {
    const { payload } = await jwtVerify(token, secret);
    const userId = Number(payload.userId ?? payload.sub);
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.isActive) throw new Error("Usuário inválido");
    request.userId = user.id;
    request.userRole = user.role;
    return next();
  } catch {
    endSession(response);
    return response.status(401).json({ message: "Sessão inválida ou expirada" });
  }
}

export function requireAdministrator(request: Request, response: Response, next: NextFunction) {
  if (request.userRole !== "ADMIN") return response.status(403).json({ message: "Acesso restrito a administradores" });
  return next();
}
