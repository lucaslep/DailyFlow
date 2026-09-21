
import { Router } from "express";

export const taskRoutes = Router();

const tasks = [
  {
    id: 1,
    title: "Estudar Node.js",
    completed: false,
  },
  {
    id: 2,
    title: "Estudar React",
    completed: false,
  },
];

let nextId = 3;

taskRoutes.get("/", (request, response) => {
  return response.json(tasks);
});

taskRoutes.get("/:id", (request, response) => {
  const { id } = request.params;

  const task = tasks.find((task) => task.id === Number(id));

  if (!task) {
    return response.status(404).json({
      message: "Tarefa não encontrada",
    });
  }

  return response.json(task);
});

taskRoutes.post("/", (request, response) => {
  const { title } = request.body;

  if (!title) {
    return response.status(400).json({
      message: "O título é obrigatório",
    });
  }

  const task = {
    id: nextId++,
    title,
    completed: false,
  };

  tasks.push(task);

  return response.status(201).json(task);
});

taskRoutes.put("/:id", (request, response) => {
  const { id } = request.params;
  const { title, completed } = request.body;

  const task = tasks.find((task) => task.id === Number(id));

  if (!task) {
    return response.status(404).json({
      message: "Tarefa não encontrada",
    });
  }

  if (title !== undefined) {
    task.title = title;
  }

  if (completed !== undefined) {
    task.completed = completed;
  }

  return response.json(task);
});

taskRoutes.delete("/:id", (request, response) => {
  const { id } = request.params;

  const taskIndex = tasks.findIndex(
    (task) => task.id === Number(id)
  );

  if (taskIndex === -1) {
    return response.status(404).json({
      message: "Tarefa não encontrada",
    });
  }

  tasks.splice(taskIndex, 1);

  return response.status(204).send();
});
