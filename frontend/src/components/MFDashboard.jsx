// src/components/MFDashboard.jsx
import { useState } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import { useMutualFund }          from '../hooks/useMutualFund.js'
import { filterNavByPeriod }      from '../api/mfClient.js'
import { RISK_COLOR }             from '../data/mutualFunds.js'
import SIPCalculator              from './SIPCalculator.jsx'
import ChatBot                    from './ChatBot.jsx'
import WatchlistButton            from './WatchlistButton.jsx'

// ── Helpers ────────────────────────────────────────────────────────────────

function formatINR(n) {
  if (n == null || isNaN(n)) return '—'
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(2)} L`
  return `₹${n.toFixed(2)}`
}

function ReturnBadge({ label, value }) {
  if (value == null) return (
    <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '12px 16px', textAlign: 'center' }}>
      <p style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: 16, color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>—</p>
    </div>
  )
  const positive = value >= 0
  return (
    <div style={{
      background: positive ? 'var(--signal-buy-dim)' : 'var(--signal-sell-dim)',
      border: `1px solid ${positive ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
      borderRadius: 'var(--radius-md)', padding: '12px 16px', textAlign: 'center',
    }}>
      <p style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 4 }}>{label}</p>
      <p style={{
        fontSize: 18, fontFamily: 'var(--font-display)', fontWeight: 700,
        color: positive ? 'var(--signal-buy)' : 'var(--signal-sell)',
      }}>
        {positive ? '+' : ''}{value.toFixed(2)}%
      </p>
    </div>
  )
}

function Spinner() {
  return (
    <span style={{
      display: 'inline-block', width: 20, height: 20,
      border: '2px solid var(--border-default)', borderTopColor: 'var(--accent-cyan)',
      borderRadius: '50%', animation: 'spin 0.75s linear infinite',
    }} />
  )
}

const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: 12 }}>
      <p style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{label}</p>
      <p style={{ color: 'var(--accent-cyan)' }}>NAV: <strong>₹{payload[0]?.value?.toFixed(4)}</strong></p>
    </div>
  )
}

// ── NAV Chart ──────────────────────────────────────────────────────────────

const PERIODS = [
  { label: '1M', value: '1m' },
  { label: '3M', value: '3m' },
  { label: '6M', value: '6m' },
  { label: '1Y', value: '1y' },
  { label: '3Y', value: '3y' },
  { label: '5Y', value: '5y' },
  { label: 'All', value: 'all' },
]

