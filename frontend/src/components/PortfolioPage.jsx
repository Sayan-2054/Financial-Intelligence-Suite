// src/components/PortfolioPage.jsx
import { useState, useEffect } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { usePortfolio }  from '../hooks/usePortfolio.js'
import { fetchAnalysis } from '../api/client.js'
import { searchStocks }  from '../data/stocks.js'

const COLORS = ['#22d3ee','#6366f1','#10b981','#f59e0b','#ef4444','#a78bfa','#34d399','#fb923c','#60a5fa','#f472b6']

function formatINR(n, currency = 'INR') {
  if (n == null || isNaN(n)) return '—'
  const sym = currency === 'INR' ? '₹' : '$'
  if (Math.abs(n) >= 1e7) return `${sym}${(n/1e7).toFixed(2)}Cr`
  if (Math.abs(n) >= 1e5) return `${sym}${(n/1e5).toFixed(2)}L`
  if (Math.abs(n) >= 1e3) return `${sym}${(n/1e3).toFixed(1)}K`
  return `${sym}${n.toFixed(2)}`
}

// ── Add Holding Modal ──────────────────────────────────────────────────────
function AddModal({ onAdd, onClose }) {
  const [query,    setQuery]    = useState('')
  const [results,  setResults]  = useState([])
  const [selected, setSelected] = useState(null)
  const [qty,      setQty]      = useState('')
  const [price,    setPrice]    = useState('')
  const [date,     setDate]     = useState(new Date().toISOString().split('T')[0])
  const [notes,    setNotes]    = useState('')
  const [step,     setStep]     = useState(1) // 1=search, 2=details

  function handleSearch(val) {
    setQuery(val)
    if (val.trim().length >= 1) setResults(searchStocks(val, 6))
    else setResults([])
  }

  function selectStock(stock) {
    setSelected(stock)
    setStep(2)
    setResults([])
    setQuery('')
  }

  function handleSubmit() {
    if (!selected || !qty || !price || !date) return
    onAdd({
      ticker:    selected.ticker,
      name:      selected.name,
      type:      'stock',
      sector:    selected.sector,
      country:   selected.country,
      quantity:  parseFloat(qty),
      buyPrice:  parseFloat(price),
      buyDate:   date,
      notes,
    })
    onClose()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 500,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-xl)', padding: '28px', width: '100%', maxWidth: 480,
        boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--text-primary)' }}>
            {step === 1 ? 'Search Stock' : `Add ${selected?.name}`}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 20 }}>×</button>
        </div>

        {step === 1 && (
          <div style={{ position: 'relative' }}>
            <input
              autoFocus
              value={query}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Type company name e.g. Reliance, Apple, TCS…"
              style={{
                width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)', padding: '12px 16px', color: 'var(--text-primary)',
                fontFamily: 'var(--font-mono)', fontSize: 14, outline: 'none',
              }}
            />
            {results.length > 0 && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
                background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)', maxHeight: 260, overflowY: 'auto',
                boxShadow: '0 12px 30px rgba(0,0,0,0.4)', zIndex: 10,
              }}>
                {results.map(s => (
                  <div key={s.ticker} onClick={() => selectStock(s)}
                    style={{
                      padding: '11px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border-subtle)',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <p style={{ fontSize: 13, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{s.name}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{s.ticker} · {s.exchange} · {s.sector}</p>
                  </div>
                ))}
              </div>
            )}
            <p style={{ marginTop: 12, fontSize: 11, color: 'var(--text-muted)' }}>
              Covers 200+ stocks across India, US and global markets
            </p>
          </div>
        )}

        {step === 2 && selected && (
          <div>
            <div style={{
              padding: '10px 14px', borderRadius: 'var(--radius-md)',
              background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.2)',
              marginBottom: 20,
            }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--accent-cyan)' }}>{selected.ticker}</p>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{selected.name} · {selected.sector}</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 6, letterSpacing: '0.08em' }}>QUANTITY</label>
                <input type="number" value={qty} onChange={e => setQty(e.target.value)} placeholder="e.g. 10"
                  style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: 14, outline: 'none' }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 6, letterSpacing: '0.08em' }}>BUY PRICE</label>
                <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="e.g. 1250.50"
                  style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: 14, outline: 'none' }} />
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 6, letterSpacing: '0.08em' }}>BUY DATE</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: 14, outline: 'none', colorScheme: 'dark' }} />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 6, letterSpacing: '0.08em' }}>NOTES (optional)</label>
              <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Long term hold"
                style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: 14, outline: 'none' }} />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setStep(1)} style={{
                flex: 1, padding: '11px', borderRadius: 'var(--radius-md)',
                background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
                color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13,
              }}>← Back</button>
              <button
                onClick={handleSubmit}
                disabled={!qty || !price || !date}
                style={{
                  flex: 2, padding: '11px', borderRadius: 'var(--radius-md)',
                  background: (!qty || !price || !date) ? 'var(--bg-elevated)' : 'var(--accent-cyan)',
                  color: (!qty || !price || !date) ? 'var(--text-muted)' : '#080c12',
                  border: 'none', cursor: (!qty || !price || !date) ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13,
                }}
              >Add to Portfolio</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Holding Row ────────────────────────────────────────────────────────────
