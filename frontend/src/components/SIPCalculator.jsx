// src/components/SIPCalculator.jsx
import { useState, useMemo } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { calculateSIP } from '../api/mfClient.js'

function formatINR(n) {
  if (n == null) return '—'
  if (n >= 1e7)  return `₹${(n / 1e7).toFixed(2)} Cr`
  if (n >= 1e5)  return `₹${(n / 1e5).toFixed(2)} L`
  if (n >= 1e3)  return `₹${(n / 1e3).toFixed(1)}K`
  return `₹${n.toLocaleString('en-IN')}`
}

function Slider({ label, value, min, max, step, onChange, format }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ fontSize: 14, fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--accent-cyan)' }}>
          {format(value)}
        </span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{
          width: '100%', height: 4, appearance: 'none', outline: 'none',
          background: `linear-gradient(to right, var(--accent-cyan) 0%, var(--accent-cyan) ${((value - min) / (max - min)) * 100}%, var(--bg-hover) ${((value - min) / (max - min)) * 100}%, var(--bg-hover) 100%)`,
          borderRadius: 4, cursor: 'pointer',
        }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{format(min)}</span>
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{format(max)}</span>
      </div>
    </div>
  )
}

function ResultPill({ label, value, accent }) {
  return (
    <div style={{
      background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-md)', padding: '14px 18px', textAlign: 'center',
    }}>
      <p style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
        {label}
      </p>
      <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: accent ?? 'var(--text-primary)' }}>
        {value}
      </p>
    </div>
  )
}

const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: 12,
    }}>
      <p style={{ color: 'var(--text-muted)', marginBottom: 6 }}>Year {label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: <strong>{formatINR(p.value)}</strong>
        </p>
      ))}
    </div>
  )
}

export default function SIPCalculator({ defaultMonthly = 5000 }) {
  const [monthly,    setMonthly]    = useState(defaultMonthly)
  const [years,      setYears]      = useState(10)
  const [returnPct,  setReturnPct]  = useState(12)
  const [stepUp,     setStepUp]     = useState(0)
  const [inflation,  setInflation]  = useState(6)
  const [showReal,   setShowReal]   = useState(false)

  const result = useMemo(() => calculateSIP({
    monthlyAmount:     monthly,
    years,
    expectedReturnPct: returnPct,
    stepUpPct:         stepUp,
    inflationPct:      inflation,
  }), [monthly, years, returnPct, stepUp, inflation])

  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 24px', borderBottom: '1px solid var(--border-subtle)',
        background: 'var(--bg-elevated)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>
            📐 SIP Calculator
          </h3>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
            Systematic Investment Plan — power of compounding
          </p>
        </div>
        <button
          onClick={() => setShowReal(r => !r)}
          style={{
            padding: '6px 14px', borderRadius: 'var(--radius-md)', fontSize: 11,
            background: showReal ? 'rgba(34,211,238,0.1)' : 'var(--bg-card)',
            border: '1px solid ' + (showReal ? 'var(--accent-cyan)' : 'var(--border-default)'),
            color: showReal ? 'var(--accent-cyan)' : 'var(--text-secondary)',
            cursor: 'pointer', fontFamily: 'var(--font-mono)',
            transition: 'all 0.2s',
          }}
        >
          {showReal ? '✓ ' : ''}Inflation Adjusted
        </button>
      </div>

      <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>

        {/* ── Sliders ── */}
        <div>
          <Slider
            label="Monthly SIP Amount"
            value={monthly} min={500} max={100000} step={500}
            onChange={setMonthly}
            format={v => `₹${v.toLocaleString('en-IN')}`}
          />
          <Slider
            label="Investment Duration"
            value={years} min={1} max={40} step={1}
            onChange={setYears}
            format={v => `${v} yr${v > 1 ? 's' : ''}`}
          />
          <Slider
            label="Expected Annual Return"
            value={returnPct} min={1} max={30} step={0.5}
            onChange={setReturnPct}
            format={v => `${v}% p.a.`}
          />
          <Slider
            label="Annual Step-Up (optional)"
            value={stepUp} min={0} max={25} step={1}
            onChange={setStepUp}
            format={v => v === 0 ? 'No step-up' : `+${v}% / year`}
          />
          {showReal && (
            <Slider
              label="Inflation Rate"
              value={inflation} min={2} max={12} step={0.5}
              onChange={setInflation}
              format={v => `${v}% p.a.`}
            />
          )}

          {/* Result Pills */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 8 }}>
            <ResultPill label="Total Invested"  value={formatINR(result.totalInvested)} />
            <ResultPill label="Wealth Gained"   value={formatINR(result.wealthGained)}  accent="var(--signal-buy)" />
            <ResultPill
              label={showReal ? 'Real Value (adj.)' : 'Maturity Value'}
              value={formatINR(showReal ? result.realValue : result.maturityValue)}
              accent="var(--accent-cyan)"
            />
            <ResultPill
              label="Absolute Return"
              value={`${result.absoluteReturn.toFixed(1)}%`}
              accent="var(--accent-indigo)"
            />
          </div>
        </div>

        {/* ── Chart ── */}
        <div>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: 14, textTransform: 'uppercase' }}>
            Growth Over Time
          </p>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={result.yearlyData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="sipInvGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="var(--accent-indigo)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="var(--accent-indigo)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="sipValGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="var(--accent-cyan)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="var(--accent-cyan)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
              <XAxis dataKey="year" tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
                tickLine={false} axisLine={false}
                tickFormatter={v => `Yr ${v}`} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
                tickLine={false} axisLine={false}
                tickFormatter={v => formatINR(v)} width={70} />
              <Tooltip content={<ChartTip />} />
              <Legend
                wrapperStyle={{ fontSize: 11, color: 'var(--text-secondary)', paddingTop: 8 }}
              />
              <Area type="monotone" dataKey="invested" name="Invested"
                stroke="var(--accent-indigo)" fill="url(#sipInvGrad)"
                strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="value" name="Est. Value"
                stroke="var(--accent-cyan)" fill="url(#sipValGrad)"
                strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>

          {/* Assumptions note */}
          <div style={{
            marginTop: 12, padding: '8px 12px', borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
          }}>
            <p style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.6 }}>
              ℹ Assumes returns compounded monthly at {returnPct}% p.a.
              {stepUp > 0 ? ` with ${stepUp}% annual step-up.` : '.'}
              {showReal ? ` Real value adjusted for ${inflation}% inflation.` : ''}
              {' '}Actual returns may vary. Past performance ≠ future results.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}