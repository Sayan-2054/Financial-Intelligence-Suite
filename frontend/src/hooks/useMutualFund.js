// src/hooks/useMutualFund.js
import { useState, useEffect, useCallback } from 'react'
import { fetchMFData, computeReturns } from '../api/mfClient.js'

export function useMutualFund(schemeCode) {
  const [data,     setData]     = useState(null)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)
  const [retryKey, setRetryKey] = useState(0)

  const retry = useCallback(() => setRetryKey(k => k + 1), [])

  useEffect(() => {
    if (!schemeCode) return
    let cancelled = false
    setLoading(true)
    setData(null)
    setError(null)

    fetchMFData(schemeCode)
      .then(raw => {
        if (cancelled) return
        const returns = computeReturns(raw.data)
        const latestNav = raw.data?.[0]
        setData({
          schemeCode,
          schemeName: raw.meta?.scheme_name ?? 'Unknown Fund',
          fundHouse:  raw.meta?.fund_house   ?? '',
          category:   raw.meta?.scheme_category ?? '',
          type:       raw.meta?.scheme_type ?? '',
          navHistory: raw.data ?? [],   // newest first
          currentNav: latestNav ? parseFloat(latestNav.nav) : null,
          navDate:    latestNav?.date ?? '',
          returns,
        })
      })
      .catch(e => { if (!cancelled) setError(e.message) })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [schemeCode, retryKey])

  return { data, loading, error, retry }
}