function HoldingRow({ holding, onRemove, onSelect }) {
  const [currentPrice, setCurrentPrice] = useState(null)
  const [loading,      setLoading]      = useState(true)
  const { getPnL } = usePortfolio()

  useEffect(() => {
    let cancelled = false
    fetchAnalysis(holding.ticker, '1d')
      .then(d => { if (!cancelled) setCurrentPrice(d.current_price) })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [holding.ticker])

  const pnl = currentPrice ? getPnL(holding, currentPrice) : null

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto',
      alignItems: 'center', gap: 12,
      padding: '14px 18px', borderRadius: 'var(--radius-md)',
      background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
      transition: 'border-color 0.2s',
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-accent)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
    >
      {/* Name */}
      <div style={{ cursor: 'pointer', minWidth: 0 }} onClick={() => onSelect(holding.ticker)}>
        <p style={{ fontSize: 13, color: 'var(--text-mono)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {holding.ticker.replace('.NS','').replace('.BO','')}
        </p>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {holding.name}
        </p>
      </div>

      {/* Qty × Buy Price */}
      <div>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{holding.quantity} × ₹{holding.buyPrice}</p>
        <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>{new Date(holding.buyDate).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'2-digit' })}</p>
      </div>

      {/* Invested */}
      <p style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
        {pnl ? formatINR(pnl.invested) : '—'}
      </p>

      {/* Current Value */}
      <p style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
        {loading ? <span style={{ color: 'var(--text-muted)' }}>…</span> : pnl ? formatINR(pnl.current) : '—'}
      </p>

      {/* P&L */}
      <div>
        {loading ? (
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Loading…</span>
        ) : pnl ? (
          <>
            <p style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: pnl.pnl >= 0 ? 'var(--signal-buy)' : 'var(--signal-sell)', fontWeight: 600 }}>
              {pnl.pnl >= 0 ? '+' : ''}{formatINR(pnl.pnl)}
            </p>
            <p style={{ fontSize: 11, color: pnl.pnl >= 0 ? 'var(--signal-buy)' : 'var(--signal-sell)', marginTop: 1 }}>
              {pnl.pnlPct >= 0 ? '+' : ''}{pnl.pnlPct.toFixed(2)}%
            </p>
          </>
        ) : '—'}
      </div>

      {/* Remove */}
      <button onClick={() => onRemove(holding.id)}
        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16, padding: '2px 4px', transition: 'color 0.15s' }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--signal-sell)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
        title="Remove holding"
      >×</button>
    </div>
  )
}

