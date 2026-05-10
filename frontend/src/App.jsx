import { useState, useCallback, useEffect } from 'react'
import SearchBar      from './components/SearchBar.jsx'
import HomePage       from './components/HomePage.jsx'
import Dashboard      from './components/Dashboard.jsx'
import MFHomePage     from './components/MFHomePage.jsx'
import MFDashboard    from './components/MFDashboard.jsx'
import SIPCalculator  from './components/SIPCalculator.jsx'
import WatchlistPage  from './components/WatchlistPage.jsx'
import PortfolioPage  from './components/PortfolioPage.jsx'
import ComparisonPage from './components/ComparisonPage.jsx'
import HowItWorks     from './components/HowItWorks.jsx'
import OnboardingTour from './components/OnboardingTour.jsx'
import { useWatchlist }    from './hooks/useWatchlist.js'
import { useLocalStorage } from './hooks/useLocalStorage.js'
import { useTheme }        from './hooks/useTheme.js'

const MAX_RECENT = 5

const TABS = [
  { id: 'stocks',     label: '📈 Stocks' },
  { id: 'mf',         label: '📊 Mutual Funds' },
  { id: 'portfolio',  label: '📁 Portfolio' },
  { id: 'watchlist',  label: '★ Watchlist' },
  { id: 'compare',    label: '⚖ Compare' },
]

