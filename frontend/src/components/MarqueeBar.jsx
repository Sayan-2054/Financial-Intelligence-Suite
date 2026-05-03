import { useState, useEffect } from 'react'
import { fetchAnalysis } from '../api/client.js'
import { INDICES } from '../data/stocks.js'

function useIndices() {
  const [data, setData] = useState([])

  useEffect(() => {
    let cancelled = false
    async function load() {
      const results = await Promise.allSettled(
        INDICES.map(idx => fetchAnalysis(idx.ticker))
      )
      if (cancelled) return
      const live = results.map((r, i) => ({
        ...INDICES[i],
        price:    r.status === 'fulfilled' ? r.value.current_price : null,
        change:   r.status === 'fulfilled' ? r.value.forecast?.expected_return_pct : null,
        currency: r.status === 'fulfilled' ? r.value.currency : '',
      }))
      setData(live)
    }
    load()
    // Refresh every 5 minutes
    const interval = setInterval(load, 300_000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [])

  return data
}

export default function MarqueeBar() {
  const indices = useIndices()

  if (!indices.length) return (
    <div style={{
      height: 36, background: 'var(--bg-deep)',
      borderBottom: '1px solid var(--border-subtle)',
      display: 'flex', alignItems: 'center', padding: '0 24px',
      gap: 8,
    }}>
      {INDICES.map(idx => (
        <span key={idx.ticker} style={{
          fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)',
          padding: '0 16px',
        }}>
          {idx.name} —
        </span>
      ))}
    </div>
  )

  // Duplicate for seamless loop
  const items = [...indices, ...indices]

  return (
    <div style={{
      height: 36, background: 'var(--bg-deep)',
      borderBottom: '1px solid var(--border-subtle)',
      overflow: 'hidden', position: 'relative',
    }}>
      <style>{`
        @keyframes marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .marquee-track {
          display: flex;
          animation: marquee 40s linear infinite;
          width: max-content;
        }
        .marquee-track:hover { animation-play-state: paused; }
      `}</style>

      <div className="marquee-track" style={{ height: '100%', alignItems: 'center' }}>
        {items.map((idx, i) => {
          const up   = (idx.change ?? 0) >= 0
          const color = idx.price == null ? 'var(--text-muted)'
                      : up ? 'var(--signal-buy)' : 'var(--signal-sell)'
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '0 24px', borderRight: '1px solid var(--border-subtle)',
              height: '100%', flexShrink: 0,
            }}>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'var(--font-display)', fontWeight: 600 }}>
                {idx.name}
              </span>
              {idx.price != null ? (
                <>
                  <span style={{ fontSize: 12, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                    {idx.currency === 'INR' ? '₹' : '$'}{idx.price.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </span>
                  <span style={{ fontSize: 11, color, fontFamily: 'var(--font-mono)' }}>
                    {up ? '▲' : '▼'} {Math.abs(idx.change ?? 0).toFixed(2)}%
                  </span>
                </>
              ) : (
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>loading…</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}