function NAVChart({ navHistory }) {
  const [period, setPeriod] = useState('1y')
  const chartData = filterNavByPeriod(navHistory, period)

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '20px 24px', marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          NAV History
        </h3>
        <div style={{ display: 'flex', gap: 6 }}>
          {PERIODS.map(p => (
            <button key={p.value} onClick={() => setPeriod(p.value)} style={{
              padding: '4px 10px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
              background: period === p.value ? 'var(--accent-cyan)' : 'var(--bg-elevated)',
              color:      period === p.value ? '#080c12' : 'var(--text-secondary)',
              border: '1px solid ' + (period === p.value ? 'var(--accent-cyan)' : 'var(--border-subtle)'),
              fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 11,
              letterSpacing: '0.06em', transition: 'all 0.15s',
            }}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {chartData.length === 0 ? (
        <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>No data for this period</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="navGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="var(--accent-cyan)" stopOpacity={0.18} />
                <stop offset="95%" stopColor="var(--accent-cyan)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
            <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 9 }}
              tickLine={false} axisLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
              tickLine={false} axisLine={false}
              tickFormatter={v => `₹${v.toFixed(0)}`} width={58}
              domain={['auto', 'auto']} />
            <Tooltip content={<ChartTip />} />
            <Area type="monotone" dataKey="close" name="NAV"
              stroke="var(--accent-cyan)" fill="url(#navGrad)"
              strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

// ── Main MF Dashboard ──────────────────────────────────────────────────────

export default function MFDashboard({ schemeCode, schemeName }) {
  const { data, loading, error, retry } = useMutualFund(schemeCode)
  const [chatOpen, setChatOpen] = useState(false)

  return (
    <main style={{ maxWidth: 1400, margin: '0 auto', padding: '28px 32px 100px' }}>

      {/* Error */}
      {error && (
        <div style={{
          background: 'var(--signal-sell-dim)', border: '1px solid var(--signal-sell)',
          borderRadius: 'var(--radius-md)', padding: '14px 18px', marginBottom: 24,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16,
        }}>
          <div>
            <p style={{ color: 'var(--signal-sell)', fontSize: 13, marginBottom: 4 }}>⚠ {error}</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 11 }}>
              MF data is fetched from mfapi.in — check your internet connection.
            </p>
          </div>
          <button onClick={retry} style={{
            padding: '8px 18px', borderRadius: 'var(--radius-md)',
            background: 'var(--bg-elevated)', border: '1px solid var(--signal-sell)',
            color: 'var(--signal-sell)', cursor: 'pointer', fontFamily: 'var(--font-display)',
            fontWeight: 700, fontSize: 12, whiteSpace: 'nowrap',
          }}>↺ Retry</button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}><Spinner /></div>
          <p style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.08em' }}>
            Loading fund data…
          </p>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
            Fetching from AMFI India — usually takes 2–5 seconds
          </p>
        </div>
      )}

      {data && (
        <div style={{ animation: 'fade-in-up 0.35s ease forwards' }}>

          {/* ── Fund Hero ── */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span style={{ fontSize: 28 }}>📊</span>
                  <div>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                      {data.schemeName}
                    </h2>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                      {data.fundHouse}
                    </p>
                  </div>
                  <WatchlistButton ticker={schemeCode} name={data.schemeName} type="mf" size="sm" />
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                  {data.category && (
                    <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}>
                      {data.category}
                    </span>
                  )}
                  {data.type && (
                    <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}>
                      {data.type}
                    </span>
                  )}
                  <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}>
                    Scheme #{schemeCode}
                  </span>
                </div>
              </div>

              {/* Current NAV */}
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, letterSpacing: '0.08em' }}>CURRENT NAV</p>
                <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 32, color: 'var(--accent-cyan)' }}>
                  ₹{data.currentNav?.toFixed(4) ?? '—'}
                </p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                  As of {data.navDate}
                </p>
              </div>
            </div>
          </div>

          {/* ── NAV Chart ── */}
          <NAVChart navHistory={data.navHistory} />

          {/* ── Returns Grid ── */}
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>
              Returns
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 10 }}>
              <ReturnBadge label="1 Month"      value={data.returns.return_1m} />
              <ReturnBadge label="3 Months"     value={data.returns.return_3m} />
              <ReturnBadge label="6 Months"     value={data.returns.return_6m} />
              <ReturnBadge label="1 Year"       value={data.returns.return_1y} />
              <ReturnBadge label="3Y CAGR"      value={data.returns.cagr_3y} />
              <ReturnBadge label="5Y CAGR"      value={data.returns.cagr_5y} />
              <ReturnBadge label="Since Launch" value={data.returns.since_inception} />
            </div>
          </div>

          {/* ── Info Note ── */}
          <div style={{
            marginBottom: 28, padding: '10px 16px', borderRadius: 'var(--radius-sm)',
            background: 'rgba(34,211,238,0.05)', border: '1px solid rgba(34,211,238,0.12)',
          }}>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.7 }}>
              ℹ NAV data sourced from <strong style={{ color: 'var(--text-secondary)' }}>AMFI India</strong> via mfapi.in.
              Returns are calculated from historical NAV data. CAGR = Compound Annual Growth Rate.
              Past performance does not guarantee future returns.
            </p>
          </div>

          {/* ── SIP Calculator ── */}
          <SIPCalculator defaultMonthly={5000} />

          {/* ── Disclaimer ── */}
          <div style={{
            marginTop: 24, padding: '12px 20px', borderRadius: 'var(--radius-md)',
            background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)',
            color: 'var(--text-muted)', fontSize: 11, lineHeight: 1.7,
          }}>
            ⚖ <strong style={{ color: 'var(--signal-hold)' }}>DISCLAIMER:</strong> Mutual fund investments are subject to market risks.
            Read all scheme related documents carefully before investing.
            The SIP calculator provides estimates only — actual returns may vary.
            Consult a SEBI-registered investment advisor before investing.
          </div>
        </div>
      )}
      {/* ── Chat FAB ── */}
      <button
        onClick={() => setChatOpen(o => !o)}
        title="Ask ARIA about this fund"
        style={{
          position: 'fixed', bottom: 28, right: 28, zIndex: 300,
          width: 52, height: 52, borderRadius: '50%',
          background: chatOpen ? 'var(--bg-elevated)' : 'var(--accent-indigo)',
          color: chatOpen ? 'var(--text-secondary)' : '#fff',
          border: '1px solid ' + (chatOpen ? 'var(--border-default)' : 'var(--accent-indigo)'),
          cursor: 'pointer', fontSize: 22,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 20px rgba(99,102,241,0.3)', transition: 'all 0.2s',
        }}
      >
        {chatOpen ? '×' : '◎'}
      </button>

      {chatOpen && (
        <ChatBot
          ticker={null}
          hasAnalysis={false}
          onClose={() => setChatOpen(false)}
          context={data ? `Mutual Fund: ${data.schemeName}\nFund House: ${data.fundHouse}\nCurrent NAV: ₹${data.currentNav?.toFixed(4)}\n1Y Return: ${data.returns.return_1y?.toFixed(2)}%\n3Y CAGR: ${data.returns.cagr_3y?.toFixed(2)}%\n5Y CAGR: ${data.returns.cagr_5y?.toFixed(2)}%` : null}
        />
      )}
    </main>
  )
}