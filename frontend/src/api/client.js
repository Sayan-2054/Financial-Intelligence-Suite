// All fetch calls go through the Vite dev-proxy → http://localhost:8000
// In production set VITE_API_URL to your backend origin.

const BASE = import.meta.env.VITE_API_URL ?? ''

class APIError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
    this.name = 'APIError'
  }
}

async function request(path, options = {}) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 180_000)

  try {
    const res = await fetch(`${BASE}${path}`, {
      ...options,
      signal: ctrl.signal,
      headers: { 'Content-Type': 'application/json', ...options.headers },
    })
    clearTimeout(timer)

    if (!res.ok) {
      let detail = `HTTP ${res.status}`
      try { detail = (await res.json()).detail ?? detail } catch { /* */ }
      throw new APIError(detail, res.status)
    }
    return res.json()
  } catch (err) {
    clearTimeout(timer)
    if (err.name === 'AbortError') throw new APIError('Request timed out', 504)
    throw err
  }
}

export const fetchAnalysis       = (ticker, period = '2y') => request(`/get-analysis/${encodeURIComponent(ticker)}?period=${period}`)
export const fetchRecommendations = ()       => request('/get-recommendations')
export const sendChat            = (body)   => request('/chat', { method: 'POST', body: JSON.stringify(body) })
export const clearSession        = (sid)    => request(`/chat/session/${encodeURIComponent(sid)}`, { method: 'DELETE' })