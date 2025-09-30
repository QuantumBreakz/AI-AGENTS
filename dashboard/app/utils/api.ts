export const AGENT2_API = process.env.NEXT_PUBLIC_AGENT2_API || 'http://localhost:8000/api/v1'
export const AGENT3_API = process.env.NEXT_PUBLIC_AGENT3_API || 'http://localhost:8001/api/v1'

export type AgentId = 2 | 3

function getBase(agent?: AgentId) {
  if (agent === 3) return AGENT3_API
  return AGENT2_API
}

export async function apiFetch(path: string, options: RequestInit = {}, agent?: AgentId) {
  const base = getBase(agent)
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
  const res = await fetch(`${base}${path}`, { ...options, headers })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`API ${res.status}: ${text || res.statusText}`)
  }
  const contentType = res.headers.get('content-type') || ''
  if (contentType.includes('application/json')) return res.json()
  return res.text()
}

export function setToken(token: string) {
  if (typeof window !== 'undefined') localStorage.setItem('token', token)
}

export function clearToken() {
  if (typeof window !== 'undefined') localStorage.removeItem('token')
}

