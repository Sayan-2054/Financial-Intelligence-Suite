import { useState, useEffect } from 'react'
import { fetchAnalysis } from '../api/client.js'
import { POPULAR_INDIA, POPULAR_US } from '../data/stocks.js'
import { formatPrice, formatBigNum } from '../utils/formatters.js'

// ── Batch fetcher — max N concurrent requests ──────────────────────────────

async function fetchBatch(tickers, concurrency = 2) {
  const results = []
  for (let i = 0; i < tickers.length; i += concurrency) {
    const batch = tickers.slice(i, i + concurrency)
    const settled = await Promise.allSettled(batch.map(t => fetchAnalysis(t)))
    settled.forEach((r, j) => {
      results.push({
        ticker: batch[j],
        data: r.status === 'fulfilled' && !r.value.error ? r.value : null,
      })
    })
    // Small pause between batches so Render isn't overwhelmed
    if (i + concurrency < tickers.length) {
      await new Promise(res => setTimeout(res, 800))
    }
  }
  return results
}

// ── Mini Stock Card ────────────────────────────────────────────────────────

function StockCard({ ticker, data, loading, onSelect }) {
  const ret  = data?.forecast?.expected_return_pct ?? 0
  const up   = ret >= 0
  const signalColor = data?.signal === 'BUY'  ? 'var(--signal-buy)'
                    : data?.signal === 'SELL' ? 'var(--signal-sell)'
                    : 'var(--signal-hold)'

  return (
    <div
      onClick={() => data && onSelect(ticker)}
      style={{
        background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)', padding: '16px 18px',
        cursor: data ? 'pointer' : 'default',
        transition: 'border-color 0.2s, transform 0.15s',
        minWidth: 160, flex: '0 0 auto',
      }}
      onMouseEnter={e => { if (data) { e.currentTarget.style.borderColor = 'var(--border-accent)'; e.currentTarget.style.transform = 'translateY(-2px)' }}}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.transform = 'translateY(0)' }}
    >
      {loading ? (
        // Skeleton
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ height: 10, width: '40%', background: 'var(--bg-elevated)', borderRadius: 4, opacity: 0.6 }} />
          <div style={{ height: 10, width: '70%', background: 'var(--bg-elevated)', borderRadius: 4, opacity: 0.4 }} />
          <div style={{ height: 20, width: '55%', background: 'var(--bg-elevated)', borderRadius: 4, opacity: 0.5, marginTop: 4 }} />
          <div style={{ height: 10, width: '60%', background: 'var(--bg-elevated)', borderRadius: 4, opacity: 0.3 }} />
        </div>
      ) : !data ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            {ticker.replace('.NS', '').replace('.BO', '')}
          </p>
          <p style={{ fontSize: 10, color: 'var(--signal-sell)', marginTop: 4 }}>Failed to load</p>
          <button
            onClick={e => { e.stopPropagation(); onSelect(ticker) }}
            style={{
              marginTop: 6, fontSize: 10, padding: '3px 8px',
              background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
              color: 'var(--text-secondary)', borderRadius: 'var(--radius-sm)',
              cursor: 'pointer', fontFamily: 'var(--font-mono)',
            }}
          >
            Open →
          </button>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <div>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 2 }}>
                {ticker.replace('.NS', '').replace('.BO', '')}
              </p>
              <p style={{
                fontSize: 12, color: 'var(--text-secondary)',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 130,
              }}>
                {data.company_name}
              </p>
            </div>
            <div style={{
              width: 8, height: 8, borderRadius: '50%', flexShrink: 0, marginTop: 4,
              background: signalColor, boxShadow: `0 0 6px ${signalColor}`,
            }} />
          </div>
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--text-primary)', marginBottom: 4 }}>
            {formatPrice(data.current_price, data.currency)}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: up ? 'var(--signal-buy)' : 'var(--signal-sell)' }}>
              {up ? '▲' : '▼'} {Math.abs(ret).toFixed(2)}%
              <span style={{ color: 'var(--text-muted)', fontSize: 10, marginLeft: 3 }}>7d</span>
            </span>
            <span style={{
              fontSize: 10, padding: '2px 7px', borderRadius: 20,
              background: data.signal === 'BUY'  ? 'var(--signal-buy-dim)'
                        : data.signal === 'SELL' ? 'var(--signal-sell-dim)' : 'var(--signal-hold-dim)',
              color: signalColor, fontFamily: 'var(--font-display)', fontWeight: 600,
            }}>
              {data.signal}
            </span>
          </div>
        </>
      )}
    </div>
  )
}

// ── Section Header ─────────────────────────────────────────────────────────

function SectionHeader({ title, sub }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--text-primary)' }}>
        {title}
      </h2>
      {sub && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</p>}
    </div>
  )
}

// ── Horizontal scroll row ──────────────────────────────────────────────────

function ScrollRow({ children }) {
  return (
    <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'thin' }}>
      {children}
    </div>
  )
}

// ── Stock Row Section (batched) ────────────────────────────────────────────

