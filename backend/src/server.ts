import express from "express";
import cors from "cors";
import helmet from "helmet";
import path from "node:path";
import { rateLimit } from "express-rate-limit";

import { taskRoutes } from "./routes/task.routes.js";
import { authRoutes } from "./routes/auth.routes.js";
import { adminRoutes } from "./routes/admin.routes.js";

const app = express();
const allowedOrigins = new Set((process.env.CORS_ORIGIN ?? process.env.APP_URL ?? "http://localhost:5173,http://localhost:8080").split(",").map((origin) => origin.trim()));

app.set("trust proxy", 1);
app.use(helmet({ contentSecurityPolicy: process.env.NODE_ENV === "production" ? undefined : false }));
app.use(cors({ origin: [...allowedOrigins], credentials: true }));
app.use(express.json({ limit: "100kb" }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: "draft-8", legacyHeaders: false }));
app.use((request, response, next) => {
  if (["GET", "HEAD", "OPTIONS"].includes(request.method)) return next();
  const origin = request.headers.origin;
  if (origin && !allowedOrigins.has(origin)) return response.status(403).json({ message: "Origem não autorizada" });
  return next();
});

app.get("/health", (request, response) => {
  return response.json({
    message: "Productivity Manager API funcionando 🚀",
  });
});

app.use("/auth", authRoutes);
app.use("/tasks", taskRoutes);
app.use("/admin", adminRoutes);

if (process.env.NODE_ENV === "production") {
  const publicPath = path.join(process.cwd(), "public");
  app.use(express.static(publicPath));
  app.get("/{*splat}", (request, response) => response.sendFile(path.join(publicPath, "index.html")));
}

app.use((error: unknown, request: express.Request, response: express.Response, next: express.NextFunction) => {
  console.error(error);
  return response.status(500).json({ message: "Erro interno do servidor" });
});

const PORT = Number(process.env.PORT ?? 3333);

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