// ── Main Portfolio Page ────────────────────────────────────────────────────
export default function PortfolioPage({ onSelectTicker }) {
  const { holdings, add, remove } = usePortfolio()
  const [showModal, setShowModal] = useState(false)
  const [prices,    setPrices]    = useState({})

  // Fetch current prices for all holdings (for summary + pie chart)
  useEffect(() => {
    if (!holdings.length) return
    holdings.forEach(h => {
      fetchAnalysis(h.ticker, '1d')
        .then(d => setPrices(prev => ({ ...prev, [h.ticker]: d.current_price })))
        .catch(() => {})
    })
  }, [holdings.length])

  // Summary calculations
  const totalInvested = holdings.reduce((s, h) => s + h.quantity * h.buyPrice, 0)
  const totalCurrent  = holdings.reduce((s, h) => s + h.quantity * (prices[h.ticker] ?? h.buyPrice), 0)
  const totalPnL      = totalCurrent - totalInvested
  const totalPnLPct   = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0

  // Sector allocation for pie chart
  const sectorMap = {}
  holdings.forEach(h => {
    const sector = h.sector || 'Other'
    const value  = h.quantity * (prices[h.ticker] ?? h.buyPrice)
    sectorMap[sector] = (sectorMap[sector] || 0) + value
  })
  const pieData = Object.entries(sectorMap).map(([name, value]) => ({ name, value: Math.round(value) }))

  if (!holdings.length) return (
    <div style={{ maxWidth: 700, margin: '80px auto', padding: '0 32px', textAlign: 'center' }}>
      <div style={{ fontSize: 64, marginBottom: 20 }}>📁</div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, color: 'var(--text-primary)', marginBottom: 12 }}>
        Your Portfolio is Empty
      </h2>
      <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 28 }}>
        Track your investments by adding holdings below. Just type the company name — no ticker codes needed.
      </p>
      <button onClick={() => setShowModal(true)} style={{
        padding: '12px 28px', borderRadius: 'var(--radius-md)',
        background: 'var(--accent-cyan)', color: '#080c12',
        border: 'none', cursor: 'pointer',
        fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14,
      }}>+ Add First Holding</button>
      {showModal && <AddModal onAdd={add} onClose={() => setShowModal(false)} />}
    </div>
  )

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 32px 100px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, color: 'var(--text-primary)', marginBottom: 4 }}>
            📁 My Portfolio
          </h1>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {holdings.length} holding{holdings.length !== 1 ? 's' : ''} · prices update on page load · stored locally
          </p>
        </div>
        <button onClick={() => setShowModal(true)} style={{
          padding: '10px 20px', borderRadius: 'var(--radius-md)',
          background: 'var(--accent-cyan)', color: '#080c12',
          border: 'none', cursor: 'pointer',
          fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13,
        }}>+ Add Holding</button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 28 }}>
        {[
          { label: 'Total Invested',   value: formatINR(totalInvested), color: 'var(--text-primary)' },
          { label: 'Current Value',    value: formatINR(totalCurrent),  color: 'var(--accent-cyan)' },
          { label: 'Total P&L',        value: `${totalPnL >= 0 ? '+' : ''}${formatINR(totalPnL)}`, color: totalPnL >= 0 ? 'var(--signal-buy)' : 'var(--signal-sell)' },
          { label: 'Return %',         value: `${totalPnLPct >= 0 ? '+' : ''}${totalPnLPct.toFixed(2)}%`, color: totalPnLPct >= 0 ? 'var(--signal-buy)' : 'var(--signal-sell)' },
        ].map(c => (
          <div key={c.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '16px 18px' }}>
            <p style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>{c.label}</p>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, color: c.color }}>{c.value}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: pieData.length > 1 ? '1fr 320px' : '1fr', gap: 20, marginBottom: 28 }}>

        {/* Holdings Table */}
        <div>
          {/* Table Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto', gap: 12, padding: '8px 18px', marginBottom: 8 }}>
            {['Stock', 'Qty × Price', 'Invested', 'Current', 'P&L', ''].map(h => (
              <p key={h} style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-display)' }}>{h}</p>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {holdings.map(h => (
              <HoldingRow key={h.id} holding={h} onRemove={remove} onSelect={onSelectTicker} />
            ))}
          </div>
        </div>

        {/* Sector Pie Chart */}
        {pieData.length > 1 && (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '20px' }}>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-display)', marginBottom: 16 }}>
              Sector Allocation
            </p>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => formatINR(v)} contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11, color: 'var(--text-secondary)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {showModal && <AddModal onAdd={add} onClose={() => setShowModal(false)} />}
    </div>
  )
}