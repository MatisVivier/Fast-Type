const API = 'http://localhost:3001/api';


export async function apiGet(path) {
const r = await fetch(`${API}${path}`, { credentials: 'include' });
return r.json();
}


export async function apiPost(path, body) {
const r = await fetch(`${API}${path}`, {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
credentials: 'include',
body: JSON.stringify(body)
});
return r.json();
}