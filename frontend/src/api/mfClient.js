// src/api/mfClient.js
// Mutual Fund data via mfapi.in (free, no key, called directly from browser)
// AMFI India data — covers all ~2000+ Indian mutual fund schemes
// Zero load on Render backend

const MF_BASE    = 'https://api.mfapi.in/mf'
const AMFI_SEARCH = 'https://api.mfapi.in/mf/search'

// ── Search funds by name ────────────────────────────────────────────────────
export async function searchMutualFunds(query) {
  if (!query || query.trim().length < 2) return []
  try {
    const res  = await fetch(`${AMFI_SEARCH}?q=${encodeURIComponent(query)}`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    return data.slice(0, 12).map(f => ({
      schemeCode: f.schemeCode,
      schemeName: f.schemeName,
    }))
  } catch (e) {
    console.error('MF search error:', e)
    return []
  }
}

// ── Fetch full fund data ────────────────────────────────────────────────────
export async function fetchMFData(schemeCode) {
  const res  = await fetch(`${MF_BASE}/${schemeCode}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  return data
}

// ── Compute returns from NAV history ────────────────────────────────────────
export function computeReturns(navData) {
  if (!navData || navData.length < 2) return {}

  // navData is newest-first from mfapi
  const sorted = [...navData].reverse() // oldest first
  const latest = parseFloat(sorted[sorted.length - 1].nav)

  function returnFor(days) {
    if (sorted.length <= days) return null
    const old = parseFloat(sorted[sorted.length - 1 - days].nav)
    if (!old || old === 0) return null
    return ((latest - old) / old) * 100
  }

  function cagrFor(years) {
    const days = Math.floor(years * 365)
    if (sorted.length <= days) return null
    const old = parseFloat(sorted[sorted.length - 1 - days].nav)
    if (!old || old === 0) return null
    return (Math.pow(latest / old, 1 / years) - 1) * 100
  }

  const inceptionNav = parseFloat(sorted[0].nav)
  const inceptionYears = sorted.length / 365

  return {
    return_1m:   returnFor(30),
    return_3m:   returnFor(90),
    return_6m:   returnFor(180),
    return_1y:   returnFor(365),
    cagr_3y:     cagrFor(3),
    cagr_5y:     cagrFor(5),
    since_inception: inceptionYears > 0.5
      ? (Math.pow(latest / inceptionNav, 1 / inceptionYears) - 1) * 100
      : null,
  }
}

// ── Filter NAV history by period ─────────────────────────────────────────────
export function filterNavByPeriod(navData, period) {
  if (!navData || !navData.length) return []
  const sorted = [...navData].reverse() // oldest first

  const days = {
    '1m':  30,
    '3m':  90,
    '6m':  180,
    '1y':  365,
    '3y':  365 * 3,
    '5y':  365 * 5,
    'all': Infinity,
  }[period] ?? 180

  const subset = days === Infinity ? sorted : sorted.slice(-days)
  return subset.map(d => ({
    date:  d.date,
    close: parseFloat(d.nav),
  }))
}

// ── SIP Calculator ───────────────────────────────────────────────────────────
export function calculateSIP({
  monthlyAmount,
  years,
  expectedReturnPct,
  stepUpPct = 0,       // annual step-up % (0 = no step-up)
  inflationPct = 6,    // for real returns
}) {
  const months       = years * 12
  const monthlyRate  = expectedReturnPct / 100 / 12
  const inflationAdj = expectedReturnPct - inflationPct

  let totalInvested  = 0
  let maturityValue  = 0
  let currentSIP     = monthlyAmount

  const yearlyData = []

  for (let y = 1; y <= years; y++) {
    const yearStartSIP = currentSIP
    for (let m = 0; m < 12; m++) {
      totalInvested  += currentSIP
      maturityValue   = (maturityValue + currentSIP) * (1 + monthlyRate)
    }
    yearlyData.push({
      year:      y,
      invested:  Math.round(totalInvested),
      value:     Math.round(maturityValue),
      sip:       Math.round(yearStartSIP),
    })
    if (stepUpPct > 0) currentSIP *= (1 + stepUpPct / 100)
  }

  // Real (inflation-adjusted) maturity value
  const realValue = maturityValue / Math.pow(1 + inflationPct / 100, years)

  return {
    totalInvested:  Math.round(totalInvested),
    maturityValue:  Math.round(maturityValue),
    wealthGained:   Math.round(maturityValue - totalInvested),
    realValue:      Math.round(realValue),
    absoluteReturn: ((maturityValue - totalInvested) / totalInvested) * 100,
    yearlyData,
  }
}