import { useState } from 'react'
import {
  AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { useAnalysis }                         from '../hooks/useAnalysis.js'
import { formatPrice, formatBigNum, fmtDate }  from '../utils/formatters.js'
import ChatBot                                  from './ChatBot.jsx'
import WatchlistButton                          from './WatchlistButton.jsx'

// ── Atoms ──────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <span style={{
      display: 'inline-block', width: 20, height: 20,
      border: '2px solid var(--border-default)',
      borderTopColor: 'var(--accent-cyan)',
      borderRadius: '50%', animation: 'spin 0.75s linear infinite',
    }} />
  )
}

function Tag({ children, color }) {
  return (
    <span style={{
      fontSize: 11, padding: '3px 10px', borderRadius: 20,
      background: 'var(--bg-elevated)', color: color ?? 'var(--text-secondary)',
      border: '1px solid var(--border-subtle)',
    }}>
      {children}
    </span>
  )
}

// ── Signal ─────────────────────────────────────────────────────────────────

const SIGNAL_CFG = {
  BUY:  { color: 'var(--signal-buy)',  bg: 'var(--signal-buy-dim)',  icon: '▲', label: 'BUY' },
  SELL: { color: 'var(--signal-sell)', bg: 'var(--signal-sell-dim)', icon: '▼', label: 'SELL' },
  HOLD: { color: 'var(--signal-hold)', bg: 'var(--signal-hold-dim)', icon: '◆', label: 'HOLD' },
}

function SignalBadge({ signal, strength }) {
  const cfg = SIGNAL_CFG[signal] ?? SIGNAL_CFG.HOLD
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      padding: '8px 18px', borderRadius: 'var(--radius-md)',
      background: cfg.bg, border: `1px solid ${cfg.color}`, color: cfg.color,
    }}>
      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, letterSpacing: '0.05em' }}>
        {cfg.icon} {cfg.label}
      </span>
      <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
        {strength?.toFixed(0)}/100
      </span>
    </div>
  )
}

// ── Sentiment Meter ────────────────────────────────────────────────────────

function SentimentMeter({ strength = 50, signal = 'HOLD' }) {
  const angle  = (strength / 100) * 180 - 90
  const color  = SIGNAL_CFG[signal]?.color ?? 'var(--signal-hold)'
  const arcLen = (strength / 100) * 251.2
  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 6, letterSpacing: '0.1em' }}>SENTIMENT METER</p>
      <svg viewBox="0 0 200 110" style={{ width: '100%', maxWidth: 190 }}>
        <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="var(--bg-hover)" strokeWidth="14" strokeLinecap="round" />
        <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke={color}
          strokeWidth="14" strokeLinecap="round" opacity="0.85"
          strokeDasharray={`${arcLen} 251.2`} />
        <text x="14"  y="97" fill="var(--signal-sell)" fontSize="9" fontFamily="var(--font-mono)">SELL</text>
        <text x="80"  y="16" fill="var(--signal-hold)" fontSize="9" fontFamily="var(--font-mono)">HOLD</text>
        <text x="160" y="97" fill="var(--signal-buy)"  fontSize="9" fontFamily="var(--font-mono)">BUY</text>
        <g transform={`translate(100,100) rotate(${angle})`}>
          <line x1="0" y1="4" x2="0" y2="-60" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
          <circle r="5" fill={color} />
        </g>
        <text x="100" y="93" textAnchor="middle" fill="var(--text-primary)"
          fontSize="15" fontFamily="var(--font-display)" fontWeight="700">
          {strength?.toFixed(0)}
        </text>
      </svg>
    </div>
  )
}

// ── Metric Card ────────────────────────────────────────────────────────────

function MetricCard({ label, value, sub, accent }) {
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-md)', padding: '14px 16px',
    }}>
      <p style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>
        {label}
      </p>
      <p style={{ fontSize: 20, fontFamily: 'var(--font-display)', fontWeight: 700, color: accent ?? 'var(--text-primary)' }}>
        {value ?? '—'}
      </p>
      {sub && <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{sub}</p>}
    </div>
  )
}

