import "dotenv/config";

import nodemailer from "nodemailer";

const smtpConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD && process.env.EMAIL_FROM);

export async function sendPasswordResetEmail(email: string, name: string, token: string) {
  const frontendUrl = process.env.APP_URL ?? "http://localhost:5173";
  const resetUrl = `${frontendUrl}/?resetToken=${encodeURIComponent(token)}`;

  if (!smtpConfigured) {
    if (process.env.NODE_ENV === "production") throw new Error("Serviço de e-mail não configurado");
    console.log(`[DEV] Recuperação de senha para ${email}: ${resetUrl}`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "Redefinição de senha - TaskPulse",
    text: `Olá, ${name}. Acesse ${resetUrl} para redefinir sua senha. O link expira em 30 minutos.`,
    html: `<p>Olá, ${name}.</p><p><a href="${resetUrl}">Clique aqui para redefinir sua senha</a>.</p><p>O link expira em 30 minutos.</p>`,
  });
}
