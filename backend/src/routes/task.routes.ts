import { Router } from "express";
import { prisma } from "../database/prisma.js";

export const taskRoutes = Router();

taskRoutes.get("/", async (request, response) => {
  const tasks = await prisma.task.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return response.json(tasks);
});

taskRoutes.get("/:id", async (request, response) => {
  const { id } = request.params;

  const taskId = Number(id);

  if (Number.isNaN(taskId)) {
    return response.status(400).json({
      message: "ID inválido",
    });
  }

  const task = await prisma.task.findUnique({
    where: {
      id: taskId,
    },
  });

  if (!task) {
    return response.status(404).json({
      message: "Tarefa não encontrada",
    });
  }

  return response.json(task);
});

taskRoutes.post("/", async (request, response) => {
  const {
    title,
    description,
    status,
    priority,
    dueDate,
  } = request.body;

  if (!title) {
    return response.status(400).json({
      message: "O título é obrigatório",
    });
  }

  const task = await prisma.task.create({
    data: {
      title,
      description,
      status,
      priority,
      dueDate: dueDate ? new Date(dueDate) : null,
      completedAt:
        status === "DONE"
          ? new Date()
          : null,
    },
  });

  return response.status(201).json(task);
});

taskRoutes.put("/:id", async (request, response) => {
  const { id } = request.params;

  const {
    title,
    description,
    status,
    priority,
    dueDate,
  } = request.body;

  const taskId = Number(id);

  if (Number.isNaN(taskId)) {
    return response.status(400).json({
      message: "ID inválido",
    });
  }

  const existingTask = await prisma.task.findUnique({
    where: {
      id: taskId,
    },
  });

  if (!existingTask) {
    return response.status(404).json({
      message: "Tarefa não encontrada",
    });
  }

  const task = await prisma.task.update({
    where: {
      id: taskId,
    },
    data: {
      title,
      description,
      status,
      priority,
      dueDate:
        dueDate !== undefined
          ? dueDate
            ? new Date(dueDate)
            : null
          : undefined,

      completedAt:
        status === "DONE"
          ? existingTask.completedAt ?? new Date()
          : status
            ? null
            : undefined,
    },
  });

  return response.json(task);
});

taskRoutes.delete("/:id", async (request, response) => {
  const { id } = request.params;

  const taskId = Number(id);

  if (Number.isNaN(taskId)) {
    return response.status(400).json({
      message: "ID inválido",
    });
  }

  const existingTask = await prisma.task.findUnique({
    where: {
      id: taskId,
    },
  });

  if (!existingTask) {
    return response.status(404).json({
      message: "Tarefa não encontrada",
    });
  }

  await prisma.task.delete({
    where: {
      id: taskId,
    },
  });

  return response.status(204).send();
});