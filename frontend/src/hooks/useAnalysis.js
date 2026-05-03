import { useState, useEffect } from 'react'
import { fetchAnalysis } from '../api/client.js'

export function useAnalysis(ticker) {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    if (!ticker) return

    let cancelled = false
    setLoading(true)
    setData(null)
    setError(null)

    fetchAnalysis(ticker)
      .then(d  => { if (!cancelled) { setData(d); setError(null) } })
      .catch(e => { if (!cancelled)   setError(e.message ?? 'Failed to fetch') })
      .finally(()=> { if (!cancelled)  setLoading(false) })

    return () => { cancelled = true }
  }, [ticker])

  return { data, loading, error }
}