// src/data/mutualFunds.js
// Verified scheme codes from AMFI India (https://www.amfiindia.com)
// Direct Growth plans only — use mfapi.in to verify: https://api.mfapi.in/mf/{schemeCode}

export const POPULAR_MF = [
  // ── Large Cap ─────────────────────────────────────────────────────────
  { schemeCode: '118989', name: 'Mirae Asset Large Cap Fund - Direct Growth',        category: 'Large Cap',      risk: 'High' },
  { schemeCode: '120503', name: 'Axis Bluechip Fund - Direct Growth',                category: 'Large Cap',      risk: 'High' },
  { schemeCode: '130503', name: 'Canara Robeco Bluechip Equity Fund - Direct Growth',category: 'Large Cap',      risk: 'High' },

  // ── Flexi Cap ─────────────────────────────────────────────────────────
  { schemeCode: '122639', name: 'Parag Parikh Flexi Cap Fund - Direct Growth',       category: 'Flexi Cap',      risk: 'High' },
  { schemeCode: '119598', name: 'HDFC Flexi Cap Fund - Direct Growth',               category: 'Flexi Cap',      risk: 'High' },
  { schemeCode: '135781', name: 'UTI Flexi Cap Fund - Direct Growth',                category: 'Flexi Cap',      risk: 'High' },

  // ── Mid Cap ───────────────────────────────────────────────────────────
  { schemeCode: '120841', name: 'Axis Midcap Fund - Direct Growth',                  category: 'Mid Cap',        risk: 'Very High' },
  { schemeCode: '136179', name: 'Kotak Emerging Equity Fund - Direct Growth',        category: 'Mid Cap',        risk: 'Very High' },
  { schemeCode: '118560', name: 'HDFC Mid-Cap Opportunities Fund - Direct Growth',   category: 'Mid Cap',        risk: 'Very High' },

  // ── Small Cap ─────────────────────────────────────────────────────────
  { schemeCode: '128090', name: 'Axis Small Cap Fund - Direct Growth',               category: 'Small Cap',      risk: 'Very High' },
  { schemeCode: '118778', name: 'Nippon India Small Cap Fund - Direct Growth',       category: 'Small Cap',      risk: 'Very High' },
  { schemeCode: '125494', name: 'SBI Small Cap Fund - Direct Growth',                category: 'Small Cap',      risk: 'Very High' },

  // ── ELSS ──────────────────────────────────────────────────────────────
  { schemeCode: '120505', name: 'Mirae Asset Tax Saver Fund - Direct Growth',        category: 'ELSS',           risk: 'High' },
  { schemeCode: '120594', name: 'Axis Long Term Equity Fund - Direct Growth',        category: 'ELSS',           risk: 'High' },
  { schemeCode: '125354', name: 'SBI Long Term Equity Fund - Direct Growth',         category: 'ELSS',           risk: 'High' },

  // ── Index Funds ───────────────────────────────────────────────────────
  { schemeCode: '120716', name: 'UTI Nifty 50 Index Fund - Direct Growth',           category: 'Index Fund',     risk: 'High' },
  { schemeCode: '120828', name: 'HDFC Index Fund - Nifty 50 - Direct Growth',        category: 'Index Fund',     risk: 'High' },
  { schemeCode: '118825', name: 'Nippon India Index Fund - Nifty 50 - Direct Growth',category: 'Index Fund',     risk: 'High' },

  // ── Debt ──────────────────────────────────────────────────────────────
  { schemeCode: '119061', name: 'HDFC Short Term Debt Fund - Direct Growth',         category: 'Short Duration', risk: 'Low to Moderate' },
  { schemeCode: '120847', name: 'ICICI Pru Short Term Fund - Direct Growth',         category: 'Short Duration', risk: 'Low to Moderate' },

  // ── Hybrid ────────────────────────────────────────────────────────────
  { schemeCode: '119533', name: 'HDFC Balanced Advantage Fund - Direct Growth',      category: 'Hybrid',         risk: 'Moderate' },
  { schemeCode: '120586', name: 'ICICI Pru Balanced Advantage Fund - Direct Growth', category: 'Hybrid',         risk: 'Moderate' },
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