import React, { useEffect, useMemo, useState } from 'react';
import './App.css';
import { getTodos, createTodo, updateTodo, deleteTodo, toggleTodo } from './api';

// PUBLIC_INTERFACE
function App() {
  /**
   * Todo App with CRUD and toggle functionality.
   * Loads todos on mount and after each operation. Provides inline edit.
   */
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [title, setTitle] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');

  const completedCount = useMemo(() => todos.filter(t => t.completed).length, [todos]);

  useEffect(() => {
    (async () => {
      await refreshTodos();
    })();
  }, []);

  async function refreshTodos() {
    setError('');
    setLoading(true);
    try {
      const data = await getTodos();
      setTodos(Array.isArray(data) ? data : (data?.items || []));
    } catch (e) {
      setError(e.message || 'Failed to load todos');
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!title.trim()) return;
    setError('');
    setCreating(true);
    try {
      await createTodo(title.trim());
      setTitle('');
      await refreshTodos();
    } catch (e) {
      setError(e.message || 'Failed to add todo');
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id) {
    setError('');
    try {
      await deleteTodo(id);
      await refreshTodos();
    } catch (e) {
      setError(e.message || 'Failed to delete todo');
    }
  }

  async function handleToggle(id) {
    setError('');
    try {
      await toggleTodo(id);
      await refreshTodos();
    } catch (e) {
      setError(e.message || 'Failed to toggle todo');
    }
  }

  function startEditing(todo) {
    setEditingId(todo.id);
    setEditingTitle(todo.title);
  }

  async function submitEdit(id) {
    const newTitle = editingTitle.trim();
    if (!newTitle) {
      setError('Title cannot be empty.');
      return;
    }
    setError('');
    try {
      const existing = todos.find(t => t.id === id);
      await updateTodo(id, { title: newTitle, completed: existing?.completed ?? false });
      setEditingId(null);
      setEditingTitle('');
      await refreshTodos();
    } catch (e) {
      setError(e.message || 'Failed to update todo');
    }
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingTitle('');
  }

  return (
    <div className="app-root">
      <header className="header">
        <div className="container">
          <h1 className="title">Todo</h1>
          <p className="subtitle">Stay organized with a clean, modern task list.</p>
        </div>
      </header>

      <main className="container">
        <section className="card input-card" aria-label="Add todo">
          <form onSubmit={handleAdd} className="todo-form">
            <input
              className="input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              aria-label="Todo title"
            />
            <button className="btn btn-primary" type="submit" disabled={creating}>
              {creating ? 'Adding...' : 'Add'}
            </button>
          </form>
          <div className="meta">
            <span className="chip chip-info">{todos.length} total</span>
            <span className="chip chip-success">{completedCount} completed</span>
          </div>
          {error && <div className="error" role="alert">{error}</div>}
        </section>

        <section className="list-section" aria-label="Todo list">
          {loading ? (
            <div className="loading">Loading todos...</div>
          ) : todos.length === 0 ? (
            <div className="empty">
              <div className="empty-emoji" aria-hidden="true">📝</div>
              <p>No tasks yet. Add your first todo!</p>
            </div>
          ) : (
            <ul className="todo-list" role="list">
              {todos.map((todo) => (
                <li key={todo.id} className={`todo-card card ${todo.completed ? 'is-complete' : ''}`}>
                  <div className="todo-left">
                    <input
                      type="checkbox"
                      className="checkbox"
                      checked={!!todo.completed}
                      onChange={() => handleToggle(todo.id)}
                      aria-label={`Mark "${todo.title}" as ${todo.completed ? 'incomplete' : 'complete'}`}
                    />
                    {editingId === todo.id ? (
                      <input
                        className="input input-inline"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') submitEdit(todo.id);
                          if (e.key === 'Escape') cancelEdit();
                        }}
                        aria-label="Edit todo title"
                        autoFocus
                      />
                    ) : (
                      <button
                        className="todo-title"
                        onClick={() => handleToggle(todo.id)}
                        title="Click to toggle complete"
                      >
                        <span className="title-text">{todo.title}</span>
                      </button>
                    )}
                  </div>

                  <div className="todo-actions">
                    {editingId === todo.id ? (
                      <>
                        <button className="btn btn-success" onClick={() => submitEdit(todo.id)} aria-label="Save">
                          Save
                        </button>
                        <button className="btn btn-ghost" onClick={cancelEdit} aria-label="Cancel">
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button className="btn btn-ghost" onClick={() => startEditing(todo)} aria-label="Edit">
                          Edit
                        </button>
                        <button className="btn btn-danger" onClick={() => handleDelete(todo.id)} aria-label="Delete">
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      <footer className="footer">
        <div className="container">
          <span>API: {process.env.REACT_APP_API_URL || 'http://localhost:3001'}</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