function StockSection({ title, sub, tickers, onSelect }) {
  const [cards, setCards] = useState(
    tickers.map(t => ({ ticker: t, data: null, loading: true }))
  )

  useEffect(() => {
    let cancelled = false
    async function load() {
      const results = await fetchBatch(tickers, 2)
      if (cancelled) return
      setCards(results.map(r => ({ ticker: r.ticker, data: r.data, loading: false })))
    }
    load()
    return () => { cancelled = true }
  }, [])

  return (
    <section style={{ marginBottom: 40 }}>
      <SectionHeader title={title} sub={sub} />
      <ScrollRow>
        {cards.map(c => (
          <StockCard
            key={c.ticker}
            ticker={c.ticker}
            data={c.data}
            loading={c.loading}
            onSelect={onSelect}
          />
        ))}
      </ScrollRow>
    </section>
  )
}

// ── Top Movers (batched) ───────────────────────────────────────────────────

function TopMovers({ tickers, onSelect }) {
  const [gainers, setGainers] = useState([])
  const [losers,  setLosers]  = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      // Only fetch 6 for movers to keep it fast
      const results = await fetchBatch(tickers.slice(0, 6), 2)
      if (cancelled) return
      const valid = results.filter(r => r.data).map(r => r.data)
      valid.sort((a, b) => Math.abs(b.forecast?.expected_return_pct ?? 0) - Math.abs(a.forecast?.expected_return_pct ?? 0))
      setGainers(valid.filter(s => (s.forecast?.expected_return_pct ?? 0) >= 0).slice(0, 3))
      setLosers( valid.filter(s => (s.forecast?.expected_return_pct ?? 0) <  0).slice(0, 3))
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [])

  const MoverRow = ({ s, type }) => (
    <div
      onClick={() => onSelect(s.ticker)}
      style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '12px 16px', cursor: 'pointer',
        borderBottom: '1px solid var(--border-subtle)',
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
        <p style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: type === 'gain' ? 'var(--signal-buy)' : 'var(--signal-sell)' }}>
          {type === 'gain' ? '▲' : '▼'} {Math.abs(s.forecast?.expected_return_pct ?? 0).toFixed(2)}%
        </p>
      </div>
    </div>
  )

  const placeholder = (
    <div style={{ padding: '20px 16px', textAlign: 'center' }}>
      <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
        {loading ? 'Fetching data…' : 'No data'}
      </span>
    </div>
  )

  return (
    <section style={{ marginBottom: 40 }}>
      <SectionHeader title="Top Movers" sub="Based on 7-day ML forecast · India" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)', overflow: 'hidden',
        }}>
          <div style={{ padding: '12px 16px', background: 'var(--signal-buy-dim)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ color: 'var(--signal-buy)' }}>▲</span>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: 'var(--signal-buy)' }}>TOP GAINERS (Predicted)</span>
          </div>
          {gainers.length ? gainers.map(s => <MoverRow key={s.ticker} s={s} type="gain" />) : placeholder}
        </div>
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)', overflow: 'hidden',
        }}>
          <div style={{ padding: '12px 16px', background: 'var(--signal-sell-dim)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ color: 'var(--signal-sell)' }}>▼</span>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: 'var(--signal-sell)' }}>TOP LOSERS (Predicted)</span>
          </div>
          {losers.length ? losers.map(s => <MoverRow key={s.ticker} s={s} type="loss" />) : placeholder}
        </div>
      </div>
    </section>
  )
}

// ── Recently Viewed ────────────────────────────────────────────────────────

function RecentlyViewed({ history, onSelect }) {
  if (!history.length) return null
  return (
    <section style={{ marginBottom: 40 }}>
      <SectionHeader title="Recently Viewed" sub="Your last searches" />
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {history.map(ticker => (
          <button
            key={ticker}
            onClick={() => onSelect(ticker)}
            style={{
              padding: '8px 16px', borderRadius: 'var(--radius-md)',
              background: 'var(--bg-card)', border: '1px solid var(--border-default)',
              color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: 13,
              cursor: 'pointer', transition: 'border-color 0.2s, color 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-cyan)'; e.currentTarget.style.color = 'var(--accent-cyan)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.color = 'var(--text-primary)' }}
          >
            {ticker}
          </button>
        ))}
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
          AI-powered analysis for stocks worldwide. Search any company name above — no ticker codes needed.
        </p>
        <div style={{
          marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '6px 14px', borderRadius: 20,
          background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.2)',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--signal-buy)', display: 'inline-block' }} />
          <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
            Cards load in batches · first load may take ~30s on free tier
          </span>
        </div>
      </div>

      {/* Recently Viewed */}
      <RecentlyViewed history={recentlyViewed} onSelect={onSelectTicker} />

      {/* Top Movers */}
      <TopMovers tickers={POPULAR_INDIA} onSelect={onSelectTicker} />

      {/* Indian Stocks */}
      <StockSection
        title="🇮🇳 Top Indian Stocks"
        sub="Nifty 50 blue chips · loads in batches of 2"
        tickers={POPULAR_INDIA}
        onSelect={onSelectTicker}
      />

      {/* US Stocks */}
      <StockSection
        title="🇺🇸 Top US Stocks"
        sub="S&P 500 mega caps · loads in batches of 2"
        tickers={POPULAR_US}
        onSelect={onSelectTicker}
      />

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