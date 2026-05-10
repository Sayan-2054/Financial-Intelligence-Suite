// src/components/ComparisonPage.jsx
import { useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { fetchAnalysis }  from '../api/client.js'
import { searchStocks }   from '../data/stocks.js'
import { formatPrice }    from '../utils/formatters.js'
import ChatBot            from './ChatBot.jsx'

const COLORS = ['#22d3ee', '#a78bfa', '#fb923c']
const MAX = 3

function StockSearch({ index, onAdd, already }) {
  const [query,   setQuery]   = useState('')
  const [results, setResults] = useState([])

  function handleInput(val) {
    setQuery(val)
    setResults(val.trim().length >= 1 ? searchStocks(val, 6) : [])
  }

  function pick(stock) {
    if (already.includes(stock.ticker)) return
    onAdd(stock)
    setQuery('')
    setResults([])
  }

  return (
    <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
      <div style={{
        display: 'flex', alignItems: 'center',
        background: 'var(--bg-elevated)', border: `2px solid ${COLORS[index]}40`,
        borderRadius: 'var(--radius-md)', overflow: 'visible',
      }}>
        <span style={{ padding: '0 10px', color: COLORS[index], fontSize: 14 }}>⌕</span>
        <input
          value={query}
          onChange={e => handleInput(e.target.value)}
          onBlur={() => setTimeout(() => setResults([]), 150)}
          placeholder={`Stock ${index + 1}…`}
          style={{
            flex: 1, background: 'transparent', border: 'none', outline: 'none',
            color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: 13,
            padding: '10px 0',
          }}
        />
      </div>
      {results.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
          background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-md)', maxHeight: 220, overflowY: 'auto',
          boxShadow: '0 12px 30px rgba(0,0,0,0.4)', marginTop: 4,
        }}>
          {results.map(s => (
            <div key={s.ticker} onMouseDown={() => pick(s)}
              style={{
                padding: '9px 14px', cursor: already.includes(s.ticker) ? 'not-allowed' : 'pointer',
                opacity: already.includes(s.ticker) ? 0.4 : 1,
                borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.1s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <p style={{ fontSize: 12, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{s.name}</p>
              <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>{s.ticker} · {s.exchange}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function StatRow({ label, values, format = v => v?.toFixed(2) ?? '—', highlight = 'max' }) {
  const nums = values.map(v => typeof v === 'number' ? v : null)
  const best = highlight === 'max'
    ? Math.max(...nums.filter(n => n !== null))
    : Math.min(...nums.filter(n => n !== null))

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: `180px repeat(${values.length}, 1fr)`,
      gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border-subtle)',
      alignItems: 'center',
    }}>
      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</span>
      {values.map((v, i) => {
        const num   = typeof v === 'number' ? v : null
        const isBest = num !== null && num === best
        return (
          <span key={i} style={{
            fontSize: 13, fontFamily: 'var(--font-mono)',
            color: isBest ? COLORS[i] : 'var(--text-primary)',
            fontWeight: isBest ? 700 : 400,
            textAlign: 'center',
          }}>
            {num !== null ? format(num) : '—'}
            {isBest && <span style={{ marginLeft: 4, fontSize: 10 }}>✓</span>}
          </span>
        )
      })}
    </div>
  )
}

export default function ComparisonPage({ onSelectTicker }) {
  const [stocks,   setStocks]   = useState([])
  const [data,     setData]     = useState({})
  const [loading,  setLoading]  = useState({})
  const [chatOpen, setChatOpen] = useState(false)

  function addStock(stock) {
    if (stocks.length >= MAX || stocks.find(s => s.ticker === stock.ticker)) return
    setStocks(prev => [...prev, stock])
    setLoading(prev => ({ ...prev, [stock.ticker]: true }))
    fetchAnalysis(stock.ticker, '6mo')
      .then(d  => setData(prev => ({ ...prev, [stock.ticker]: d })))
      .catch(() => {})
      .finally(() => setLoading(prev => ({ ...prev, [stock.ticker]: false })))
  }

  function removeStock(ticker) {
    setStocks(prev => prev.filter(s => s.ticker !== ticker))
    setData(prev => { const n = { ...prev }; delete n[ticker]; return n })
  }

  // Build normalised chart data (% change from first close)
  const chartData = (() => {
    const series = stocks.map(s => data[s.ticker]?.historical_prices ?? [])
    if (!series.some(s => s.length)) return []
    const minLen = Math.min(...series.filter(s => s.length).map(s => s.length))
    const sliced = series.map(s => s.slice(-minLen))
    return sliced[0]?.map((_, i) => {
      const row = { date: sliced[0][i]?.date }
      stocks.forEach((s, si) => {
        const base = parseFloat(sliced[si][0]?.close)
        const cur  = parseFloat(sliced[si][i]?.close)
        if (base && cur) row[s.ticker] = parseFloat(((cur - base) / base * 100).toFixed(2))
      })
      return row
    }) ?? []
  })()

  const already = stocks.map(s => s.ticker)

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 32px 100px' }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, color: 'var(--text-primary)', marginBottom: 6 }}>
          ⚖ Stock Comparison
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          Compare up to {MAX} stocks side by side — price performance, signals, and indicators
        </p>
      </div>

      {/* Search row */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 28 }}>
        {Array.from({ length: MAX }).map((_, i) => {
          const stock = stocks[i]
          return stock ? (
            <div key={i} style={{
              flex: 1, minWidth: 180, display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 14px', borderRadius: 'var(--radius-md)',
              background: `${COLORS[i]}15`, border: `2px solid ${COLORS[i]}60`,
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 12, color: COLORS[i], fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{stock.ticker}</p>
                <p style={{ fontSize: 11, color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{stock.name}</p>
              </div>
              {loading[stock.ticker] && (
                <span style={{ display: 'inline-block', width: 14, height: 14, border: `2px solid ${COLORS[i]}40`, borderTopColor: COLORS[i], borderRadius: '50%', animation: 'spin 0.75s linear infinite', flexShrink: 0 }} />
              )}
              <button onClick={() => removeStock(stock.ticker)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16, flexShrink: 0 }}>×</button>
            </div>
          ) : (
            <StockSearch key={i} index={i} onAdd={addStock} already={already} />
          )
        })}
      </div>

      {stocks.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>⚖</div>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: 'var(--text-secondary)', marginBottom: 8 }}>
            Search for stocks above to start comparing
          </p>
          <p style={{ fontSize: 12 }}>Type any company name — no ticker codes needed</p>
        </div>
      )}

      {stocks.length >= 2 && chartData.length > 0 && (
        <>
          {/* Price Chart */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '20px 24px', marginBottom: 20 }}>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-display)', marginBottom: 16 }}>
              Relative Price Performance (% change, 6 months)
            </p>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 9 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickLine={false} axisLine={false}
                  tickFormatter={v => `${v > 0 ? '+' : ''}${v.toFixed(0)}%`} width={52} />
                <Tooltip
                  formatter={(v, name) => [`${v > 0 ? '+' : ''}${v.toFixed(2)}%`, name]}
                  contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 8, fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text-secondary)' }} />
                {stocks.map((s, i) => (
                  <Line key={s.ticker} type="monotone" dataKey={s.ticker} name={s.ticker}
                    stroke={COLORS[i]} strokeWidth={2} dot={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Stats Comparison */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '20px 24px' }}>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-display)', marginBottom: 4 }}>
              Head-to-Head Comparison
            </p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 16 }}>
              ✓ = best value for that metric
            </p>

            {/* Column Headers */}
            <div style={{ display: 'grid', gridTemplateColumns: `180px repeat(${stocks.length}, 1fr)`, gap: 12, padding: '8px 0', marginBottom: 4 }}>
              <span />
              {stocks.map((s, i) => (
                <span key={s.ticker} style={{ fontSize: 13, fontFamily: 'var(--font-display)', fontWeight: 700, color: COLORS[i], textAlign: 'center', cursor: 'pointer' }}
                  onClick={() => onSelectTicker(s.ticker)}>
                  {s.ticker.replace('.NS','')} ↗
                </span>
              ))}
            </div>

            <StatRow label="Current Price"     values={stocks.map(s => data[s.ticker]?.current_price)}           format={v => formatPrice(v, data[stocks[0]?.ticker]?.currency)} highlight="none" />
            <StatRow label="Signal Strength"   values={stocks.map(s => data[s.ticker]?.signal_strength)}         format={v => `${v.toFixed(0)}/100`} highlight="max" />
            <StatRow label="7D Forecast %"     values={stocks.map(s => data[s.ticker]?.forecast?.expected_return_pct)} format={v => `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`} highlight="max" />
            <StatRow label="RSI (14)"          values={stocks.map(s => data[s.ticker]?.indicators?.rsi)}         format={v => v.toFixed(2)} highlight="none" />
            <StatRow label="MACD Histogram"    values={stocks.map(s => data[s.ticker]?.indicators?.macd_histogram)} format={v => v.toFixed(4)} highlight="max" />
            <StatRow label="vs 50-Day SMA"     values={stocks.map(s => data[s.ticker]?.indicators?.price_vs_sma50 === 'above' ? 1 : 0)} format={v => v === 1 ? '↑ Above' : '↓ Below'} highlight="max" />
            <StatRow label="vs 200-Day SMA"    values={stocks.map(s => data[s.ticker]?.indicators?.price_vs_sma200 === 'above' ? 1 : 0)} format={v => v === 1 ? '↑ Above' : '↓ Below'} highlight="max" />
            <StatRow label="P/E Ratio"         values={stocks.map(s => data[s.ticker]?.pe_ratio)}                format={v => v.toFixed(1)} highlight="min" />

            {/* Signal Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: `180px repeat(${stocks.length}, 1fr)`, gap: 12, padding: '12px 0', marginTop: 4 }}>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Signal</span>
              {stocks.map((s, i) => {
                const sig = data[s.ticker]?.signal
                const color = sig === 'BUY' ? 'var(--signal-buy)' : sig === 'SELL' ? 'var(--signal-sell)' : 'var(--signal-hold)'
                const bg    = sig === 'BUY' ? 'var(--signal-buy-dim)' : sig === 'SELL' ? 'var(--signal-sell-dim)' : 'var(--signal-hold-dim)'
                return (
                  <div key={s.ticker} style={{ display: 'flex', justifyContent: 'center' }}>
                    <span style={{ padding: '4px 14px', borderRadius: 20, background: bg, color, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12 }}>
                      {sig ?? '—'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}

      {stocks.length === 1 && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
          <p style={{ fontSize: 14 }}>Add at least one more stock to compare</p>
        </div>
      )}

      {/* ARIA Chat FAB */}
      <button
        onClick={() => setChatOpen(o => !o)}
        title="Ask ARIA about this comparison"
        style={{
          position: 'fixed', bottom: 28, right: 28, zIndex: 300,
          width: 52, height: 52, borderRadius: '50%',
          background: chatOpen ? 'var(--bg-elevated)' : 'var(--accent-cyan)',
          color: chatOpen ? 'var(--text-secondary)' : '#080c12',
          border: '1px solid ' + (chatOpen ? 'var(--border-default)' : 'var(--accent-cyan)'),
          cursor: 'pointer', fontSize: 22,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: 'var(--shadow-glow-cyan)', transition: 'all 0.2s',
        }}
      >
        {chatOpen ? '×' : '◎'}
      </button>

      {chatOpen && (
        <ChatBot
          ticker={stocks[0]?.ticker ?? null}
          hasAnalysis={stocks.length > 0 && !!data[stocks[0]?.ticker]}
          onClose={() => setChatOpen(false)}
          context={stocks.length >= 2
            ? `Comparing stocks: ${stocks.map(s => s.ticker).join(' vs ')}\n` +
              stocks.map(s => {
                const d = data[s.ticker]
                if (!d) return `${s.ticker}: loading...`
                return `${s.ticker} (${s.name}): Price ${d.current_price}, Signal ${d.signal} (${d.signal_strength}/100), RSI ${d.indicators?.rsi?.toFixed(1)}, 7D forecast ${d.forecast?.expected_return_pct?.toFixed(2)}%`
              }).join('\n')
            : null
          }
        />
      )}
    </div>
  )
}