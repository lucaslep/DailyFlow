import { Router } from "express";

import { requireAdministrator, requireAuthentication } from "../auth.js";
import { prisma } from "../database/prisma.js";

export const adminRoutes = Router();
adminRoutes.use(requireAuthentication, requireAdministrator);

adminRoutes.get("/summary", async (request, response) => {
  const [users, activeUsers, tasks, completedTasks] = await Promise.all([
    prisma.user.count({ where: { passwordHash: { not: "LOGIN_DISABLED" } } }),
    prisma.user.count({ where: { isActive: true, passwordHash: { not: "LOGIN_DISABLED" } } }),
    prisma.task.count(),
    prisma.task.count({ where: { status: "DONE" } }),
  ]);
  return response.json({ users, activeUsers, tasks, completedTasks });
});

adminRoutes.get("/users", async (request, response) => {
  const users = await prisma.user.findMany({
    where: { passwordHash: { not: "LOGIN_DISABLED" } },
    select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true, _count: { select: { tasks: true } } },
    orderBy: { createdAt: "desc" },
  });
  return response.json(users);
});

adminRoutes.patch("/users/:id", async (request, response) => {
  const id = Number(request.params.id);
  const { isActive, role } = request.body as { isActive?: boolean; role?: "USER" | "ADMIN" };
  if (!Number.isInteger(id) || (role !== undefined && !["USER", "ADMIN"].includes(role)) || (isActive !== undefined && typeof isActive !== "boolean")) {
    return response.status(400).json({ message: "Dados inválidos" });
  }
  if (id === request.userId && isActive === false) return response.status(400).json({ message: "Você não pode desativar a própria conta" });

  const user = await prisma.user.update({ where: { id }, data: { isActive, role }, select: { id: true, name: true, email: true, role: true, isActive: true } });
  return response.json(user);
});
