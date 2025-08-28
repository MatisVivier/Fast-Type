// src/lib/api.js
export const API_BASE =
  import.meta.env.VITE_API_BASE || 'https://fast-type-back.onrender.com/api';

async function apiFetch(path, options = {}) {
  const res = await fetch(
    path.startsWith('http') ? path : `${API_BASE}${path}`,
    {
      credentials: 'include', // cookies cross-site
      ...options,
    }
  );

  const ct = res.headers.get('content-type') || '';
  const isJson = ct.includes('application/json');
  const data = isJson ? await res.json().catch(() => ({})) : await res.text();

  if (!res.ok) {
    // remonte une erreur lisible même si c'est du HTML
    const err = isJson ? data : { error: 'http_error', status: res.status, body: data };
    throw err;
  }
  return data;
}

export const apiGet = (path) => apiFetch(path);
export const apiPost = (path, body) =>
  apiFetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
export const apiDelete = (path) =>
  apiFetch(path, { method: 'DELETE' });
