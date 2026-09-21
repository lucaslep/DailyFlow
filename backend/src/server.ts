import express from "express";
import cors from "cors";

import { taskRoutes } from "./routes/task.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (request, response) => {
  response.json({
    message: "Productivity Manager API funcionando 🚀",
  });
});

app.use("/tasks", taskRoutes);

const PORT = 3333;

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});