// ── Indicator Row ──────────────────────────────────────────────────────────

function IndRow({ label, value, status }) {
  const statusColor = { bullish: 'var(--signal-buy)', bearish: 'var(--signal-sell)', neutral: 'var(--text-muted)' }[status] ?? 'var(--text-muted)'
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '9px 0', borderBottom: '1px solid var(--border-subtle)',
    }}>
      <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{label}</span>
      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-mono)', fontSize: 13 }}>
        {value ?? '—'}
        {status && <span style={{ marginLeft: 8, fontSize: 10, color: statusColor, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{status}</span>}
      </span>
    </div>
  )
}

// ── Chart Tooltip ──────────────────────────────────────────────────────────

function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: 12,
    }}>
      <p style={{ color: 'var(--text-muted)', marginBottom: 6 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color ?? 'var(--text-primary)' }}>
          {p.name}: <strong>{typeof p.value === 'number' ? p.value.toFixed(2) : p.value}</strong>
        </p>
      ))}
    </div>
  )
}

// ── Price Chart ────────────────────────────────────────────────────────────

function PriceChart({ historical = [], forecast = {}, currency = 'USD' }) {
  const sym = { USD: '$', INR: '₹', EUR: '€', GBP: '£' }[currency] ?? `${currency} `

  const hist  = historical.slice(-90).map(d => ({ date: fmtDate(d.date), close: d.close }))
  const fcast = (forecast.dates ?? []).map((date, i) => ({
    date: fmtDate(date),
    forecast: forecast.predicted_prices?.[i],
    upper:    forecast.confidence_band_upper?.[i],
    lower:    forecast.confidence_band_lower?.[i],
  }))
  const combined  = [...hist, ...fcast]
  const splitDate = hist[hist.length - 1]?.date

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={combined} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="gPrice" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="var(--chart-price)"    stopOpacity={0.18} />
            <stop offset="95%" stopColor="var(--chart-price)"    stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gForecast" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="var(--chart-forecast)" stopOpacity={0.22} />
            <stop offset="95%" stopColor="var(--chart-forecast)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
        <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
          tickLine={false} axisLine={false} interval="preserveStartEnd" />
        <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
          tickLine={false} axisLine={false}
          tickFormatter={v => `${sym}${v.toFixed(0)}`} width={62}
          domain={['auto', 'auto']} />
        <Tooltip content={<ChartTip />} />
        {splitDate && (
          <ReferenceLine x={splitDate} stroke="var(--text-muted)" strokeDasharray="4 4"
            label={{ value: 'NOW', fill: 'var(--text-muted)', fontSize: 9, position: 'top' }} />
        )}
        <Area type="monotone" dataKey="close"    name="Close"    stroke="var(--chart-price)"    fill="url(#gPrice)"    strokeWidth={2} dot={false} />
        <Area type="monotone" dataKey="forecast" name="Forecast" stroke="var(--chart-forecast)" fill="url(#gForecast)" strokeWidth={2} dot={false} strokeDasharray="5 3" />
        <Area type="monotone" dataKey="upper"    name="Upper"    stroke="var(--chart-forecast)" fill="none"            strokeWidth={1} dot={false} strokeDasharray="2 4" opacity={0.45} />
        <Area type="monotone" dataKey="lower"    name="Lower"    stroke="var(--chart-forecast)" fill="none"            strokeWidth={1} dot={false} strokeDasharray="2 4" opacity={0.45} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

// ── Card Wrapper ───────────────────────────────────────────────────────────

function Card({ title, children, span }) {
  return (
    <div style={{
      gridColumn: span ? '1 / -1' : undefined,
      background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)', padding: '20px 24px',
      boxShadow: 'var(--shadow-card)',
    }}>
      {title && (
        <h3 style={{
          fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 600,
          color: 'var(--text-secondary)', letterSpacing: '0.12em',
          textTransform: 'uppercase', marginBottom: 16,
        }}>
          {title}
        </h3>
      )}
      {children}
    </div>
  )
}