export default function App() {
  // ── Onboarding ────────────────────────────────────────────────────────
  const [tourDone, setTourDone] = useLocalStorage('fis_tour_done', false)
  const [showTour, setShowTour] = useState(!tourDone)
  const [showHIW,  setShowHIW]  = useState(false)

  // ── Tab ───────────────────────────────────────────────────────────────
  const [tab, setTab] = useState('stocks')

  // ── Stocks ────────────────────────────────────────────────────────────
  const [ticker,       setTicker]       = useState(null)
  const [searchInput,  setSearchInput]  = useState('')
  const [loading,      setLoading]      = useState(false)
  const [recentStocks, setRecentStocks] = useLocalStorage('fis_recent', [])

  // ── Mutual Funds ──────────────────────────────────────────────────────
  const [mfScheme,   setMfScheme]   = useState(null)
  const [recentMFs,  setRecentMFs]  = useLocalStorage('fis_recent_mf', [])

  // ── Watchlist badge count ─────────────────────────────────────────────
  const { list: watchlist } = useWatchlist()

  // ── Theme ─────────────────────────────────────────────────────────────
  const { theme, toggle: toggleTheme, isDark } = useTheme()

  // ── Navigation ────────────────────────────────────────────────────────
  const navigateToStock = useCallback((t) => {
    const clean = t.toUpperCase().trim()
    if (!clean) return
    setTicker(clean)
    setTab('stocks')
    setSearchInput('')
    setRecentStocks(prev => {
      const next = [clean, ...prev.filter(x => x !== clean)].slice(0, MAX_RECENT)
      return next
    })
  }, [setRecentStocks])

  const navigateToMF = useCallback((code, name) => {
    setMfScheme({ code, name })
    setTab('mf')
    if (code !== 'sip-only') {
      setRecentMFs(prev => {
        const next = [[code, name], ...prev.filter(([c]) => c !== code)].slice(0, MAX_RECENT)
        return next
      })
    }
  }, [setRecentMFs])

  const goHome = useCallback(() => {
    setTicker(null)
    setMfScheme(null)
    setSearchInput('')
    setShowHIW(false)
  }, [])

  const switchTab = useCallback((t) => {
    setTab(t)
    setTicker(null)
    setMfScheme(null)
    setSearchInput('')
    setShowHIW(false)
  }, [])

  function completeTour() {
    setTourDone(true)
    setShowTour(false)
  }

  const isOnDetail = ticker || mfScheme || showHIW

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh',
      background: `
        radial-gradient(ellipse 80% 50% at 50% -20%, rgba(34,211,238,0.04) 0%, transparent 70%),
        radial-gradient(ellipse 60% 40% at 80% 80%, rgba(99,102,241,0.03) 0%, transparent 60%),
        var(--bg-void)
      `,
    }}>

      {/* ── Onboarding Tour ── */}
      {showTour && <OnboardingTour onComplete={completeTour} />}

      {/* ── Sticky Header ── */}
      <header style={{
        background: 'var(--bg-deep)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '12px 24px', position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>

          {/* Logo */}
          <button onClick={() => { goHome(); setTab('stocks') }} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: 8,
              background: 'var(--accent-cyan)', color: '#080c12',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 17,
            }}>Φ</div>
            <div style={{ textAlign: 'left' }}>
              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14, color: 'var(--text-primary)' }}>
                Financial Intelligence Suite
              </p>
              <p style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
                NOT FINANCIAL ADVICE
              </p>
            </div>
          </button>

          {/* Tabs */}
          <div style={{
            display: 'flex', gap: 2, padding: '3px',
            background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)', flexWrap: 'wrap',
          }}>
            {TABS.map(t => {
              const badge = t.id === 'watchlist' && watchlist.length > 0 ? watchlist.length : null
              return (
                <button
                  key={t.id}
                  onClick={() => switchTab(t.id)}
                  style={{
                    padding: '6px 12px', borderRadius: 'var(--radius-sm)',
                    background: tab === t.id && !showHIW ? 'var(--accent-cyan)' : 'transparent',
                    color: tab === t.id && !showHIW ? '#080c12' : 'var(--text-secondary)',
                    border: 'none', cursor: 'pointer',
                    fontFamily: 'var(--font-display)', fontWeight: 700,
                    fontSize: 11, letterSpacing: '0.03em', transition: 'all 0.2s',
                    whiteSpace: 'nowrap', position: 'relative',
                  }}
                >
                  {t.label}
                  {badge && (
                    <span style={{
                      position: 'absolute', top: 2, right: 2,
                      width: 14, height: 14, borderRadius: '50%',
                      background: 'var(--signal-hold)', color: '#080c12',
                      fontSize: 8, fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>{badge}</span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Right controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              style={{
                width: 34, height: 34, borderRadius: 'var(--radius-md)',
                background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
                color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 16,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-cyan)'; e.currentTarget.style.color = 'var(--accent-cyan)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
            >
              {isDark ? '☀️' : '🌙'}
            </button>

            {/* How It Works button */}
            <button
              onClick={() => { setShowHIW(h => !h); setTicker(null); setMfScheme(null) }}
              title="How It Works"
              style={{
                padding: '8px 12px', borderRadius: 'var(--radius-md)',
                background: showHIW ? 'rgba(245,158,11,0.15)' : 'var(--bg-elevated)',
                border: `1px solid ${showHIW ? 'var(--signal-hold)' : 'var(--border-default)'}`,
                color: showHIW ? 'var(--signal-hold)' : 'var(--text-secondary)',
                cursor: 'pointer', fontFamily: 'var(--font-display)',
                fontWeight: 700, fontSize: 11, transition: 'all 0.2s', whiteSpace: 'nowrap',
              }}
            >
              ❓ How It Works
            </button>

            {/* Tutorial button */}
            <button
              onClick={() => setShowTour(true)}
              title="Start Tutorial"
              style={{
                padding: '8px 10px', borderRadius: 'var(--radius-md)',
                background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
                color: 'var(--text-secondary)', cursor: 'pointer',
                fontFamily: 'var(--font-display)', fontWeight: 700,
                fontSize: 11, transition: 'all 0.2s', whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-cyan)'; e.currentTarget.style.color = 'var(--accent-cyan)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
            >
              🎓 Tour
            </button>

            {/* Back button */}
            {isOnDetail && (
              <button onClick={goHome} style={{
                padding: '8px 12px', borderRadius: 'var(--radius-md)',
                background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
                color: 'var(--text-secondary)', cursor: 'pointer',
                fontFamily: 'var(--font-display)', fontWeight: 700,
                fontSize: 11, display: 'flex', alignItems: 'center', gap: 4,
                transition: 'all 0.2s', whiteSpace: 'nowrap',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-cyan)'; e.currentTarget.style.color = 'var(--accent-cyan)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
              >
                ← Back
              </button>
            )}

            {/* Stock search — stocks tab only */}
            {tab === 'stocks' && !showHIW && (
              <SearchBar onSearch={navigateToStock} loading={loading} initialValue={searchInput} />
            )}

            {/* Home */}
            <button onClick={() => { goHome(); setTab(tab) }} style={{
              width: 34, height: 34, borderRadius: 'var(--radius-md)',
              background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
              color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-cyan)'; e.currentTarget.style.color = 'var(--accent-cyan)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
              title="Home"
            >🏠</button>
          </div>
        </div>
      </header>

      {/* ── Page Content ── */}

      {/* How It Works overlay */}
      {showHIW && <HowItWorks onClose={() => setShowHIW(false)} />}

      {/* Stocks tab */}
      {!showHIW && tab === 'stocks' && (
        ticker
          ? <Dashboard ticker={ticker} onLoading={setLoading} />
          : <HomePage onSelectTicker={navigateToStock} recentlyViewed={recentStocks} />
      )}

      {/* MF tab */}
      {!showHIW && tab === 'mf' && (
        mfScheme
          ? mfScheme.code === 'sip-only'
            ? <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 32px 100px' }}><SIPCalculator defaultMonthly={5000} /></main>
            : <MFDashboard schemeCode={mfScheme.code} schemeName={mfScheme.name} />
          : <MFHomePage onSelectFund={navigateToMF} recentlyViewed={recentMFs} />
      )}

      {/* Portfolio tab */}
      {!showHIW && tab === 'portfolio' && (
        <PortfolioPage onSelectTicker={navigateToStock} />
      )}

      {/* Watchlist tab */}
      {!showHIW && tab === 'watchlist' && (
        <WatchlistPage onSelectTicker={navigateToStock} onSelectFund={navigateToMF} />
      )}

      {/* Compare tab */}
      {!showHIW && tab === 'compare' && (
        <ComparisonPage onSelectTicker={navigateToStock} />
      )}
    </div>
  )
}