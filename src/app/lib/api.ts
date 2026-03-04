// Визначаємо базу API: якщо це режим розробки (на комп'ютері), використовуємо localhost.
// Якщо це зібраний сайт на Heroku (продакшен), використовуємо відносний шлях "/api".
const API_BASE = import.meta.env.DEV ? "http://localhost:3000/api" : "/api";

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

  try {
    const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
    const text = await response.text();
    const data = text ? JSON.parse(text) : {};

    if (!response.ok) {
      throw new Error(data.error || `Помилка запиту (${response.status})`);
    }

    return data as T;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error("Сервер повернув некоректну відповідь. Спробуйте ще раз.");
    }

    if (error instanceof TypeError) {
      throw new Error("Немає з'єднання з сервером. Перевірте інтернет або спробуйте пізніше.");
    }

    throw error;
  }
}