
const API_BASE = (
  import.meta.env.VITE_API_URL ||
  "http://127.0.0.1:8000/api/v1"
).replace(/\/$/, "");

async function request(path, { token, ...options } = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;

  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });
  } catch (error) {
    throw new Error(
      `Backend connection failed. Check API URL: ${API_BASE}`
    );
  }

  if (response.status === 204) {
    return null;
  }

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const detail = body.detail;

    const message = Array.isArray(detail)
      ? detail.map((x) => x.msg).join(", ")
      : detail || `Request failed (${response.status})`;

    throw new Error(message);
  }

  return body;
}

export const api = {
  health: () => request("/health"),

  register: (data) =>
    request("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  login: (data) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  tasks: (token, params = {}) => {
    const query = new URLSearchParams({
      page: "1",
      page_size: "100",
      ...params,
    });

    return request(`/tasks?${query}`, { token });
  },

  createTask: (token, data) =>
    request("/tasks", {
      token,
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateTask: (token, id, data) =>
    request(`/tasks/${id}`, {
      token,
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteTask: (token, id) =>
    request(`/tasks/${id}`, {
      token,
      method: "DELETE",
    }),
};

