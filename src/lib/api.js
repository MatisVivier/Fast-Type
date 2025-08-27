// src/lib/api.js
const PROD_API = 'https://fast-type-back.onrender.com/api' // TODO: remplace par l'URL Render de ton back

const API_BASE_URL = import.meta.env.PROD
  ? PROD_API
  : 'http://localhost:3001/api'

export async function apiGet(path) {
  const r = await fetch(`${API_BASE_URL}${path}`, {
    method: 'GET',
    credentials: 'include',
  })
  return r.json()
}

export async function apiPost(path, body) {
  const r = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return r.json()
}
