const BASE_URL = import.meta.env.VITE_API_URL || '/api';
const TOKEN_KEY = 'sweety_token';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export class ApiError extends Error {
  constructor(status, body) {
    super(body?.error || 'Something went wrong. Please try again.');
    this.status = status;
    this.errors = body?.errors || {};
  }
}

async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, { error: 'Cannot reach the server. Is the API running?' });
  }

  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, data);
  return data;
}

export const api = {
  register: (payload) => request('POST', '/auth/register', payload),
  login: (payload) => request('POST', '/auth/login', payload),
  me: () => request('GET', '/auth/me'),

  listReadings: (params = {}) => request('GET', `/readings?${new URLSearchParams(params)}`),
  createReading: (payload) => request('POST', '/readings', payload),
  updateReading: (id, payload) => request('PUT', `/readings/${id}`, payload),
  deleteReading: (id) => request('DELETE', `/readings/${id}`),

  reports: (date) => request('GET', `/reports?date=${date}`),
  trend: (date) => request('GET', `/reports/trend?date=${date}`),
};
