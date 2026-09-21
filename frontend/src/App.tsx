import { useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";

import { createTask, deleteTask, getTasks, updateTask } from "./services/api";
import type { Task, TaskPriority, TaskStatus } from "./types/task";
import "./App.css";

const statusLabels: Record<TaskStatus, string> = { TODO: "Pendente", IN_PROGRESS: "Em andamento", DONE: "Concluída" };
const priorityLabels: Record<TaskPriority, string> = { LOW: "Baixa", MEDIUM: "Média", HIGH: "Alta" };

function Icon({ children, size = 20 }: { children: ReactNode; size?: number }) {
  return <svg aria-hidden="true" height={size} viewBox="0 0 24 24" width={size}>{children}</svg>;
}

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>("TODO");
  const [priority, setPriority] = useState<TaskPriority>("MEDIUM");
  const [dueDate, setDueDate] = useState("");
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const summary = useMemo(() => ({
    total: tasks.length,
    pending: tasks.filter((task) => task.status === "TODO").length,
    inProgress: tasks.filter((task) => task.status === "IN_PROGRESS").length,
    done: tasks.filter((task) => task.status === "DONE").length,
  }), [tasks]);

  async function loadTasks() {
    try {
      setError("");
      setTasks(await getTasks());
    } catch (loadError) {
      console.error(loadError);
      setError("Não foi possível carregar as tarefas.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadTasks(); }, []);

  function clearForm() {
    setTitle(""); setDescription(""); setStatus("TODO"); setPriority("MEDIUM"); setDueDate(""); setEditingTask(null);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) { alert("Digite um título para a tarefa."); return; }

    try {
      setSaving(true);
      const data = { title: title.trim(), description: description.trim(), status, priority, dueDate: dueDate || null };
      if (editingTask) await updateTask(editingTask.id, data);
      else await createTask({ ...data, dueDate: dueDate || undefined });
      clearForm();
      await loadTasks();
    } catch (saveError) {
      console.error(saveError);
      alert("Erro ao salvar tarefa.");
    } finally { setSaving(false); }
  }

  function handleEdit(task: Task) {
    setEditingTask(task); setTitle(task.title); setDescription(task.description ?? ""); setStatus(task.status); setPriority(task.priority);
    setDueDate(task.dueDate?.split("T")[0] ?? "");
    document.querySelector(".composer")?.scrollIntoView({ behavior: "smooth" });
  }

  async function handleComplete(task: Task) {
    try { await updateTask(task.id, { status: "DONE" }); await loadTasks(); }
    catch (completeError) { console.error(completeError); alert("Erro ao concluir tarefa."); }
  }

  async function handleDelete(id: number) {
    if (!window.confirm("Tem certeza que deseja excluir esta tarefa?")) return;
    try { await deleteTask(id); await loadTasks(); }
    catch (deleteError) { console.error(deleteError); alert("Erro ao excluir tarefa."); }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand"><div className="brand-mark"><Icon size={23}><path d="m7 12 3 3 7-7" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" /></Icon></div><div><strong>Focus</strong><span>Workspace</span></div></div>
        <div className="today-chip"><Icon size={17}><path d="M7 3v3m10-3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" /></Icon>{new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long" }).format(new Date())}</div>
      </header>

      <main className="dashboard">
        <section className="welcome"><div><span className="eyebrow">VISÃO GERAL</span><h1>Organize o dia.<br /><em>Conquiste seus objetivos.</em></h1></div><p>Transforme planos em progresso, uma tarefa de cada vez.</p></section>

        <section className="summary-grid" aria-label="Resumo das tarefas">
          <SummaryCard className="summary-primary" label="Total de tarefas" value={summary.total} icon={<Icon><path d="M7 3h10v4H7zM5 5H4a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-1M8 12h8m-8 4h5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></Icon>} />
          <SummaryCard label="Pendentes" value={summary.pending} tone="amber" icon={<Icon><path d="M12 7v5l3 2m6-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" /></Icon>} />
          <SummaryCard label="Em andamento" value={summary.inProgress} tone="blue" icon={<Icon><path d="M5 12h14M14 7l5 5-5 5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></Icon>} />
          <SummaryCard label="Concluídas" value={summary.done} tone="green" icon={<Icon><path d="m7 12 3 3 7-7M21 12a9 9 0 1 1-5-8" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></Icon>} />
        </section>

        <div className="workspace-grid">
          <section className="panel composer">
            <div className="panel-heading"><span className="heading-icon"><Icon><path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" /></Icon></span><div><h2>{editingTask ? "Editar tarefa" : "Nova tarefa"}</h2><p>{editingTask ? "Atualize os detalhes abaixo" : "Adicione algo à sua lista"}</p></div></div>
            <form onSubmit={handleSubmit} className="task-form">
              <label>Título<input type="text" placeholder="O que precisa ser feito?" value={title} onChange={(event) => setTitle(event.target.value)} /></label>
              <label>Descrição <span>(opcional)</span><textarea placeholder="Adicione mais detalhes..." value={description} onChange={(event) => setDescription(event.target.value)} /></label>
              <div className="form-row">
                <label>Status<select value={status} onChange={(event) => setStatus(event.target.value as TaskStatus)}><option value="TODO">Pendente</option><option value="IN_PROGRESS">Em andamento</option><option value="DONE">Concluída</option></select></label>
                <label>Prioridade<select value={priority} onChange={(event) => setPriority(event.target.value as TaskPriority)}><option value="LOW">Baixa</option><option value="MEDIUM">Média</option><option value="HIGH">Alta</option></select></label>
              </div>
              <label>Prazo<input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} /></label>
              <button className="primary-button" disabled={saving} type="submit"><Icon size={18}><path d={editingTask ? "M4 20h4L19 9l-4-4L4 16v4Zm9-13 4 4" : "M12 5v14M5 12h14"} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></Icon>{saving ? "Salvando..." : editingTask ? "Salvar alterações" : "Criar tarefa"}</button>
              {editingTask && <button className="cancel-button" onClick={clearForm} type="button">Cancelar edição</button>}
            </form>
          </section>

          <section className="panel tasks-panel">
            <div className="panel-heading list-heading"><div><span className="eyebrow">MINHAS TAREFAS</span><h2>Próximos passos</h2></div><span className="task-count">{summary.total} {summary.total === 1 ? "tarefa" : "tarefas"}</span></div>
            {loading ? <div className="state-message">Carregando suas tarefas...</div> : error ? <div className="state-message error-state"><p>{error}</p><button onClick={() => void loadTasks()}>Tentar novamente</button></div> : tasks.length === 0 ? <div className="state-message empty-state"><span><Icon size={28}><path d="M7 3h10v4H7zM5 5H4a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-1" fill="none" stroke="currentColor" strokeWidth="1.6" /></Icon></span><h3>Sua lista está livre</h3><p>Crie uma tarefa para começar.</p></div> : (
              <div className="task-list">{tasks.map((task) => <article className={`task-card ${task.status === "DONE" ? "is-done" : ""}`} key={task.id}>
                <div className="task-topline"><span className={`status-pill status-${task.status.toLowerCase()}`}>{statusLabels[task.status]}</span><span className={`priority-pill priority-${task.priority.toLowerCase()}`}>{priorityLabels[task.priority]}</span></div>
                <h3>{task.title}</h3>{task.description && <p className="task-description">{task.description}</p>}
                {task.dueDate && <p className="due-date"><Icon size={16}><path d="M7 3v3m10-3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" /></Icon>{new Date(task.dueDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" })}</p>}
                <div className="task-actions">{task.status !== "DONE" && <button className="complete-action" onClick={() => void handleComplete(task)}><Icon size={16}><path d="m4 9 3 3 5-6" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" /></Icon>Concluir</button>}<button aria-label={`Editar ${task.title}`} onClick={() => handleEdit(task)}><Icon size={17}><path d="M4 20h4L19 9l-4-4L4 16v4Zm9-13 4 4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></Icon></button><button aria-label={`Excluir ${task.title}`} className="delete-action" onClick={() => void handleDelete(task.id)}><Icon size={17}><path d="M4 7h16m-10 4v6m4-6v6M9 4h6l1 3H8l1-3Zm-3 3 1 14h10l1-14" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" /></Icon></button></div>
              </article>)}</div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

function SummaryCard({ className = "", icon, label, tone = "", value }: { className?: string; icon: ReactNode; label: string; tone?: string; value: number }) {
  return <article className={`summary-card ${className} ${tone ? `tone-${tone}` : ""}`}><span className="summary-icon">{icon}</span><div><strong>{value}</strong><span>{label}</span></div></article>;
}

export default App;
