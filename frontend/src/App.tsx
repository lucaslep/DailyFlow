import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";

import {
  createTask,
  deleteTask,
  forgotPassword,
  getAdminSummary,
  getAdminUsers,
  getCurrentUser,
  getTasks,
  login,
  logout,
  register,
  resetPassword,
  updateAdminUser,
  updateTask,
} from "./services/api";
import type { AdminSummary, AdminUser, User } from "./services/api";
import type { Task, TaskPriority, TaskStatus } from "./types/task";
import "./App.css";

const statusLabels: Record<TaskStatus, string> = { TODO: "Pendente", IN_PROGRESS: "Em andamento", DONE: "Concluída" };
const priorityLabels: Record<TaskPriority, string> = { LOW: "Baixa", MEDIUM: "Média", HIGH: "Alta" };

function Icon({ children, size = 20 }: { children: ReactNode; size?: number }) {
  return <svg aria-hidden="true" height={size} viewBox="0 0 24 24" width={size}>{children}</svg>;
}

function AuthScreen({ onAuthenticated }: { onAuthenticated: (user: User) => void }) {
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    try {
      setSubmitting(true);
      setError("");
      if (mode === "forgot") {
        const result = await forgotPassword(email);
        setError(result.message);
        return;
      }
      const result = mode === "login" ? await login(email, password) : await register(name, email, password);
      onAuthenticated(result.user);
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "Não foi possível entrar");
    } finally {
      setSubmitting(false);
    }
  }

  function changeMode() {
    setMode((current) => current === "login" ? "register" : "login");
    setError("");
  }

  return (
    <main className="auth-page">
      <section className="auth-intro">
        <div className="brand auth-brand"><div className="brand-mark"><Icon size={23}><path d="m7 12 3 3 7-7" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" /></Icon></div><div><strong>Focus</strong><span>Workspace</span></div></div>
        <span className="eyebrow">PRODUTIVIDADE COM CLAREZA</span>
        <h1>Organize o dia.<br /><em>Conquiste seus objetivos.</em></h1>
        <p>Planeje tarefas, acompanhe o progresso e mantenha o foco no que realmente importa.</p>
      </section>
      <section className="auth-card">
        <h2>{mode === "login" ? "Boas-vindas" : mode === "register" ? "Crie sua conta" : "Recuperar senha"}</h2>
        <p>{mode === "login" ? "Entre para acessar suas tarefas." : mode === "register" ? "Comece a organizar sua rotina." : "Enviaremos um link para o seu e-mail."}</p>
        <form className="task-form" onSubmit={handleSubmit}>
          {mode === "register" && <label>Nome<input autoComplete="name" minLength={2} onChange={(event) => setName(event.target.value)} required value={name} /></label>}
          <label>E-mail<input autoComplete="email" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} /></label>
          {mode !== "forgot" && <label>Senha<input autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={8} onChange={(event) => setPassword(event.target.value)} required type="password" value={password} /></label>}
          {error && <p className={mode === "forgot" ? "form-success" : "form-error"}>{error}</p>}
          <button className="primary-button" disabled={submitting} type="submit">{submitting ? "Aguarde..." : mode === "login" ? "Entrar" : mode === "register" ? "Criar conta" : "Enviar instruções"}</button>
        </form>
        {mode === "login" && <button className="auth-switch" onClick={() => { setMode("forgot"); setError(""); }} type="button">Esqueci minha senha</button>}
        <button className="auth-switch" onClick={changeMode} type="button">{mode === "login" ? "Ainda não tenho uma conta" : "Voltar para o login"}</button>
      </section>
    </main>
  );
}

function ResetPasswordScreen({ token, onFinished }: { token: string; onFinished: () => void }) {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault();
    try { setMessage((await resetPassword(token, password)).message); window.setTimeout(onFinished, 1500); }
    catch (resetError) { setMessage(resetError instanceof Error ? resetError.message : "Não foi possível redefinir a senha"); }
  }
  return <main className="auth-page single-auth"><section className="auth-card"><h2>Nova senha</h2><p>Informe sua nova senha de acesso.</p><form className="task-form" onSubmit={submit}><label>Nova senha<input minLength={8} onChange={(event) => setPassword(event.target.value)} required type="password" value={password} /></label>{message && <p className="form-success">{message}</p>}<button className="primary-button">Redefinir senha</button></form></section></main>;
}

