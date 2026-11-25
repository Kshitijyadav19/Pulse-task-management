import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity, ArrowDownRight, ArrowUpRight, Bell, CalendarDays, Check, CheckCheck,
  ChevronDown, CircleHelp, Clock3, Command, Filter, LayoutDashboard, ListTodo,
  LogOut, Menu, MoreHorizontal, Plus, Search, Settings2, Sparkles, Target,
  Trash2, X, Pencil, Zap, AlertCircle, LoaderCircle
} from "lucide-react";
import { api } from "./api";

const todayISO = () => new Date().toISOString().slice(0, 10);
const prettyDate = (value) => value ? new Date(`${value}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "No due date";
const initials = (name = "Pulse User") => name.trim().split(/\s+/).slice(0, 2).map(s => s[0]?.toUpperCase()).join("");

function App() {
  const [session, setSession] = useState(() => {
    try { return JSON.parse(localStorage.getItem("pulse_session") || "null"); } catch { return null; }
  });
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({ full_name: "", email: "", password: "" });
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState("");
  const [tasks, setTasks] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [apiOnline, setApiOnline] = useState(false);
  const [activeNav, setActiveNav] = useState("Overview");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [taskForm, setTaskForm] = useState({ title: "", description: "", status: "pending", priority: "medium", due_date: "" });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [mobileNav, setMobileNav] = useState(false);

  const displayName = session?.full_name || session?.email?.split("@")[0] || "there";
  const firstName = displayName.split(" ")[0];

  const loadTasks = useCallback(async () => {
    if (!session?.token) return;
    setLoading(true); setError("");
    try {
      const params = {};
      if (statusFilter !== "all") params.status = statusFilter;
      if (priorityFilter !== "all") params.priority = priorityFilter;
      if (query.trim()) params.search = query.trim();
      const data = await api.tasks(session.token, params);
      setTasks(data.items || []);
      setTotal(data.total || 0);
    } catch (e) {
      setError(e.message);
      if (/credential|unauthor/i.test(e.message)) logout();
    } finally { setLoading(false); }
  }, [session, statusFilter, priorityFilter, query]);

  useEffect(() => { api.health().then(() => setApiOnline(true)).catch(() => setApiOnline(false)); }, []);
  useEffect(() => { if (session?.token) loadTasks(); }, [session?.token, loadTasks]);

  const stats = useMemo(() => {
    const completed = tasks.filter(t => t.status === "completed").length;
    const inProgress = tasks.filter(t => t.status === "in_progress").length;
    const pending = tasks.filter(t => t.status === "pending").length;
    const overdue = tasks.filter(t => t.due_date && t.due_date < todayISO() && t.status !== "completed").length;
    return { completed, inProgress, pending, overdue, rate: tasks.length ? Math.round(completed / tasks.length * 100) : 0 };
  }, [tasks]);

  const dueSoon = useMemo(() => [...tasks].filter(t => t.due_date && t.status !== "completed").sort((a,b) => a.due_date.localeCompare(b.due_date)).slice(0, 4), [tasks]);
  const visibleTasks = tasks;

  function logout() {
    localStorage.removeItem("pulse_session");
    setSession(null); setTasks([]); setAuthForm({ full_name: "", email: "", password: "" });
  }
  function notify(message) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  }
  async function handleAuth(e) {
    e.preventDefault(); setAuthError(""); setAuthBusy(true);
    try {
      if (authMode === "register") {
        await api.register(authForm);
      }
      const result = await api.login({ email: authForm.email, password: authForm.password });
      const next = { token: result.access_token, email: authForm.email, full_name: authForm.full_name || authForm.email.split("@")[0] };
      localStorage.setItem("pulse_session", JSON.stringify(next));
      setSession(next);
    } catch (e) { setAuthError(e.message); }
    finally { setAuthBusy(false); }
  }
  function openCreate() {
    setEditing(null);
    setTaskForm({ title: "", description: "", status: "pending", priority: "medium", due_date: "" });
    setModalOpen(true);
  }
  function openEdit(task) {
    setEditing(task);
    setTaskForm({ title: task.title, description: task.description || "", status: task.status, priority: task.priority, due_date: task.due_date || "" });
    setModalOpen(true);
  }
  async function saveTask(e) {
    e.preventDefault(); setSaving(true);
    const payload = { ...taskForm, due_date: taskForm.due_date || null, description: taskForm.description || null };
    try {
      if (editing) await api.updateTask(session.token, editing.id, payload);
      else await api.createTask(session.token, payload);
      setModalOpen(false); notify(editing ? "Task updated" : "Task created"); await loadTasks();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  }
  async function toggleComplete(task) {
    try {
      await api.updateTask(session.token, task.id, { status: task.status === "completed" ? "pending" : "completed" });
      await loadTasks(); notify(task.status === "completed" ? "Task reopened" : "Task completed");
    } catch (e) { setError(e.message); }
  }
  async function removeTask(task) {
    if (!window.confirm(`Delete "${task.title}"? This cannot be undone.`)) return;
    try { await api.deleteTask(session.token, task.id); await loadTasks(); notify("Task deleted"); }
    catch (e) { setError(e.message); }
  }

  if (!session?.token) {
    return <AuthScreen mode={authMode} setMode={m => { setAuthMode(m); setAuthError(""); }} form={authForm} setForm={setAuthForm} onSubmit={handleAuth} busy={authBusy} error={authError} apiOnline={apiOnline} />;
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? "sidebar-open" : ""}`}>
        <div className="brand"><div className="brand-mark"><Activity size={21} strokeWidth={2.7}/></div><span>pulse<span className="brand-dot">.</span></span><button className="icon-btn mobile-close" onClick={() => setMobileNav(false)}><X size={18}/></button></div>
        <div className="workspace-label">WORKSPACE</div>
        <button className={`nav-item ${activeNav === "Overview" ? "active" : ""}`} onClick={() => {setActiveNav("Overview");setMobileNav(false);}}><LayoutDashboard size={18}/> Overview</button>
        <button className={`nav-item ${activeNav === "My tasks" ? "active" : ""}`} onClick={() => {setActiveNav("My tasks");setStatusFilter("all");setMobileNav(false);}}><ListTodo size={18}/> My tasks <span className="nav-count">{total}</span></button>
        <button className={`nav-item ${activeNav === "Upcoming" ? "active" : ""}`} onClick={() => {setActiveNav("Upcoming");setMobileNav(false);}}><CalendarDays size={18}/> Upcoming</button>
        <div className="sidebar-spacer"/>
        <div className="upgrade-card"><div className="upgrade-icon"><Sparkles size={17}/></div><strong>Make room for focus</strong><p>Your work, in one calm space. Keep your momentum going.</p><div className="upgrade-progress"><span/></div><small>You're building a great habit</small></div>
        <button className="nav-item muted-nav"><CircleHelp size={18}/> Help center</button>
        <button className="nav-item muted-nav"><Settings2 size={18}/> Settings</button>
        <div className="profile-row"><div className="avatar">{initials(displayName)}</div><div className="profile-info"><strong>{displayName}</strong><span>{session.email}</span></div><button className="icon-btn" title="Sign out" onClick={logout}><LogOut size={17}/></button></div>
      </aside>
      {mobileNav && <div className="mobile-backdrop" onClick={() => setMobileNav(false)}/>}
      <main className="main-area">
        <header className="topbar">
          <button className="icon-btn mobile-menu" onClick={() => setMobileNav(true)}><Menu size={20}/></button>
          <div className="breadcrumb">Workspace <span>/</span> <strong>{activeNav}</strong></div>
          <div className="top-actions"><div className={`api-pill ${apiOnline ? "online" : "offline"}`}><span/>{apiOnline ? "API connected" : "API offline"}</div><button className="icon-btn notification-btn" title="Notifications"><Bell size={18}/><i/></button><div className="avatar small-avatar">{initials(displayName)}</div></div>
        </header>
        <div className="page-content">
          <section className="welcome-row">
            <div><div className="eyebrow"><span className="eyebrow-line"/> YOUR PRODUCTIVITY, IN RHYTHM</div><h1>Good to see you, {firstName}<span className="wave">✦</span></h1><p>Make today count. A little progress adds up.</p></div>
            <button className="primary-btn" onClick={openCreate}><Plus size={18}/> New task</button>
          </section>

          {error && <div className="error-banner"><AlertCircle size={17}/><span>{error}</span><button onClick={() => setError("")}><X size={16}/></button></div>}

          <section className="stats-grid">
            <StatCard label="Total tasks" value={total} note="In your workspace" icon={<Target size={18}/>} tone="violet" trend="All your work"/>
            <StatCard label="Completed" value={stats.completed} note={`${stats.rate}% completion rate`} icon={<CheckCheck size={18}/>} tone="green" trend="Nice progress"/>
            <StatCard label="In progress" value={stats.inProgress} note="Work in motion" icon={<Zap size={18}/>} tone="blue" trend="Keep it moving"/>
            <StatCard label="Overdue" value={stats.overdue} note="Needs your attention" icon={<Clock3 size={18}/>} tone="orange" trend={stats.overdue ? "Review these" : "You're on track"}/>
          </section>

          <section className="content-grid">
            <div className="panel tasks-panel">
              <div className="panel-heading"><div><div className="section-kicker">YOUR WORKSPACE</div><h2>{activeNav === "Upcoming" ? "Coming up" : activeNav === "My tasks" ? "All tasks" : "Your tasks"}</h2><p>Stay focused on what matters most.</p></div><button className="text-btn" onClick={() => {setActiveNav("My tasks");setStatusFilter("all");setPriorityFilter("all");setQuery("");setSearch("");}}>View all <ArrowUpRight size={15}/></button></div>
              <div className="toolbar">
                <div className="search-box"><Search size={16}/><input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && setQuery(search)} placeholder="Search tasks..."/>{search && <button onClick={() => {setSearch("");setQuery("");}}><X size={14}/></button>}</div>
                <div className="filter-wrap"><Filter size={15}/><select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><option value="all">All status</option><option value="pending">Pending</option><option value="in_progress">In progress</option><option value="completed">Completed</option></select></div>
                <select className="priority-select" value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}><option value="all">All priority</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select>
                <button className="filter-apply" onClick={() => setQuery(search)}>Search</button>
              </div>
              {loading ? <div className="loading-state"><LoaderCircle className="spin" size={22}/> Loading your tasks...</div> :
                visibleTasks.length ? <div className="task-list">{visibleTasks.map(task => <TaskRow key={task.id} task={task} onToggle={toggleComplete} onEdit={openEdit} onDelete={removeTask}/>)}</div> :
                <div className="empty-state"><div className="empty-icon"><ListTodo size={23}/></div><strong>No tasks found</strong><p>{query || statusFilter !== "all" || priorityFilter !== "all" ? "Try adjusting your search or filters." : "Create your first task and build your momentum."}</p><button className="primary-btn small" onClick={openCreate}><Plus size={16}/> Create a task</button></div>}
              <div className="panel-footer"><span>Showing {visibleTasks.length} of {total} tasks</span><span className="footer-live"><span/> Synced with Pulse API</span></div>
            </div>

            <div className="right-column">
              <div className="panel focus-panel">
                <div className="panel-heading compact"><div><div className="section-kicker">YOUR MOMENTUM</div><h2>Weekly focus</h2></div><span className="sparkle-badge"><Sparkles size={15}/></span></div>
                <div className="focus-content"><div className="ring-wrap"><svg viewBox="0 0 120 120" className="progress-ring"><circle cx="60" cy="60" r="49" className="ring-bg"/><circle cx="60" cy="60" r="49" className="ring-value" style={{strokeDasharray: `${stats.rate * 3.078} 308`}}/></svg><div className="ring-label"><strong>{stats.rate}%</strong><span>done</span></div></div><div className="focus-copy"><strong>Keep the streak alive</strong><p>{stats.completed ? `${stats.completed} task${stats.completed === 1 ? "" : "s"} completed. You're making progress.` : "Every completed task is a win. Start with one."}</p></div></div>
                <div className="focus-divider"/><div className="focus-metrics"><div><span className="metric-dot violet-dot"/><span>Pending</span><strong>{stats.pending}</strong></div><div><span className="metric-dot green-dot"/><span>Completed</span><strong>{stats.completed}</strong></div></div>
              </div>
              <div className="panel upcoming-panel">
                <div className="panel-heading compact"><div><div className="section-kicker">DON'T MISS A BEAT</div><h2>Upcoming deadlines</h2></div><CalendarDays size={18} className="muted-icon"/></div>
                {dueSoon.length ? <div className="deadline-list">{dueSoon.map(task => <div className="deadline-row" key={task.id}><div className="deadline-date"><strong>{new Date(`${task.due_date}T00:00:00`).getDate()}</strong><span>{new Date(`${task.due_date}T00:00:00`).toLocaleDateString("en-US",{month:"short"})}</span></div><div className="deadline-info"><strong>{task.title}</strong><span>{task.status.replace("_"," ")}</span></div><span className={`priority-dot ${task.priority}`}/></div>)}</div> : <div className="mini-empty"><CalendarDays size={20}/><span>No upcoming deadlines yet</span></div>}
              </div>
              <div className="quote-card"><div className="quote-mark">“</div><p>Great things are done by a series of small things brought together.</p><span>— Vincent van Gogh</span></div>
            </div>
          </section>
          <footer className="app-footer"><span>© 2026 Pulse Workspace</span><span>Designed for deep work <span className="footer-heart">✦</span></span></footer>
        </div>
      </main>

      {modalOpen && <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && setModalOpen(false)}><form className="task-modal" onSubmit={saveTask}><div className="modal-head"><div><span className="section-kicker">{editing ? "REFINE YOUR PLAN" : "MAKE IT HAPPEN"}</span><h2>{editing ? "Edit task" : "Create a task"}</h2></div><button type="button" className="icon-btn" onClick={() => setModalOpen(false)}><X size={19}/></button></div><label>Task title<input autoFocus required maxLength="160" placeholder="What needs to get done?" value={taskForm.title} onChange={e => setTaskForm({...taskForm,title:e.target.value})}/></label><label>Description <span className="optional">(optional)</span><textarea rows="3" placeholder="Add a few details..." value={taskForm.description} onChange={e => setTaskForm({...taskForm,description:e.target.value})}/></label><div className="form-two"><label>Priority<select value={taskForm.priority} onChange={e => setTaskForm({...taskForm,priority:e.target.value})}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label><label>Status<select value={taskForm.status} onChange={e => setTaskForm({...taskForm,status:e.target.value})}><option value="pending">Pending</option><option value="in_progress">In progress</option><option value="completed">Completed</option></select></label></div><label>Due date <span className="optional">(optional)</span><input type="date" min="2020-01-01" value={taskForm.due_date} onChange={e => setTaskForm({...taskForm,due_date:e.target.value})}/></label><div className="modal-actions"><button type="button" className="secondary-btn" onClick={() => setModalOpen(false)}>Cancel</button><button className="primary-btn" disabled={saving}>{saving ? <LoaderCircle className="spin" size={17}/> : <Check size={17}/>} {editing ? "Save changes" : "Create task"}</button></div></form></div>}
      {toast && <div className="toast"><CheckCircleIcon/> {toast}</div>}
    </div>
  );
}

