import { useState, useCallback } from 'react'
import SearchBar   from './components/SearchBar.jsx'
import HomePage    from './components/HomePage.jsx'
import Dashboard   from './components/Dashboard.jsx'

const MAX_RECENT = 5

export default function App() {
  const [ticker,         setTicker]         = useState(null)     // null = home screen
  const [searchInput,    setSearchInput]     = useState('')
  const [recentlyViewed, setRecentlyViewed]  = useState(() => {
    try { return JSON.parse(localStorage.getItem('fis_recent') ?? '[]') }
    catch { return [] }
  })
  const [loading, setLoading] = useState(false)

  const navigateTo = useCallback((t) => {
    const clean = t.toUpperCase().trim()
    if (!clean) return
    setTicker(clean)
    setSearchInput('')
    // Update recently viewed
    setRecentlyViewed(prev => {
      const next = [clean, ...prev.filter(x => x !== clean)].slice(0, MAX_RECENT)
      try { localStorage.setItem('fis_recent', JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  const goHome = useCallback(() => {
    setTicker(null)
    setSearchInput('')
  }, [])

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
        {/* Logo — clicking goes home */}
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
            <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: 'var(--text-primary)', letterSpacing: '0.02em' }}>
              Financial Intelligence Suite
            </h1>
            <p style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
              POWERED BY ARIA · NOT FINANCIAL ADVICE
            </p>
          </div>
        </button>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Smart Search Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <SearchBar
            onSearch={navigateTo}
            loading={loading}
            initialValue={searchInput}
          />
          <button
            onClick={goHome}
            style={{
              padding: '10px 16px', borderRadius: 'var(--radius-md)',
              background: ticker ? 'var(--bg-elevated)' : 'var(--accent-cyan)',
              color: ticker ? 'var(--text-secondary)' : '#080c12',
              border: '1px solid ' + (ticker ? 'var(--border-default)' : 'var(--accent-cyan)'),
              cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 700,
              fontSize: 12, letterSpacing: '0.05em', transition: 'all 0.2s',
              whiteSpace: 'nowrap',
            }}
          >
            🏠 HOME
          </button>
        </div>
      </header>

      {/* ── Page Content ── */}
      {ticker ? (
        <Dashboard
          ticker={ticker}
          onSearch={navigateTo}
          onLoading={setLoading}
        />
      ) : (
        <HomePage
          onSelectTicker={navigateTo}
          recentlyViewed={recentlyViewed}
        />
      )}
    </div>
  )
}