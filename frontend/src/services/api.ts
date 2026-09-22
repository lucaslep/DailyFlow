import type { Task, TaskPriority, TaskStatus } from "../types/task";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3333";
export type User = { id: number; name: string; email: string; role: "USER" | "ADMIN" };
export type AuthResponse = { user: User };
export type AdminUser = User & { isActive: boolean; createdAt: string; _count: { tasks: number } };
export type AdminSummary = { users: number; activeUsers: number; tasks: number; completedTasks: number };

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({ message: "Erro de comunicação com o servidor" }));
    const error = new Error(payload.message ?? "Não foi possível concluir a operação");
    if (response.status === 401 && !path.startsWith("/auth/")) window.dispatchEvent(new Event("auth:unauthorized"));
    throw error;
  }

  return response.status === 204 ? (undefined as T) : response.json();
}

export function register(name: string, email: string, password: string) {
  return request<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
}

export function login(email: string, password: string) {
  return request<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function getCurrentUser() {
  return request<User>("/auth/me");
}

export function logout() {
  return request<void>("/auth/logout", { method: "POST" });
}

export function forgotPassword(email: string) {
  return request<{ message: string; resetToken?: string }>("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) });
}

export function resetPassword(token: string, password: string) {
  return request<{ message: string }>("/auth/reset-password", { method: "POST", body: JSON.stringify({ token, password }) });
}

export function getAdminSummary() {
  return request<AdminSummary>("/admin/summary");
}

export function getAdminUsers() {
  return request<AdminUser[]>("/admin/users");
}

export function updateAdminUser(id: number, data: { isActive?: boolean; role?: "USER" | "ADMIN" }) {
  return request<User & { isActive: boolean }>(`/admin/users/${id}`, { method: "PATCH", body: JSON.stringify(data) });
}

export function getTasks() {
  return request<Task[]>("/tasks");
}

type CreateTaskData = {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
};

export function createTask(data: CreateTaskData) {
  return request<Task>("/tasks", { method: "POST", body: JSON.stringify(data) });
}

type UpdateTaskData = Partial<Omit<CreateTaskData, "dueDate">> & { dueDate?: string | null };

export function updateTask(id: number, data: UpdateTaskData) {
  return request<Task>(`/tasks/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export function deleteTask(id: number) {
  return request<void>(`/tasks/${id}`, { method: "DELETE" });
}
