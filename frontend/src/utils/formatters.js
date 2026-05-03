export function formatPrice(value, currency = 'USD') {
  if (value == null || isNaN(value)) return '—'
  const syms = { USD: '$', INR: '₹', EUR: '€', GBP: '£', JPY: '¥' }
  const sym = syms[currency] ?? `${currency} `
  return `${sym}${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function formatBigNum(n) {
  if (n == null) return '—'
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`
  if (n >= 1e9)  return `$${(n / 1e9).toFixed(2)}B`
  if (n >= 1e6)  return `$${(n / 1e6).toFixed(2)}M`
  return `$${n.toLocaleString()}`
}

export function fmtDate(str) {
  if (!str) return ''
  try {
    return new Date(str).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  } catch { return str }
}