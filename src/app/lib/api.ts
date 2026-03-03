const API_BASE = "http://localhost:3000/api";

export function getToken() {
  return localStorage.getItem("rn_token") || "";
}

export function setToken(token: string) {
  localStorage.setItem("rn_token", token);
}

export function clearToken() {
  localStorage.removeItem("rn_token");
}

export async function api<T>(path: string, options: RequestInit = {}, auth = false): Promise<T> {
  const headers: HeadersInit = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (auth && getToken()) headers.Authorization = `Bearer ${getToken()}`;

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Помилка запиту");
  return data as T;
}