function CheckCircleIcon(){ return <span className="toast-check"><Check size={14}/></span>; }

function StatCard({label,value,note,icon,tone,trend}) {
  return <div className="stat-card"><div className="stat-top"><span>{label}</span><span className={`stat-icon ${tone}`}>{icon}</span></div><div className="stat-value">{value}</div><div className="stat-bottom"><span>{note}</span><span className="stat-trend">{trend}</span></div></div>;
}
function TaskRow({task,onToggle,onEdit,onDelete}) {
  const overdue = task.due_date && task.due_date < todayISO() && task.status !== "completed";
  return <div className={`task-row ${task.status === "completed" ? "task-done" : ""}`}><button className={`task-check ${task.status === "completed" ? "checked" : ""}`} onClick={() => onToggle(task)} title={task.status === "completed" ? "Reopen task" : "Mark complete"}>{task.status === "completed" && <Check size={13}/>}</button><div className="task-main"><div className="task-title-line"><strong>{task.title}</strong>{overdue && <span className="overdue-tag">Overdue</span>}</div>{task.description && <p>{task.description}</p>}<div className="task-meta"><span className={`status-chip ${task.status}`}>{task.status.replace("_"," ")}</span><span className={`priority-chip ${task.priority}`}><i/> {task.priority} priority</span><span className={`due-meta ${overdue ? "overdue-text" : ""}`}><CalendarDays size={13}/>{prettyDate(task.due_date)}</span></div></div><div className="task-actions"><button className="icon-btn" title="Edit task" onClick={() => onEdit(task)}><Pencil size={15}/></button><button className="icon-btn delete-action" title="Delete task" onClick={() => onDelete(task)}><Trash2 size={15}/></button></div></div>;
}

