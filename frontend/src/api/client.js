// All fetch calls go through the Vite dev-proxy in dev.
// In production VITE_API_URL must be set to your Render backend URL.

const BASE = import.meta.env.VITE_API_URL ?? ''

class APIError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
    this.name = 'APIError'
  }
}

// Retry with exponential backoff — handles Render cold starts gracefully
async function requestWithRetry(path, options = {}, retries = 3, delayMs = 3000) {
  const ctrl  = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 180_000)

  for (let attempt = 1; attempt <= retries; attempt++) {
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
        // Don't retry 4xx errors — they are real errors, not transient
        if (res.status >= 400 && res.status < 500) throw new APIError(detail, res.status)
        // 5xx — retry
        if (attempt === retries) throw new APIError(detail, res.status)
        await sleep(delayMs * attempt)
        continue
      }
      return await res.json()

    } catch (err) {
      clearTimeout(timer)
      if (err.name === 'AbortError') throw new APIError('Request timed out after 3 minutes', 504)
      if (err instanceof APIError)   throw err
      // Network error (Render cold start, CORS, etc.) — retry
      if (attempt === retries) {
        throw new APIError(
          `Cannot reach the backend server. Make sure Render is running and VITE_API_URL is set correctly in Vercel. (${err.message})`,
          0
        )
      }
      await sleep(delayMs * attempt)
    }
  }
}

const sleep = ms => new Promise(res => setTimeout(res, ms))

export const fetchAnalysis        = (ticker, period = '6mo') => requestWithRetry(`/get-analysis/${encodeURIComponent(ticker)}?period=${period}`)
export const fetchRecommendations = ()                        => requestWithRetry('/get-recommendations')
export const sendChat             = (body)                    => requestWithRetry('/chat', { method: 'POST', body: JSON.stringify(body) })
export const clearSession         = (sid)                     => requestWithRetry(`/chat/session/${encodeURIComponent(sid)}`, { method: 'DELETE' })