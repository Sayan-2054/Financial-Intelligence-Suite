import { useState, useEffect } from 'react'
import { fetchAnalysis } from '../api/client.js'
import { POPULAR_INDIA, POPULAR_US } from '../data/stocks.js'
import { formatPrice, formatBigNum } from '../utils/formatters.js'

// ── Mini Stock Card ────────────────────────────────────────────────────────

function StockCard({ ticker, onSelect }) {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetchAnalysis(ticker)
      .then(d  => { if (!cancelled) setData(d) })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [ticker])

  const signalColor = data?.signal === 'BUY'  ? 'var(--signal-buy)'
                    : data?.signal === 'SELL' ? 'var(--signal-sell)'
                    : 'var(--signal-hold)'

  const ret = data?.forecast?.expected_return_pct ?? 0
  const up  = ret >= 0

  return (
    <div
      onClick={() => data && onSelect(ticker)}
      style={{
        background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)', padding: '16px 18px',
        cursor: data ? 'pointer' : 'default', transition: 'border-color 0.2s, transform 0.15s',
        minWidth: 160, flex: '0 0 auto',
      }}
      onMouseEnter={e => { if (data) { e.currentTarget.style.borderColor = 'var(--border-accent)'; e.currentTarget.style.transform = 'translateY(-2px)' }}}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.transform = 'translateY(0)' }}
    >
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[60, 40, 50].map((w, i) => (
            <div key={i} style={{
              height: i === 0 ? 14 : 10, width: `${w}%`,
              background: 'var(--bg-elevated)', borderRadius: 4,
              animation: 'pulse 1.5s ease-in-out infinite',
            }} />
          ))}
        </div>
      ) : data ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <div>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 2 }}>
                {ticker.replace('.NS', '').replace('.BO', '')}
              </p>
              <p style={{
                fontSize: 12, color: 'var(--text-secondary)',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                maxWidth: 130,
              }}>
                {data.company_name}
              </p>
            </div>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: signalColor, boxShadow: `0 0 6px ${signalColor}`,
              flexShrink: 0, marginTop: 4,
            }} />
          </div>

          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--text-primary)', marginBottom: 4 }}>
            {formatPrice(data.current_price, data.currency)}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{
              fontSize: 11, fontFamily: 'var(--font-mono)',
              color: up ? 'var(--signal-buy)' : 'var(--signal-sell)',
            }}>
              {up ? '▲' : '▼'} {Math.abs(ret).toFixed(2)}% <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>7d</span>
            </span>
            <span style={{
              fontSize: 10, padding: '2px 7px', borderRadius: 20,
              background: data.signal === 'BUY'  ? 'var(--signal-buy-dim)'
                        : data.signal === 'SELL' ? 'var(--signal-sell-dim)'
                        : 'var(--signal-hold-dim)',
              color: signalColor,
              fontFamily: 'var(--font-display)', fontWeight: 600,
            }}>
              {data.signal}
            </span>
          </div>
        </>
      ) : (
        <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Failed to load</p>
      )}
    </div>
  )
}

// ── Section Header ─────────────────────────────────────────────────────────

function SectionHeader({ title, sub, action, onAction }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
      <div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--text-primary)' }}>
          {title}
        </h2>
        {sub && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</p>}
      </div>
      {action && (
        <button onClick={onAction} style={{
          background: 'none', border: '1px solid var(--border-default)',
          color: 'var(--accent-cyan)', fontSize: 12, padding: '5px 14px',
          borderRadius: 'var(--radius-md)', cursor: 'pointer', fontFamily: 'var(--font-mono)',
          transition: 'border-color 0.2s',
        }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent-cyan)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-default)'}
        >
          {action} →
        </button>
      )}
    </div>
  )
}

// ── Horizontal scroll row ─────────────────────────────────────────────────

function ScrollRow({ children }) {
  return (
    <div style={{
      display: 'flex', gap: 12, overflowX: 'auto',
      paddingBottom: 8,
      scrollbarWidth: 'thin',
    }}>
      {children}
    </div>
  )
}

// ── Recently Viewed ────────────────────────────────────────────────────────

function RecentlyViewed({ history, onSelect }) {
  if (!history.length) return null
  return (
    <section style={{ marginBottom: 40 }}>
      <SectionHeader title="Recently Viewed" sub="Your last 5 searches" />
      <ScrollRow>
        {history.map(ticker => (
          <StockCard key={ticker} ticker={ticker} onSelect={onSelect} />
        ))}
      </ScrollRow>
    </section>
  )
}

// ── Top Movers ─────────────────────────────────────────────────────────────