function App() {
  const [theme, setTheme] = useState<"light" | "dark">(() => localStorage.getItem("focus-theme") === "dark" ? "dark" : "light");
  const [user, setUser] = useState<User | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [resetToken, setResetToken] = useState(() => new URLSearchParams(window.location.search).get("resetToken"));
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>("TODO");
  const [priority, setPriority] = useState<TaskPriority>("MEDIUM");
  const [dueDate, setDueDate] = useState("");
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const summary = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const done = tasks.filter((task) => task.status === "DONE").length;
    return {
      total: tasks.length,
      pending: tasks.filter((task) => task.status === "TODO").length,
      inProgress: tasks.filter((task) => task.status === "IN_PROGRESS").length,
      done,
      overdue: tasks.filter((task) => task.status !== "DONE" && task.dueDate && task.dueDate.slice(0, 10) < today).length,
      completionRate: tasks.length ? Math.round((done / tasks.length) * 100) : 0,
    };
  }, [tasks]);

  const signOut = useCallback(() => {
    void logout().finally(() => { setUser(null); setTasks([]); });
  }, []);

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      setTasks(await getTasks());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Não foi possível carregar as tarefas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const restoreSession = async () => {
      try { setUser(await getCurrentUser()); } catch { signOut(); } finally { setCheckingSession(false); }
    };
    void restoreSession();
  }, [signOut]);

  useEffect(() => {
    if (!user) return undefined;
    const loadTimer = window.setTimeout(() => void loadTasks(), 0);
    return () => window.clearTimeout(loadTimer);
  }, [loadTasks, user]);
  useEffect(() => {
    const handleUnauthorized = () => signOut();
    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("auth:unauthorized", handleUnauthorized);
  }, [signOut]);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    localStorage.setItem("focus-theme", theme);
  }, [theme]);

  function handleAuthenticated(authenticatedUser: User) {
    setUser(authenticatedUser);
  }

  function clearForm() {
    setTitle(""); setDescription(""); setStatus("TODO"); setPriority("MEDIUM"); setDueDate(""); setEditingTask(null);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    try {
      setSaving(true);
      const data = { title: title.trim(), description: description.trim(), status, priority, dueDate: dueDate || null };
      if (editingTask) await updateTask(editingTask.id, data);
      else await createTask({ ...data, dueDate: dueDate || undefined });
      clearForm();
      await loadTasks();
    } catch (saveError) {
      alert(saveError instanceof Error ? saveError.message : "Erro ao salvar tarefa");
    } finally { setSaving(false); }
  }

  function handleEdit(task: Task) {
    setEditingTask(task); setTitle(task.title); setDescription(task.description ?? ""); setStatus(task.status); setPriority(task.priority); setDueDate(task.dueDate?.split("T")[0] ?? "");
    document.querySelector(".composer")?.scrollIntoView({ behavior: "smooth" });
  }

  async function handleComplete(task: Task) { await updateTask(task.id, { status: "DONE" }); await loadTasks(); }
  async function handleDelete(id: number) { if (window.confirm("Tem certeza que deseja excluir esta tarefa?")) { await deleteTask(id); await loadTasks(); } }

  if (checkingSession) return <div className="splash-screen">Carregando...</div>;
  if (resetToken) return <ResetPasswordScreen token={resetToken} onFinished={() => { window.history.replaceState({}, "", window.location.pathname); setResetToken(null); }} />;
  if (!user) return <AuthScreen onAuthenticated={handleAuthenticated} />;

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand"><div className="brand-mark"><Icon size={23}><path d="m7 12 3 3 7-7" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" /></Icon></div><div><strong>Focus</strong><span>Workspace</span></div></div>
        <div className="header-actions">
          <div className="user-chip"><span>{user.name.charAt(0).toUpperCase()}</span><div><strong>{user.name}</strong><small>{user.email}</small></div></div>
          <button className="logout-button" onClick={signOut} type="button">Sair</button>
          <button aria-label="Alternar tema" className="theme-toggle" onClick={() => setTheme((current) => current === "light" ? "dark" : "light")} type="button"><span className="theme-toggle-track"><span className="theme-toggle-icon sun">☀</span><span className="theme-toggle-icon moon">☾</span><span className="theme-toggle-thumb" /></span></button>
        </div>
      </header>

      <main className="dashboard">
        <section className="welcome"><div><span className="eyebrow">VISÃO GERAL</span><h1>Olá, {user.name.split(" ")[0]}.<br /><em>Vamos produzir?</em></h1></div><p>Acompanhe seus resultados e transforme planos em progresso.</p></section>
        <section className="summary-grid dashboard-summary" aria-label="Dashboard de produtividade">
          <SummaryCard className="summary-primary" label="Total de tarefas" value={summary.total} />
          <SummaryCard label="Pendentes" tone="amber" value={summary.pending} />
          <SummaryCard label="Em andamento" tone="blue" value={summary.inProgress} />
          <SummaryCard label="Concluídas" tone="green" value={summary.done} />
          <SummaryCard label="Atrasadas" tone="red" value={summary.overdue} />
          <SummaryCard label="Taxa de conclusão" tone="purple" value={`${summary.completionRate}%`} />
        </section>

        <div className="workspace-grid">
          <section className="panel composer">
            <div className="panel-heading"><span className="heading-icon">+</span><div><h2>{editingTask ? "Editar tarefa" : "Nova tarefa"}</h2><p>{editingTask ? "Atualize os detalhes abaixo" : "Adicione algo à sua lista"}</p></div></div>
            <form className="task-form" onSubmit={handleSubmit}>
              <label>Título<input maxLength={120} onChange={(event) => setTitle(event.target.value)} placeholder="O que precisa ser feito?" required value={title} /></label>
              <label>Descrição <span>(opcional)</span><textarea onChange={(event) => setDescription(event.target.value)} placeholder="Adicione mais detalhes..." value={description} /></label>
              <div className="form-row"><label>Status<select onChange={(event) => setStatus(event.target.value as TaskStatus)} value={status}><option value="TODO">Pendente</option><option value="IN_PROGRESS">Em andamento</option><option value="DONE">Concluída</option></select></label><label>Prioridade<select onChange={(event) => setPriority(event.target.value as TaskPriority)} value={priority}><option value="LOW">Baixa</option><option value="MEDIUM">Média</option><option value="HIGH">Alta</option></select></label></div>
              <label>Prazo<input onChange={(event) => setDueDate(event.target.value)} type="date" value={dueDate} /></label>
              <button className="primary-button" disabled={saving} type="submit">{saving ? "Salvando..." : editingTask ? "Salvar alterações" : "Criar tarefa"}</button>
              {editingTask && <button className="cancel-button" onClick={clearForm} type="button">Cancelar edição</button>}
            </form>
          </section>

          <section className="panel tasks-panel">
            <div className="panel-heading list-heading"><div><span className="eyebrow">MINHAS TAREFAS</span><h2>Próximos passos</h2></div><span className="task-count">{summary.total} {summary.total === 1 ? "tarefa" : "tarefas"}</span></div>
            {loading ? <div className="state-message">Carregando suas tarefas...</div> : error ? <div className="state-message error-state"><p>{error}</p><button onClick={() => void loadTasks()}>Tentar novamente</button></div> : tasks.length === 0 ? <div className="state-message empty-state"><h3>Sua lista está livre</h3><p>Crie uma tarefa para começar.</p></div> : <div className="task-list">{tasks.map((task) => (
              <article className={`task-card ${task.status === "DONE" ? "is-done" : ""}`} key={task.id}>
                <div className="task-topline"><span className={`status-pill status-${task.status.toLowerCase()}`}>{statusLabels[task.status]}</span><span className={`priority-pill priority-${task.priority.toLowerCase()}`}>{priorityLabels[task.priority]}</span></div>
                <h3>{task.title}</h3>{task.description && <p className="task-description">{task.description}</p>}
                {task.dueDate && <p className="due-date">Prazo: {new Date(task.dueDate).toLocaleDateString("pt-BR", { timeZone: "UTC" })}</p>}
                <div className="task-actions">{task.status !== "DONE" && <button className="complete-action" onClick={() => void handleComplete(task)}>Concluir</button>}<button onClick={() => handleEdit(task)}>Editar</button><button className="delete-action" onClick={() => void handleDelete(task.id)}>Excluir</button></div>
              </article>
            ))}</div>}
          </section>
        </div>
        {user.role === "ADMIN" && <AdminPanel />}
      </main>
    </div>
  );
}

