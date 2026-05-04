import { useState, useCallback } from 'react'
import SearchBar    from './components/SearchBar.jsx'
import HomePage     from './components/HomePage.jsx'
import Dashboard    from './components/Dashboard.jsx'
import MFHomePage   from './components/MFHomePage.jsx'
import MFDashboard  from './components/MFDashboard.jsx'
import SIPCalculator from './components/SIPCalculator.jsx'

const MAX_RECENT = 5

export default function App() {
  // ── Tab: 'stocks' | 'mf' ──────────────────────────────────────────────
  const [tab, setTab] = useState('stocks')

  // ── Stocks state ──────────────────────────────────────────────────────
  const [ticker,          setTicker]          = useState(null)
  const [searchInput,     setSearchInput]      = useState('')
  const [loading,         setLoading]          = useState(false)
  const [recentStocks,    setRecentStocks]     = useState(() => {
    try { return JSON.parse(localStorage.getItem('fis_recent') ?? '[]') } catch { return [] }
  })

  // ── MF state ──────────────────────────────────────────────────────────
  const [mfScheme,        setMfScheme]         = useState(null) // { code, name }
  const [recentMFs,       setRecentMFs]        = useState(() => {
    try { return JSON.parse(localStorage.getItem('fis_recent_mf') ?? '[]') } catch { return [] }
  })

  // ── Stock navigation ──────────────────────────────────────────────────
  const navigateToStock = useCallback((t) => {
    const clean = t.toUpperCase().trim()
    if (!clean) return
    setTicker(clean)
    setSearchInput('')
    setRecentStocks(prev => {
      const next = [clean, ...prev.filter(x => x !== clean)].slice(0, MAX_RECENT)
      try { localStorage.setItem('fis_recent', JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  // ── MF navigation ─────────────────────────────────────────────────────
  const navigateToMF = useCallback((code, name) => {
    if (code === 'sip-only') {
      setMfScheme({ code: 'sip-only', name: 'SIP Calculator' })
      return
    }
    setMfScheme({ code, name })
    setRecentMFs(prev => {
      const next = [[code, name], ...prev.filter(([c]) => c !== code)].slice(0, MAX_RECENT)
      try { localStorage.setItem('fis_recent_mf', JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  const goHome = useCallback(() => {
    setTicker(null)
    setSearchInput('')
    setMfScheme(null)
  }, [])

  const switchTab = useCallback((t) => {
    setTab(t)
    setTicker(null)
    setMfScheme(null)
    setSearchInput('')
  }, [])

  const isOnDetail = ticker || mfScheme

  return (
    <div style={{
      minHeight: '100vh',
      background: `
        radial-gradient(ellipse 80% 50% at 50% -20%, rgba(34,211,238,0.04) 0%, transparent 70%),
        radial-gradient(ellipse 60% 40% at 80% 80%, rgba(99,102,241,0.03) 0%, transparent 60%),
        var(--bg-void)
      `,
    }}>

      {/* ── Sticky Header ── */}
      <header style={{
        background: 'rgba(8,12,18,0.9)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '14px 32px', position: 'sticky', top: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
      }}>

        {/* Logo */}
        <button onClick={goHome} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: 'var(--accent-cyan)', color: '#080c12',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18,
          }}>Φ</div>
          <div style={{ textAlign: 'left' }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: 'var(--text-primary)' }}>
              Financial Intelligence Suite
            </h1>
            <p style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
              POWERED BY ARIA · NOT FINANCIAL ADVICE
            </p>
          </div>
        </button>

        {/* ── Tab Switcher ── */}
        <div style={{
          display: 'flex', gap: 4, padding: '4px',
          background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
        }}>
          {[
            { id: 'stocks', label: '📈 Stocks' },
            { id: 'mf',     label: '📊 Mutual Funds' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => switchTab(t.id)}
              style={{
                padding: '7px 16px', borderRadius: 'var(--radius-sm)',
                background: tab === t.id ? 'var(--accent-cyan)' : 'transparent',
                color: tab === t.id ? '#080c12' : 'var(--text-secondary)',
                border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-display)', fontWeight: 700,
                fontSize: 12, letterSpacing: '0.04em', transition: 'all 0.2s',
                whiteSpace: 'nowrap',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Right side controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>

          {/* Back button — shown when on a detail page */}
          {isOnDetail && (
            <button
              onClick={goHome}
              style={{
                padding: '10px 14px', borderRadius: 'var(--radius-md)',
                background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
                color: 'var(--text-secondary)', cursor: 'pointer',
                fontFamily: 'var(--font-display)', fontWeight: 700,
                fontSize: 12, letterSpacing: '0.05em',
                display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-cyan)'; e.currentTarget.style.color = 'var(--accent-cyan)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
            >
              ← Back
            </button>
          )}

          {/* Stock search — only on stocks tab */}
          {tab === 'stocks' && (
            <SearchBar
              onSearch={navigateToStock}
              loading={loading}
              initialValue={searchInput}
            />
          )}

          {/* Home button */}
          <button
            onClick={goHome}
            style={{
              padding: '10px 14px', borderRadius: 'var(--radius-md)',
              background: isOnDetail ? 'var(--bg-elevated)' : 'var(--accent-cyan)',
              color: isOnDetail ? 'var(--text-secondary)' : '#080c12',
              border: '1px solid ' + (isOnDetail ? 'var(--border-default)' : 'var(--accent-cyan)'),
              cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 700,
              fontSize: 12, letterSpacing: '0.05em', transition: 'all 0.2s',
              whiteSpace: 'nowrap',
            }}
          >
            🏠
          </button>
        </div>
      </header>

      {/* ── Page Content ── */}

      {/* Stocks Tab */}
      {tab === 'stocks' && (
        ticker
          ? <Dashboard ticker={ticker} onLoading={setLoading} />
          : <HomePage   onSelectTicker={navigateToStock} recentlyViewed={recentStocks} />
      )}

      {/* Mutual Funds Tab */}
      {tab === 'mf' && (
        mfScheme
          ? mfScheme.code === 'sip-only'
            ? (
              <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 32px 100px' }}>
                <SIPCalculator defaultMonthly={5000} />
              </main>
            )
            : <MFDashboard schemeCode={mfScheme.code} schemeName={mfScheme.name} />
          : <MFHomePage onSelectFund={navigateToMF} recentlyViewed={recentMFs} />
      )}
    </div>
  )
}