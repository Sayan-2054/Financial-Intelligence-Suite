// src/data/mutualFunds.js
// Curated list of popular Indian mutual funds with scheme codes
// Scheme codes from AMFI — used with mfapi.in

export const POPULAR_MF = [
  // ── Large Cap ──────────────────────────────────────────────────────────
  { schemeCode: '120503', name: 'Mirae Asset Large Cap Fund',        category: 'Large Cap',   risk: 'High' },
  { schemeCode: '120716', name: 'Axis Bluechip Fund',                category: 'Large Cap',   risk: 'High' },
  { schemeCode: '112090', name: 'Canara Robeco Bluechip Equity Fund',category: 'Large Cap',   risk: 'High' },

  // ── Flexi / Multi Cap ──────────────────────────────────────────────────
  { schemeCode: '125354', name: 'Parag Parikh Flexi Cap Fund',       category: 'Flexi Cap',   risk: 'High' },
  { schemeCode: '100356', name: 'HDFC Flexi Cap Fund',               category: 'Flexi Cap',   risk: 'High' },
  { schemeCode: '120594', name: 'Mirae Asset Flexi Cap Fund',        category: 'Flexi Cap',   risk: 'High' },

  // ── Mid Cap ────────────────────────────────────────────────────────────
  { schemeCode: '120841', name: 'Axis Midcap Fund',                  category: 'Mid Cap',     risk: 'Very High' },
  { schemeCode: '130503', name: 'Kotak Emerging Equity Fund',        category: 'Mid Cap',     risk: 'Very High' },
  { schemeCode: '100270', name: 'HDFC Mid-Cap Opportunities Fund',   category: 'Mid Cap',     risk: 'Very High' },

  // ── Small Cap ──────────────────────────────────────────────────────────
  { schemeCode: '120828', name: 'Axis Small Cap Fund',               category: 'Small Cap',   risk: 'Very High' },
  { schemeCode: '125497', name: 'Nippon India Small Cap Fund',       category: 'Small Cap',   risk: 'Very High' },
  { schemeCode: '100306', name: 'SBI Small Cap Fund',                category: 'Small Cap',   risk: 'Very High' },

  // ── ELSS (Tax Saving) ──────────────────────────────────────────────────
  { schemeCode: '120503', name: 'Mirae Asset Tax Saver Fund',        category: 'ELSS',        risk: 'High' },
  { schemeCode: '120594', name: 'Axis Long Term Equity Fund',        category: 'ELSS',        risk: 'High' },
  { schemeCode: '100304', name: 'SBI Long Term Equity Fund',         category: 'ELSS',        risk: 'High' },

  // ── Index Funds ────────────────────────────────────────────────────────
  { schemeCode: '120716', name: 'UTI Nifty 50 Index Fund',           category: 'Index Fund',  risk: 'High' },
  { schemeCode: '125354', name: 'HDFC Index Fund - Nifty 50',        category: 'Index Fund',  risk: 'High' },
  { schemeCode: '130503', name: 'Nippon India Index Fund - Nifty 50',category: 'Index Fund',  risk: 'High' },

  // ── Debt ───────────────────────────────────────────────────────────────
  { schemeCode: '119551', name: 'HDFC Short Term Debt Fund',         category: 'Short Duration', risk: 'Low to Moderate' },
  { schemeCode: '119026', name: 'ICICI Pru Short Term Fund',         category: 'Short Duration', risk: 'Low to Moderate' },

  // ── Hybrid ─────────────────────────────────────────────────────────────
  { schemeCode: '100270', name: 'HDFC Balanced Advantage Fund',      category: 'Hybrid',      risk: 'Moderate' },
  { schemeCode: '120841', name: 'ICICI Pru Balanced Advantage Fund', category: 'Hybrid',      risk: 'Moderate' },
]

export const MF_CATEGORIES = [
  { name: 'Large Cap',      icon: '🏦', desc: 'Top 100 companies by market cap' },
  { name: 'Mid Cap',        icon: '📈', desc: '101-250 ranked companies' },
  { name: 'Small Cap',      icon: '🚀', desc: 'High risk, high potential returns' },
  { name: 'Flexi Cap',      icon: '🔄', desc: 'Flexible allocation across caps' },
  { name: 'ELSS',           icon: '💰', desc: 'Tax saving under Section 80C' },
  { name: 'Index Fund',     icon: '📊', desc: 'Track Nifty/Sensex passively' },
  { name: 'Hybrid',         icon: '⚖️',  desc: 'Mix of equity and debt' },
  { name: 'Short Duration', icon: '🛡️',  desc: 'Lower risk debt funds' },
]

export const RISK_COLOR = {
  'Low':                'var(--signal-buy)',
  'Low to Moderate':    'var(--signal-buy)',
  'Moderate':           'var(--signal-hold)',
  'Moderately High':    'var(--signal-hold)',
  'High':               '#f97316',
  'Very High':          'var(--signal-sell)',
}