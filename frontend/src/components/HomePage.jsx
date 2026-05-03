import { useState } from 'react'
import { searchStocks } from '../data/stocks.js'

const POPULAR_INDIA = [
  { ticker: 'RELIANCE.NS', name: 'Reliance' },
  { ticker: 'TCS.NS',      name: 'TCS' },
  { ticker: 'HDFCBANK.NS', name: 'HDFC Bank' },
  { ticker: 'INFY.NS',     name: 'Infosys' },
  { ticker: 'SBIN.NS',     name: 'SBI' },
  { ticker: 'ICICIBANK.NS',name: 'ICICI Bank' },
  { ticker: 'BAJFINANCE.NS',name: 'Bajaj Fin' },
  { ticker: 'TATAMOTORS.NS',name: 'Tata Motors' },
  { ticker: 'WIPRO.NS',    name: 'Wipro' },
  { ticker: 'ADANIENT.NS', name: 'Adani Ent' },
]

const POPULAR_US = [
  { ticker: 'AAPL',  name: 'Apple' },
  { ticker: 'MSFT',  name: 'Microsoft' },
  { ticker: 'NVDA',  name: 'NVIDIA' },
  { ticker: 'GOOGL', name: 'Alphabet' },
  { ticker: 'AMZN',  name: 'Amazon' },
  { ticker: 'META',  name: 'Meta' },
  { ticker: 'TSLA',  name: 'Tesla' },
  { ticker: 'JPM',   name: 'JPMorgan' },
]

const SECTORS = [
  { icon: '🏦', name: 'Banking',     tickers: ['HDFCBANK.NS','ICICIBANK.NS','SBIN.NS','KOTAKBANK.NS','AXISBANK.NS'] },
  { icon: '💻', name: 'Technology',  tickers: ['TCS.NS','INFY.NS','WIPRO.NS','HCLTECH.NS','TECHM.NS'] },
  { icon: '⚡', name: 'Energy',      tickers: ['RELIANCE.NS','NTPC.NS','TATAPOWER.NS','ADANIGREEN.NS','ONGC.NS'] },
  { icon: '💊', name: 'Pharma',      tickers: ['SUNPHARMA.NS','DRREDDY.NS','CIPLA.NS','LUPIN.NS','DIVISLAB.NS'] },
  { icon: '🚗', name: 'Auto',        tickers: ['TATAMOTORS.NS','MARUTI.NS','BAJAJ-AUTO.NS','HEROMOTOCO.NS','EICHERMOT.NS'] },
  { icon: '🛒', name: 'FMCG',        tickers: ['HINDUNILVR.NS','ITC.NS','NESTLEIND.NS','DABUR.NS','MARICO.NS'] },
  { icon: '🏥', name: 'Healthcare',  tickers: ['APOLLOHOSP.NS','MAXHEALTH.NS','FORTIS.NS','NH.NS','LALPATHLAB.NS'] },
  { icon: '🏗',  name: 'Infra',      tickers: ['LT.NS','ADANIPORTS.NS','POWERGRID.NS','BHEL.NS','HAL.NS'] },
]

const FLAG = { IN:'🇮🇳', US:'🇺🇸', CN:'🇨🇳', TW:'🇹🇼', JP:'🇯🇵', DE:'🇩🇪', GB:'🇬🇧', SG:'🇸🇬', CA:'🇨🇦' }

