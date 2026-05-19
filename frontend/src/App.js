import React, { useState, useEffect } from "react";

// ─── API base URL ────────────────────────────────────────────────────────────
// When running with Docker Compose + Nginx proxy, use relative path "/api"
// When running frontend standalone (npm start), point to backend directly
const API_BASE = process.env.REACT_APP_API_URL || "/api";

// ─── Helper ──────────────────────────────────────────────────────────────────
const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

// ─── TaskCard ────────────────────────────────────────────────────────────────
function TaskCard({ task, onDelete, onStatusChange }) {
  const nextStatus = { todo: "in-progress", "in-progress": "done", done: "todo" };
  const nextLabel = { todo: "▶ Start", "in-progress": "✔ Complete", done: "↩ Reopen" };

  return (
    <div className={`task-card ${task.status}`}>
      <div className="task-title">{task.title}</div>
      {task.description && (
        <div className="task-description">{task.description}</div>
      )}
      <div className="task-actions">
        <button
          className="btn btn-success"
          onClick={() => onStatusChange(task.id, nextStatus[task.status])}
        >
          {nextLabel[task.status]}
        </button>
        <button className="btn btn-danger" onClick={() => onDelete(task.id)}>
          🗑 Delete
        </button>
      </div>
      <div className="task-date">{formatDate(task.created_at)}</div>
    </div>
  );
}

// ─── App ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("todo");

  // Fetch tasks
  const fetchTasks = async () => {
    try {
      const res = await fetch(`${API_BASE}/tasks`);
      if (!res.ok) throw new Error("Failed to fetch tasks");
      const data = await res.json();
      setTasks(data);
      setError(null);
    } catch (err) {
      setError("Cannot connect to backend. Is it running?");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Add task
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, status }),
      });
      if (!res.ok) throw new Error("Failed to create task");
      setTitle("");
      setDescription("");
      setStatus("todo");
      fetchTasks();
    } catch (err) {
      setError(err.message);
    }
  };

  // Delete task
  const handleDelete = async (id) => {
    try {
      await fetch(`${API_BASE}/tasks/${id}`, { method: "DELETE" });
      fetchTasks();
    } catch (err) {
      setError(err.message);
    }
  };

  // Update status
  const handleStatusChange = async (id, newStatus) => {
    const task = tasks.find((t) => t.id === id);
    try {
      await fetch(`${API_BASE}/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...task, status: newStatus }),
      });
      fetchTasks();
    } catch (err) {
      setError(err.message);
    }
  };

  // Split tasks by status
  const todo = tasks.filter((t) => t.status === "todo");
  const inProgress = tasks.filter((t) => t.status === "in-progress");
  const done = tasks.filter((t) => t.status === "done");

  return (
    <div className="app">
      <h1>📋 Task Manager</h1>
      <p className="subtitle">A three-tier Docker Compose practice app</p>

      {error && <div className="error-banner">⚠️ {error}</div>}

      {/* Add Task Form */}
      <div className="task-form">
        <h2>➕ Add New Task</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="text"
              placeholder="Task title *"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <textarea
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="form-group">
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary">
            Add Task
          </button>
        </form>
      </div>

      {/* Task Columns */}
      {loading ? (
        <div className="loading">Loading tasks...</div>
      ) : (
        <div className="columns">
          <div className="column column-todo">
            <div className="column-header">📌 To Do ({todo.length})</div>
            {todo.length === 0 && <p className="empty-state">No tasks here</p>}
            {todo.map((t) => (
              <TaskCard key={t.id} task={t} onDelete={handleDelete} onStatusChange={handleStatusChange} />
            ))}
          </div>

          <div className="column column-inprogress">
            <div className="column-header">⚡ In Progress ({inProgress.length})</div>
            {inProgress.length === 0 && <p className="empty-state">No tasks here</p>}
            {inProgress.map((t) => (
              <TaskCard key={t.id} task={t} onDelete={handleDelete} onStatusChange={handleStatusChange} />
            ))}
          </div>

          <div className="column column-done">
            <div className="column-header">✅ Done ({done.length})</div>
            {done.length === 0 && <p className="empty-state">No tasks here</p>}
            {done.map((t) => (
              <TaskCard key={t.id} task={t} onDelete={handleDelete} onStatusChange={handleStatusChange} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