// ── Main Dashboard ─────────────────────────────────────────────────────────

export default function Dashboard({ ticker }) {
  const [period,    setPeriod]    = useState('6mo')
  const { data, loading, error, retry } = useAnalysis(ticker, period)
  const [chatOpen,  setChatOpen]  = useState(false)

  const ind      = data?.indicators ?? {}
  const forecast = data?.forecast   ?? {}
  const signalColor = SIGNAL_CFG[data?.signal]?.color ?? 'var(--signal-hold)'
  const rsiStatus   = ind.rsi == null ? null : ind.rsi < 30 ? 'bullish' : ind.rsi > 70 ? 'bearish' : 'neutral'

  return (
    <>
      <main style={{ maxWidth: 1400, margin: '0 auto', padding: '28px 32px 100px' }}>

        {error && (
          <div style={{
            background: 'var(--signal-sell-dim)', border: '1px solid var(--signal-sell)',
            borderRadius: 'var(--radius-md)', padding: '16px 20px', marginBottom: 24,
            display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16,
          }}>
            <div>
              <p style={{ color: 'var(--signal-sell)', fontFamily: 'var(--font-mono)', fontSize: 13, marginBottom: 6 }}>
                ⚠ {error}
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: 11, lineHeight: 1.6 }}>
                The backend may be waking up (Render free tier cold start takes ~30s).
                The request will retry automatically. You can also click Retry.
              </p>
            </div>
            <button
              onClick={retry}
              style={{
                flexShrink: 0, padding: '8px 18px', borderRadius: 'var(--radius-md)',
                background: 'var(--bg-elevated)', border: '1px solid var(--signal-sell)',
                color: 'var(--signal-sell)', cursor: 'pointer', fontFamily: 'var(--font-display)',
                fontWeight: 700, fontSize: 12, letterSpacing: '0.05em', whiteSpace: 'nowrap',
              }}
            >
              ↺ Retry
            </button>
          </div>
        )}

        {loading && !data && (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
              <Spinner />
            </div>
            <p style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.1em', fontSize: 15, color: 'var(--text-primary)', marginBottom: 10 }}>
              Fetching analysis for {ticker}…
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
              Auto-retrying if backend is slow · ML model runs on first request
            </p>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 8,
              padding: '6px 14px', borderRadius: 20,
              background: 'rgba(34,211,238,0.06)', border: '1px solid rgba(34,211,238,0.15)',
            }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                First load on free tier: ~30–60s · subsequent loads: ~5–10s
              </span>
            </div>
          </div>
        )}

        {data && (
          <div style={{ animation: 'fade-in-up 0.35s ease forwards' }}>

            {/* Ticker Hero */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
              flexWrap: 'wrap', gap: 16, marginBottom: 28,
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                  <h2 style={{
                    fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 32,
                    color: 'var(--accent-cyan)', letterSpacing: '-0.02em',
                  }}>{data.ticker}</h2>
                  <span style={{ color: 'var(--text-secondary)', fontSize: 15 }}>{data.company_name}</span>
                  <WatchlistButton ticker={data.ticker} name={data.company_name} type="stock" size="sm" />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 6 }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 28 }}>
                    {formatPrice(data.current_price, data.currency)}
                  </span>
                  {forecast.expected_return_pct != null && (
                    <span style={{
                      fontSize: 13, fontFamily: 'var(--font-mono)',
                      color: forecast.expected_return_pct >= 0 ? 'var(--signal-buy)' : 'var(--signal-sell)',
                    }}>
                      {forecast.expected_return_pct >= 0 ? '▲' : '▼'} {Math.abs(forecast.expected_return_pct).toFixed(2)}%
                      <span style={{ color: 'var(--text-muted)', fontSize: 11, marginLeft: 4 }}>7d fcst</span>
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                  {data.sector     && <Tag>{data.sector}</Tag>}
                  {data.market_cap && <Tag>MCap {formatBigNum(data.market_cap, data.currency)}</Tag>}
                  {data.pe_ratio   && <Tag>P/E {data.pe_ratio?.toFixed(1)}</Tag>}
                  {data.cached     && <Tag color="var(--text-muted)">↻ cached</Tag>}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
                <SignalBadge signal={data.signal} strength={data.signal_strength} />
                <SentimentMeter strength={data.signal_strength} signal={data.signal} />
              </div>
            </div>

            {/* Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>

              <Card title="Price History + 7-Day ML Forecast" span>
                {/* Timeframe Picker */}
                <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
                  {[
                    { label: '1D',   value: '1d'  },
                    { label: '1W',   value: '5d'  },
                    { label: '1M',   value: '1mo' },
                    { label: '6M',   value: '6mo' },
                    { label: '1Y',   value: '1y'  },
                    { label: '5Y',   value: '5y'  },
                    { label: 'All',  value: 'max' },
                  ].map(tf => (
                    <button
                      key={tf.value}
                      onClick={() => setPeriod(tf.value)}
                      style={{
                        padding: '4px 12px', borderRadius: 'var(--radius-sm)',
                        background: period === tf.value ? 'var(--accent-cyan)' : 'var(--bg-elevated)',
                        color:      period === tf.value ? '#080c12' : 'var(--text-secondary)',
                        border: '1px solid ' + (period === tf.value ? 'var(--accent-cyan)' : 'var(--border-subtle)'),
                        cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 600,
                        fontSize: 11, letterSpacing: '0.06em', transition: 'all 0.15s',
                      }}
                    >
                      {tf.label}
                    </button>
                  ))}
                  {loading && (
                    <span style={{
                      display: 'inline-block', width: 14, height: 14, marginLeft: 4,
                      border: '2px solid var(--border-default)',
                      borderTopColor: 'var(--accent-cyan)',
                      borderRadius: '50%', animation: 'spin 0.75s linear infinite',
                      alignSelf: 'center',
                    }} />
                  )}
                </div>
                <PriceChart historical={data.historical_prices} forecast={forecast} currency={data.currency} />
              </Card>

              <Card title="Technical Indicators">
                <IndRow label="RSI (14)"       value={ind.rsi?.toFixed(2)}           status={rsiStatus} />
                <IndRow label="MACD"           value={ind.macd?.toFixed(4)}          status={ind.macd_histogram > 0 ? 'bullish' : 'bearish'} />
                <IndRow label="MACD Signal"    value={ind.macd_signal?.toFixed(4)} />
                <IndRow label="MACD Histogram" value={ind.macd_histogram?.toFixed(4)} status={ind.macd_histogram > 0 ? 'bullish' : 'bearish'} />
                <IndRow label="50-Day SMA"     value={ind.sma_50?.toFixed(2)}        status={ind.price_vs_sma50  === 'above' ? 'bullish' : 'bearish'} />
                <IndRow label="200-Day SMA"    value={ind.sma_200?.toFixed(2)}       status={ind.price_vs_sma200 === 'above' ? 'bullish' : 'bearish'} />
                {ind.golden_cross && (
                  <div style={{ marginTop: 12, padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--signal-buy-dim)', color: 'var(--signal-buy)', fontSize: 12 }}>
                    ✦ Golden Cross Active
                  </div>
                )}
                {ind.death_cross && (
                  <div style={{ marginTop: 12, padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--signal-sell-dim)', color: 'var(--signal-sell)', fontSize: 12 }}>
                    ✦ Death Cross Active
                  </div>
                )}
              </Card>

              <Card title="7-Day Price Forecast">
                {forecast.dates?.length > 0 ? (
                  <>
                    <div style={{ marginBottom: 14 }}>
                      <span style={{
                        padding: '4px 14px', borderRadius: 20, fontSize: 12,
                        fontFamily: 'var(--font-display)', fontWeight: 600,
                        textTransform: 'uppercase', letterSpacing: '0.06em',
                        background: forecast.direction === 'bullish' ? 'var(--signal-buy-dim)'
                                  : forecast.direction === 'bearish' ? 'var(--signal-sell-dim)' : 'var(--signal-hold-dim)',
                        color: forecast.direction === 'bullish' ? 'var(--signal-buy)'
                             : forecast.direction === 'bearish' ? 'var(--signal-sell)' : 'var(--signal-hold)',
                      }}>
                        {forecast.direction} · {forecast.expected_return_pct >= 0 ? '+' : ''}{forecast.expected_return_pct?.toFixed(2)}%
                      </span>
                    </div>
                    {forecast.dates.map((date, i) => (
                      <div key={date} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '7px 0', borderBottom: i < forecast.dates.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                      }}>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{fmtDate(date)}</span>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--chart-forecast)', fontSize: 13 }}>
                            {formatPrice(forecast.predicted_prices[i], data.currency)}
                          </span>
                          <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 6 }}>
                            ±{formatPrice(forecast.confidence_band_upper[i] - forecast.predicted_prices[i], data.currency)}
                          </span>
                        </div>
                      </div>
                    ))}
                    <p style={{ marginTop: 12, fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.7, fontStyle: 'italic' }}>
                      ⚠ Probabilistic ML estimates. Not a guarantee of future performance.
                    </p>
                  </>
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>Forecast unavailable</p>
                )}
              </Card>

              <Card title="Quick Metrics">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                  <MetricCard label="Signal Strength" value={`${data.signal_strength?.toFixed(0)}/100`} accent={signalColor} />
                  <MetricCard label="Currency"        value={data.currency} />
                  <MetricCard label="P/E Ratio"       value={data.pe_ratio?.toFixed(1)} />
                  <MetricCard label="Market Cap"      value={formatBigNum(data.market_cap, data.currency)} />
                </div>
                <div style={{
                  padding: '10px 14px', borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
                }}>
                  <p style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 6, letterSpacing: '0.08em' }}>INVESTMENT SIGNAL</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 12, height: 12, borderRadius: '50%', background: signalColor,
                      boxShadow: `0 0 8px ${signalColor}`,
                    }} />
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: signalColor }}>
                      {data.signal === 'BUY' ? 'CONSIDER INVESTING' : data.signal === 'SELL' ? 'EXERCISE CAUTION' : 'HOLD / MONITOR'}
                    </span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Disclaimer */}
            <div style={{
              marginTop: 24, padding: '12px 20px', borderRadius: 'var(--radius-md)',
              background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)',
              color: 'var(--text-muted)', fontSize: 11, lineHeight: 1.7,
            }}>
              ⚖ <strong style={{ color: 'var(--signal-hold)' }}>DISCLAIMER:</strong> All analysis,
              signals, and forecasts are for informational and educational purposes only and do not
              constitute financial advice. Past performance does not guarantee future results.
              Consult a SEBI-registered investment advisor before investing.
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border-subtle)', padding: '20px 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 10, background: 'var(--bg-deep)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 6,
            background: 'var(--accent-cyan)', color: '#080c12',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13,
          }}>Φ</div>
          <div>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>
              Financial Intelligence Suite
            </p>
            <p style={{ fontSize: 10, color: 'var(--text-muted)' }}>
              Developed by <span style={{ color: 'var(--accent-cyan)' }}>Sayantan Chowdhury</span>
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Powered by <span style={{ color: 'var(--text-secondary)' }}>Ollama</span> · <span style={{ color: 'var(--text-secondary)' }}>FastAPI</span> · <span style={{ color: 'var(--text-secondary)' }}>React</span>
          </span>
          <span style={{
            fontSize: 10, padding: '3px 10px', borderRadius: 20,
            background: 'var(--signal-sell-dim)', color: 'var(--signal-sell)',
            border: '1px solid rgba(239,68,68,0.2)',
          }}>⚠ Not Financial Advice</span>
        </div>
      </footer>

      {/* Chat FAB */}
      <button
        onClick={() => setChatOpen(o => !o)}
        title="Chat with ARIA"
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
        <ChatBot ticker={data?.ticker} hasAnalysis={!!data} onClose={() => setChatOpen(false)} />
      )}
    </>
  )
}