export default function HomePage({ onSelectTicker, recentlyViewed }) {
  const [query,    setQuery]    = useState('')
  const [results,  setResults]  = useState([])
  const [showDrop, setShowDrop] = useState(false)
  const [highlight,setHighlight]= useState(-1)

  function handleInput(val) {
    setQuery(val)
    setHighlight(-1)
    if (val.trim().length >= 1) { setResults(searchStocks(val, 8)); setShowDrop(true) }
    else { setResults([]); setShowDrop(false) }
  }

  function handleSelect(ticker) {
    setQuery(''); setResults([]); setShowDrop(false)
    onSelectTicker(ticker)
  }

  function handleKey(e) {
    if (!showDrop || !results.length) {
      if (e.key === 'Enter' && query.trim()) handleSelect(query.trim())
      return
    }
    if (e.key === 'ArrowDown')  { e.preventDefault(); setHighlight(h => Math.min(h+1, results.length-1)) }
    else if (e.key === 'ArrowUp')  { e.preventDefault(); setHighlight(h => Math.max(h-1, 0)) }
    else if (e.key === 'Enter')    { e.preventDefault(); highlight >= 0 ? handleSelect(results[highlight].ticker) : handleSelect(query.trim()) }
    else if (e.key === 'Escape')   { setShowDrop(false) }
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 32px 100px' }}>

      {/* ── Hero ── */}
      <div style={{ textAlign: 'center', marginBottom: 52 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '5px 14px', borderRadius: 20, marginBottom: 20,
          background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.2)',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--signal-buy)', display: 'inline-block' }} />
          <span style={{ fontSize: 11, color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}>
            AI-POWERED · REAL-TIME · GLOBAL
          </span>
        </div>

        <h1 style={{
          fontFamily: 'var(--font-display)', fontWeight: 800,
          fontSize: 'clamp(28px, 5vw, 52px)', lineHeight: 1.15,
          background: 'linear-gradient(135deg, #e8edf5 0%, var(--accent-cyan) 50%, var(--accent-indigo) 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          marginBottom: 16,
        }}>
          Your Financial<br />Intelligence Hub
        </h1>

        <p style={{ fontSize: 16, color: 'var(--text-secondary)', maxWidth: 480, margin: '0 auto 32px', lineHeight: 1.7 }}>
          Search any stock, ETF, or index worldwide. Get AI-powered technical analysis, ML price forecasts, and investment signals instantly.
        </p>

        {/* ── Hero Search ── */}
        <div style={{ position: 'relative', maxWidth: 560, margin: '0 auto' }}>
          <div style={{
            display: 'flex', alignItems: 'center',
            background: 'var(--bg-elevated)', border: '2px solid var(--border-default)',
            borderRadius: showDrop && results.length ? '14px 14px 0 0' : 14,
            boxShadow: '0 0 40px rgba(34,211,238,0.1)',
            transition: 'border-color 0.2s',
          }}
            onFocus={() => {}} // keep border
          >
            <span style={{ padding: '0 16px', fontSize: 20, color: 'var(--text-muted)', userSelect: 'none' }}>⌕</span>
            <input
              value={query}
              onChange={e => handleInput(e.target.value)}
              onKeyDown={handleKey}
              onFocus={() => query.trim().length >= 1 && results.length && setShowDrop(true)}
              onBlur={() => setTimeout(() => setShowDrop(false), 150)}
              placeholder="Search stocks, company names, sectors…"
              autoFocus
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                color: 'var(--text-primary)', fontFamily: 'var(--font-mono)',
                fontSize: 16, padding: '16px 0',
              }}
            />
            {query && (
              <button onClick={() => { setQuery(''); setResults([]); setShowDrop(false) }}
                style={{ padding: '0 16px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18 }}>
                ×
              </button>
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
              {results.map((s, i) => (
                <div
                  key={s.ticker}
                  onMouseDown={() => handleSelect(s.ticker)}
                  onMouseEnter={() => setHighlight(i)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                    cursor: 'pointer', borderBottom: i < results.length-1 ? '1px solid var(--border-subtle)' : 'none',
                    background: highlight === i ? 'var(--bg-hover)' : 'transparent',
                    transition: 'background 0.1s',
                  }}
                >
                  <span style={{ fontSize: 20 }}>{FLAG[s.country] ?? '🌐'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{s.ticker} · {s.exchange}</p>
                  </div>
                  <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)', flexShrink: 0 }}>{s.sector}</span>
                </div>
              ))}
              <div style={{ padding: '7px 14px', fontSize: 10, color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: 12 }}>
                <span>↑↓ navigate</span><span>↵ select</span><span>esc close</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Recently Viewed ── */}
      {recentlyViewed.length > 0 && (
        <section style={{ marginBottom: 44 }}>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'var(--font-display)', marginBottom: 12 }}>
            Recently Viewed
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {recentlyViewed.map(ticker => (
              <button
                key={ticker}
                onClick={() => onSelectTicker(ticker)}
                style={{
                  padding: '7px 16px', borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-card)', border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: 13,
                  cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 6,
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-cyan)'; e.currentTarget.style.color = 'var(--accent-cyan)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.color = 'var(--text-primary)' }}
              >
                <span style={{ fontSize: 10, opacity: 0.5 }}>↺</span> {ticker}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ── Popular Indian Stocks ── */}
      <section style={{ marginBottom: 44 }}>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'var(--font-display)', marginBottom: 14 }}>
          🇮🇳 Popular Indian Stocks
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {POPULAR_INDIA.map(s => (
            <button
              key={s.ticker}
              onClick={() => onSelectTicker(s.ticker)}
              style={{
                padding: '8px 18px', borderRadius: 'var(--radius-md)',
                background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: 13,
                cursor: 'pointer', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.borderColor = 'var(--border-accent)'; e.currentTarget.style.color = 'var(--text-primary)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-card)'; e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
            >
              {s.name}
            </button>
          ))}
        </div>
      </section>

      {/* ── Popular US Stocks ── */}
      <section style={{ marginBottom: 44 }}>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'var(--font-display)', marginBottom: 14 }}>
          🇺🇸 Popular US Stocks
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {POPULAR_US.map(s => (
            <button
              key={s.ticker}
              onClick={() => onSelectTicker(s.ticker)}
              style={{
                padding: '8px 18px', borderRadius: 'var(--radius-md)',
                background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: 13,
                cursor: 'pointer', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.borderColor = 'var(--border-accent)'; e.currentTarget.style.color = 'var(--text-primary)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-card)'; e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
            >
              {s.name}
            </button>
          ))}
        </div>
      </section>

      {/* ── Explore by Sector ── */}
      <section style={{ marginBottom: 44 }}>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'var(--font-display)', marginBottom: 14 }}>
          Explore by Sector
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
          {SECTORS.map(sec => (
            <button
              key={sec.name}
              onClick={() => onSelectTicker(sec.tickers[0])}
              style={{
                padding: '16px 12px', borderRadius: 'var(--radius-lg)',
                background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.2s',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.borderColor = 'var(--border-accent)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-card)'; e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              <span style={{ fontSize: 28 }}>{sec.icon}</span>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{sec.name}</span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{sec.tickers.length} stocks</span>
            </button>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section style={{ marginBottom: 44 }}>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'var(--font-display)', marginBottom: 16 }}>
          How It Works
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          {[
            { icon: '🔍', title: 'Search Any Stock', desc: 'Type company name or ticker. Covers 200+ stocks across India, US, and global markets.' },
            { icon: '📊', title: 'Technical Analysis', desc: 'Instant RSI, MACD, moving averages, golden cross detection and sentiment scoring.' },
            { icon: '🤖', title: 'ML Price Forecast', desc: 'Random Forest model predicts next 7 days of price action with confidence bands.' },
            { icon: '💬', title: 'Ask ARIA', desc: 'Chat with our AI analyst to understand signals and indicators in plain language.' },
          ].map(c => (
            <div key={c.title} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '20px 18px' }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>{c.icon}</div>
              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', marginBottom: 6 }}>{c.title}</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Disclaimer ── */}
      <div style={{ padding: '12px 20px', borderRadius: 'var(--radius-md)', background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)', color: 'var(--text-muted)', fontSize: 11, lineHeight: 1.7 }}>
        ⚖ <strong style={{ color: 'var(--signal-hold)' }}>DISCLAIMER:</strong> All analysis, predictions, and signals are for educational purposes only and do not constitute financial advice. Consult a SEBI-registered advisor before investing.
      </div>
    </div>
  )
}