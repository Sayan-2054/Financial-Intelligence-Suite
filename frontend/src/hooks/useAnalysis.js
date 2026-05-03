import { useState, useEffect } from 'react'
import { fetchAnalysis } from '../api/client.js'

export function useAnalysis(ticker, period = '2y') {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    if (!ticker) return

    let cancelled = false
    setLoading(true)
    setData(null)
    setError(null)

    fetchAnalysis(ticker, period)
      .then(d  => { if (!cancelled) { setData(d); setError(null) } })
      .catch(e => { if (!cancelled)   setError(e.message ?? 'Failed to fetch') })
      .finally(()=> { if (!cancelled)  setLoading(false) })

    return () => { cancelled = true }
  }, [ticker, period])

  return { data, loading, error }
}