function TopMovers({ tickers, onSelect }) {
  const [stocks, setStocks] = useState([])

  useEffect(() => {
    let cancelled = false
    Promise.allSettled(tickers.map(t => fetchAnalysis(t)))
      .then(results => {
        if (cancelled) return
        const data = results
          .filter(r => r.status === 'fulfilled' && !r.value.error)
          .map(r => r.value)
          .sort((a, b) => Math.abs(b.forecast?.expected_return_pct ?? 0) - Math.abs(a.forecast?.expected_return_pct ?? 0))
        setStocks(data)
      })
    return () => { cancelled = true }
  }, [])

  const gainers = stocks.filter(s => (s.forecast?.expected_return_pct ?? 0) >= 0).slice(0, 4)
  const losers  = stocks.filter(s => (s.forecast?.expected_return_pct ?? 0) < 0).slice(0, 4)

  return (
    <section style={{ marginBottom: 40 }}>
      <SectionHeader title="Top Movers" sub="Based on 7-day ML forecast" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Gainers */}
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)', overflow: 'hidden',
        }}>
          <div style={{
            padding: '12px 16px', background: 'var(--signal-buy-dim)',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{ color: 'var(--signal-buy)', fontSize: 14 }}>▲</span>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: 'var(--signal-buy)' }}>
              TOP GAINERS (Predicted)
            </span>
          </div>
          {gainers.length === 0 ? (
            <div style={{ padding: 16, textAlign: 'center' }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Loading…</span>
            </div>
          ) : gainers.map((s, i) => (
            <div
              key={s.ticker}
              onClick={() => onSelect(s.ticker)}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 16px', cursor: 'pointer',
                borderBottom: i < gainers.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div>
                <p style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--text-mono)' }}>
                  {s.ticker.replace('.NS', '')}
                </p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{s.company_name}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 13, fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {formatPrice(s.current_price, s.currency)}
                </p>
                <p style={{ fontSize: 12, color: 'var(--signal-buy)', fontFamily: 'var(--font-mono)' }}>
                  ▲ {(s.forecast?.expected_return_pct ?? 0).toFixed(2)}%
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Losers */}
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)', overflow: 'hidden',
        }}>
          <div style={{
            padding: '12px 16px', background: 'var(--signal-sell-dim)',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{ color: 'var(--signal-sell)', fontSize: 14 }}>▼</span>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: 'var(--signal-sell)' }}>
              TOP LOSERS (Predicted)
            </span>
          </div>
          {losers.length === 0 ? (
            <div style={{ padding: 16, textAlign: 'center' }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Loading…</span>
            </div>
          ) : losers.map((s, i) => (
            <div
              key={s.ticker}
              onClick={() => onSelect(s.ticker)}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 16px', cursor: 'pointer',
                borderBottom: i < losers.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div>
                <p style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--text-mono)' }}>
                  {s.ticker.replace('.NS', '')}
                </p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{s.company_name}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 13, fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {formatPrice(s.current_price, s.currency)}
                </p>
                <p style={{ fontSize: 12, color: 'var(--signal-sell)', fontFamily: 'var(--font-mono)' }}>
                  ▼ {Math.abs(s.forecast?.expected_return_pct ?? 0).toFixed(2)}%
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Main HomePage ──────────────────────────────────────────────────────────

export default function HomePage({ onSelectTicker, recentlyViewed }) {
  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 32px 100px' }}>

      {/* Hero */}
      <div style={{ marginBottom: 40 }}>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontWeight: 800,
          fontSize: 'clamp(24px, 4vw, 40px)',
          background: 'linear-gradient(135deg, var(--accent-cyan) 0%, var(--accent-indigo) 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          marginBottom: 8,
        }}>
          Your Financial Intelligence Hub
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 500 }}>
          AI-powered analysis for stocks worldwide. Search any company or use the watchlists below to get started.
        </p>
      </div>

      {/* Recently Viewed */}
      <RecentlyViewed history={recentlyViewed} onSelect={onSelectTicker} />

      {/* Top Movers — India */}
      <TopMovers tickers={POPULAR_INDIA} onSelect={onSelectTicker} />

      {/* Popular India */}
      <section style={{ marginBottom: 40 }}>
        <SectionHeader
          title="🇮🇳 Top Indian Stocks"
          sub="Nifty 50 blue chips"
          action="View all"
          onAction={() => {}}
        />
        <ScrollRow>
          {POPULAR_INDIA.map(t => (
            <StockCard key={t} ticker={t} onSelect={onSelectTicker} />
          ))}
        </ScrollRow>
      </section>

      {/* Popular US */}
      <section style={{ marginBottom: 40 }}>
        <SectionHeader
          title="🇺🇸 Top US Stocks"
          sub="S&P 500 mega caps"
          action="View all"
          onAction={() => {}}
        />
        <ScrollRow>
          {POPULAR_US.map(t => (
            <StockCard key={t} ticker={t} onSelect={onSelectTicker} />
          ))}
        </ScrollRow>
      </section>

      {/* Disclaimer */}
      <div style={{
        padding: '12px 20px', borderRadius: 'var(--radius-md)',
        background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)',
        color: 'var(--text-muted)', fontSize: 11, lineHeight: 1.7,
      }}>
        ⚖ <strong style={{ color: 'var(--signal-hold)' }}>DISCLAIMER:</strong> All predictions
        and signals are generated by machine learning models for educational purposes only.
        They do not constitute financial advice. Consult a SEBI-registered advisor before investing.
      </div>
    </div>
  )
}