function AuthScreen({mode,setMode,form,setForm,onSubmit,busy,error,apiOnline}) {
  return <div className="auth-shell"><div className="auth-visual"><div className="auth-brand"><div className="brand-mark"><Activity size={21}/></div><span>pulse<span className="brand-dot">.</span></span></div><div className="visual-content"><div className="visual-chip"><Sparkles size={14}/> A calmer way to get things done</div><h1>Find your flow.<br/><em>Keep your pulse.</em></h1><p>One focused workspace for your tasks, your time, and your best work.</p><div className="visual-art"><div className="art-orbit orbit-one"/><div className="art-orbit orbit-two"/><div className="art-core"><Activity size={48}/></div><div className="float-card float-a"><CheckCheck size={17}/><span><b>One thing at a time</b><small>Progress feels good</small></span></div><div className="float-card float-b"><Zap size={17}/><span><b>Stay in motion</b><small>Make today count</small></span></div></div></div><div className="visual-foot"><span>© 2026 Pulse</span><span>Less noise. More meaningful work.</span></div></div><div className="auth-side"><div className="auth-side-top"><span className={`api-pill ${apiOnline ? "online" : "offline"}`}><span/>{apiOnline ? "API connected" : "Checking API"}</span></div><form className="auth-card" onSubmit={onSubmit}><div className="auth-kicker">{mode === "login" ? "WELCOME BACK" : "GET STARTED"}</div><h2>{mode === "login" ? "Sign in to Pulse" : "Create your account"}</h2><p>{mode === "login" ? "Pick up where you left off. Your focus is waiting." : "A more intentional workday starts here."}</p>{mode === "register" && <label>Full name<input required minLength="2" maxLength="120" autoComplete="name" placeholder="Your name" value={form.full_name} onChange={e => setForm({...form,full_name:e.target.value})}/></label>}<label>Email address<input required type="email" autoComplete="email" placeholder="you@example.com" value={form.email} onChange={e => setForm({...form,email:e.target.value})}/></label><label>Password<input required type="password" minLength={mode === "register" ? 8 : 1} autoComplete={mode === "login" ? "current-password" : "new-password"} placeholder={mode === "register" ? "At least 8 characters" : "Enter your password"} value={form.password} onChange={e => setForm({...form,password:e.target.value})}/></label>{error && <div className="auth-error"><AlertCircle size={15}/>{error}</div>}<button className="primary-btn auth-submit" disabled={busy}>{busy ? <LoaderCircle className="spin" size={17}/> : null}{mode === "login" ? "Sign in" : "Create account"} <ArrowUpRight size={17}/></button><div className="auth-switch">{mode === "login" ? "New to Pulse?" : "Already have an account?"} <button type="button" onClick={() => setMode(mode === "login" ? "register" : "login")}>{mode === "login" ? "Create an account" : "Sign in"}</button></div><div className="auth-security"><span><Check size={13}/> Secure JWT authentication</span><span><Check size={13}/> Your tasks stay private</span></div></form><div className="auth-copyright">Built for focus, powered by Pulse API.</div></div></div>;
}

export default App;