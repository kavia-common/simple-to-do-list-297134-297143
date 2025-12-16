const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// Helper to handle JSON responses and errors
async function request(path, options = {}) {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
    });
    const contentType = res.headers.get('Content-Type') || '';
    const maybeJson = contentType.includes('application/json');
    const data = maybeJson ? await res.json() : null;

    if (!res.ok) {
      const message = (data && (data.detail || data.message)) || res.statusText;
      throw new Error(message || 'Request failed');
    }
    return data;
  } catch (err) {
    // Re-throw with consistent message
    throw new Error(err.message || 'Network error');
  }
}

// PUBLIC_INTERFACE
export async function getTodos() {
  /** Fetches all todos from the backend. */
  return request('/todos', { method: 'GET' });
}

// PUBLIC_INTERFACE
export async function createTodo(title) {
  /** Creates a new todo with the given title. */
  return request('/todos', {
    method: 'POST',
    body: JSON.stringify({ title }),
  });
}

// PUBLIC_INTERFACE
export async function updateTodo(id, { title, completed }) {
  /** Updates a todo's title and/or completed state. */
  return request(`/todos/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ title, completed }),
  });
}

// PUBLIC_INTERFACE
export async function deleteTodo(id) {
  /** Deletes a todo by id. */
  return request(`/todos/${id}`, { method: 'DELETE' });
}

// PUBLIC_INTERFACE
export async function toggleTodo(id) {
  /** Toggles a todo's completion state. Uses a PATCH helper endpoint if available, otherwise falls back to update. */
  // Try conventional toggle route first; if not available, we will fetch and update.
  try {
    return await request(`/todos/${id}/toggle`, { method: 'PATCH' });
  } catch (_) {
    // Fallback: GET list, find item, flip completed and update
    const todos = await getTodos();
    const item = todos.find((t) => t.id === id);
    if (!item) throw new Error('Todo not found');
    return updateTodo(id, { title: item.title, completed: !item.completed });
  }
}

export default {
  getTodos,
  createTodo,
  updateTodo,
  deleteTodo,
  toggleTodo,
};
