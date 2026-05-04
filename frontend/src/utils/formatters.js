export function formatPrice(value, currency = 'USD') {
  if (value == null || isNaN(value)) return '—'
  const syms = { USD: '$', INR: '₹', EUR: '€', GBP: '£', JPY: '¥' }
  const sym = syms[currency] ?? `${currency} `
  return `${sym}${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function formatBigNum(n, currency = 'USD') {
  if (n == null) return '—'
  const syms = { USD: '$', INR: '₹', EUR: '€', GBP: '£', JPY: '¥' }
  const sym = syms[currency] ?? `${currency} `
  if (n >= 1e12) return `${sym}${(n / 1e12).toFixed(2)}T`
  if (n >= 1e9)  return `${sym}${(n / 1e9).toFixed(2)}B`
  if (n >= 1e6)  return `${sym}${(n / 1e6).toFixed(2)}M`
  return `${sym}${n.toLocaleString()}`
}

export function fmtDate(str) {
  if (!str) return ''
  try {
    return new Date(str).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  } catch { return str }
}