function AdminPanel() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [expanded, setExpanded] = useState(false);

  async function loadAdmin() {
    const [summaryData, usersData] = await Promise.all([getAdminSummary(), getAdminUsers()]);
    setSummary(summaryData); setUsers(usersData);
  }

  async function toggleUser(user: AdminUser) {
    await updateAdminUser(user.id, { isActive: !user.isActive });
    await loadAdmin();
  }

  async function toggleRole(user: AdminUser) {
    await updateAdminUser(user.id, { role: user.role === "ADMIN" ? "USER" : "ADMIN" });
    await loadAdmin();
  }

  return <section className="panel admin-panel"><div className="panel-heading list-heading"><div><span className="eyebrow">ADMINISTRAÇÃO</span><h2>Usuários do sistema</h2></div><button className="logout-button" onClick={() => { const next = !expanded; setExpanded(next); if (next) void loadAdmin(); }} type="button">{expanded ? "Fechar" : "Gerenciar"}</button></div>{expanded && <>{summary && <div className="admin-summary"><span>{summary.users} usuários</span><span>{summary.activeUsers} ativos</span><span>{summary.tasks} tarefas</span><span>{summary.completedTasks} concluídas</span></div>}<div className="admin-users">{users.map((item) => <article key={item.id}><div><strong>{item.name}</strong><small>{item.email} · {item._count.tasks} tarefas</small></div><span className={`status-pill ${item.isActive ? "status-done" : "priority-high"}`}>{item.isActive ? "Ativo" : "Inativo"}</span><button onClick={() => void toggleRole(item)}>{item.role === "ADMIN" ? "Remover admin" : "Tornar admin"}</button><button onClick={() => void toggleUser(item)}>{item.isActive ? "Desativar" : "Ativar"}</button></article>)}</div></>}</section>;
}

function SummaryCard({ className = "", label, tone = "", value }: { className?: string; label: string; tone?: string; value: number | string }) {
  return <article className={`summary-card ${className} ${tone ? `tone-${tone}` : ""}`}><span className="summary-icon">●</span><div><strong>{value}</strong><span>{label}</span></div></article>;
}

export default App;
