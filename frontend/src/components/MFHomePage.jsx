// src/components/MFHomePage.jsx
import { useState, useRef, useEffect } from 'react'
import { searchMutualFunds }    from '../api/mfClient.js'
import { POPULAR_MF, MF_CATEGORIES, RISK_COLOR } from '../data/mutualFunds.js'

export default function MFHomePage({ onSelectFund, recentlyViewed }) {
  const [query,     setQuery]     = useState('')
  const [results,   setResults]   = useState([])
  const [searching, setSearching] = useState(false)
  const [showDrop,  setShowDrop]  = useState(false)
  const debounceRef = useRef(null)

  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); setShowDrop(false); return }
    clearTimeout(debounceRef.current)
    setSearching(true)
    debounceRef.current = setTimeout(async () => {
      const res = await searchMutualFunds(query)
      setResults(res)
      setShowDrop(true)
      setSearching(false)
    }, 400)
    return () => clearTimeout(debounceRef.current)
  }, [query])

  function handleSelect(schemeCode, schemeName) {
    setQuery(''); setResults([]); setShowDrop(false)
    onSelectFund(schemeCode, schemeName)
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 32px 100px' }}>

      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: 52 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '5px 14px', borderRadius: 20, marginBottom: 20,
          background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)',
        }}>
          <span style={{ fontSize: 14 }}>📊</span>
          <span style={{ fontSize: 11, color: 'var(--accent-indigo)', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}>
            AMFI INDIA · 2000+ SCHEMES · ZERO RENDER CALLS
          </span>
        </div>

        <h1 style={{
          fontFamily: 'var(--font-display)', fontWeight: 800,
          fontSize: 'clamp(26px, 4vw, 44px)', lineHeight: 1.15,
          background: 'linear-gradient(135deg, #e8edf5 0%, var(--accent-indigo) 60%, var(--accent-cyan) 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          marginBottom: 14,
        }}>
          Mutual Fund Intelligence
        </h1>
        <p style={{ fontSize: 15, color: 'var(--text-secondary)', maxWidth: 480, margin: '0 auto 32px', lineHeight: 1.7 }}>
          Search 2,000+ Indian mutual funds. Analyse NAV history, returns across periods, and plan your SIP — all offline, instant.
        </p>

        {/* Search */}
        <div style={{ position: 'relative', maxWidth: 580, margin: '0 auto' }}>
          <div style={{
            display: 'flex', alignItems: 'center',
            background: 'var(--bg-elevated)', border: '2px solid var(--border-default)',
            borderRadius: showDrop && results.length ? '14px 14px 0 0' : 14,
            boxShadow: '0 0 40px rgba(99,102,241,0.1)',
          }}>
            <span style={{ padding: '0 16px', fontSize: 20, color: 'var(--text-muted)', userSelect: 'none' }}>⌕</span>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onBlur={() => setTimeout(() => setShowDrop(false), 150)}
              onFocus={() => results.length && setShowDrop(true)}
              placeholder="Search fund name e.g. Mirae Asset, HDFC, Axis…"
              autoFocus
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                color: 'var(--text-primary)', fontFamily: 'var(--font-mono)',
                fontSize: 15, padding: '16px 0',
              }}
            />
            {searching && (
              <div style={{ padding: '0 14px' }}>
                <span style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid var(--border-default)', borderTopColor: 'var(--accent-indigo)', borderRadius: '50%', animation: 'spin 0.75s linear infinite' }} />
              </div>
            )}
            {query && !searching && (
              <button onClick={() => { setQuery(''); setResults([]); setShowDrop(false) }}
                style={{ padding: '0 16px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18 }}>×</button>
            )}
          </div>

          {/* Dropdown */}
          {showDrop && results.length > 0 && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 500,
              background: 'var(--bg-elevated)', border: '2px solid var(--border-default)',
              borderTop: 'none', borderRadius: '0 0 14px 14px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)', maxHeight: 360, overflowY: 'auto',
            }}>
              {results.map((f, i) => (
                <div
                  key={f.schemeCode}
                  onMouseDown={() => handleSelect(f.schemeCode, f.schemeName)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                    cursor: 'pointer', borderBottom: i < results.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <span style={{ fontSize: 20, flexShrink: 0 }}>🇮🇳</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {f.schemeName}
                    </p>
                    <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>
                      Scheme #{f.schemeCode}
                    </p>
                  </div>
                  <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'var(--bg-card)', color: 'var(--accent-indigo)', border: '1px solid rgba(99,102,241,0.2)', flexShrink: 0 }}>
                    MF
                  </span>
                </div>
              ))}
            </div>
          )}
          {showDrop && query.length >= 2 && results.length === 0 && !searching && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 500, background: 'var(--bg-elevated)', border: '2px solid var(--border-default)', borderTop: 'none', borderRadius: '0 0 14px 14px', padding: '16px', textAlign: 'center' }}>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>No funds found for "{query}"</p>
            </div>
          )}
        </div>
      </div>

      {/* Recently Viewed MFs */}
      {recentlyViewed.length > 0 && (
        <section style={{ marginBottom: 44 }}>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'var(--font-display)', marginBottom: 12 }}>
            Recently Viewed
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {recentlyViewed.map(([code, name]) => (
              <button key={code} onClick={() => onSelectFund(code, name)}
                style={{ padding: '7px 16px', borderRadius: 'var(--radius-md)', background: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: 12, cursor: 'pointer', transition: 'all 0.15s', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-indigo)'; e.currentTarget.style.color = 'var(--accent-indigo)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.color = 'var(--text-primary)' }}
              >
                ↺ {name}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Popular Funds */}
      <section style={{ marginBottom: 44 }}>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'var(--font-display)', marginBottom: 16 }}>
          Popular Funds
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {POPULAR_MF.slice(0, 12).map(f => (
            <button
              key={f.schemeCode + f.name}
              onClick={() => onSelectFund(f.schemeCode, f.name)}
              style={{
                padding: '14px 16px', borderRadius: 'var(--radius-lg)',
                background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
                cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left',
                display: 'flex', flexDirection: 'column', gap: 6,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-card)'; e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              <p style={{ fontSize: 13, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', lineHeight: 1.4 }}>{f.name}</p>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}>
                  {f.category}
                </span>
                <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, color: RISK_COLOR[f.risk] ?? 'var(--text-muted)', border: `1px solid ${RISK_COLOR[f.risk] ?? 'var(--border-subtle)'}20`, background: 'transparent' }}>
                  {f.risk}
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section style={{ marginBottom: 44 }}>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'var(--font-display)', marginBottom: 16 }}>
          Explore by Category
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
          {MF_CATEGORIES.map(cat => (
            <div key={cat.name} style={{
              padding: '18px 14px', borderRadius: 'var(--radius-lg)',
              background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
              textAlign: 'center', cursor: 'default',
            }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{cat.icon}</div>
              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', marginBottom: 4 }}>{cat.name}</p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>{cat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SIP standalone */}
      <section style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'var(--font-display)', marginBottom: 16 }}>
          SIP Calculator — Try It Now
        </p>
        {/* Lazy import SIPCalculator */}
        <div
          onClick={() => onSelectFund('sip-only', 'SIP Calculator')}
          style={{
            padding: '20px 24px', borderRadius: 'var(--radius-lg)',
            background: 'linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(34,211,238,0.08) 100%)',
            border: '1px solid rgba(99,102,241,0.25)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 16, transition: 'transform 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <span style={{ fontSize: 36 }}>📐</span>
          <div>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--text-primary)', marginBottom: 4 }}>
              Open SIP Calculator
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              Plan your investments with step-up SIP, inflation adjustment, and visual growth charts
            </p>
          </div>
          <span style={{ marginLeft: 'auto', fontSize: 20, color: 'var(--text-muted)' }}>→</span>
        </div>
      </section>

      <div style={{ padding: '12px 20px', borderRadius: 'var(--radius-md)', background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)', color: 'var(--text-muted)', fontSize: 11, lineHeight: 1.7 }}>
        ⚖ <strong style={{ color: 'var(--signal-hold)' }}>DISCLAIMER:</strong> Mutual fund investments are subject to market risks. Read all scheme related documents carefully. Past performance does not guarantee future returns. This tool is for educational purposes only.
      </div>
    </div>
  )
}