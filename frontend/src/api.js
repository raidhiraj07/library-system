const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export async function api(path, { method='GET', body, token } = {}){
  const headers = { 'Content-Type': 'application/json' }
  const t = token || localStorage.getItem('token')
  if (t) headers['Authorization'] = 'Bearer ' + t
  const res = await fetch(API_URL + path, { method, headers, body: body ? JSON.stringify(body) : undefined })
  if (!res.ok) throw new Error((await res.json()).error || 'Request failed')
  return res.json()
}
