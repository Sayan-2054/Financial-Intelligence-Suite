// src/components/WatchlistPage.jsx
import { useWatchlist } from '../hooks/useWatchlist.js'

export default function WatchlistPage({ onSelectTicker, onSelectFund }) {
  const { list, remove } = useWatchlist()

  const stocks = list.filter(x => x.type === 'stock')
  const mfs    = list.filter(x => x.type === 'mf')

  if (!list.length) return (
    <div style={{ maxWidth: 700, margin: '80px auto', padding: '0 32px', textAlign: 'center' }}>
      <div style={{ fontSize: 64, marginBottom: 20 }}>☆</div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, color: 'var(--text-primary)', marginBottom: 12 }}>
        Your Watchlist is Empty
      </h2>
      <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
        Click the <strong style={{ color: 'var(--signal-hold)' }}>☆</strong> icon on any stock or mutual fund to add it here for quick access.
      </p>
    </div>
  )

  const Item = ({ item }) => (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '14px 18px', borderRadius: 'var(--radius-md)',
      background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
      transition: 'border-color 0.2s',
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-accent)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
    >
      <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
        onClick={() => item.type === 'stock' ? onSelectTicker(item.ticker) : onSelectFund(item.ticker, item.name)}
      >
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-mono)', marginBottom: 2 }}>
          {item.type === 'stock' ? item.ticker : item.name}
        </p>
        {item.type === 'stock' && (
          <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.name}</p>
        )}
      </div>
      <span style={{
        fontSize: 10, padding: '2px 8px', borderRadius: 20,
        background: item.type === 'stock' ? 'rgba(34,211,238,0.1)' : 'rgba(99,102,241,0.1)',
        color: item.type === 'stock' ? 'var(--accent-cyan)' : 'var(--accent-indigo)',
        border: `1px solid ${item.type === 'stock' ? 'rgba(34,211,238,0.2)' : 'rgba(99,102,241,0.2)'}`,
        fontFamily: 'var(--font-display)', fontWeight: 600,
      }}>
        {item.type === 'stock' ? '📈 Stock' : '📊 MF'}
      </span>
      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
        {new Date(item.addedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
      </span>
      <button
        onClick={() => remove(item.ticker)}
        style={{
          background: 'none', border: 'none', color: 'var(--text-muted)',
          cursor: 'pointer', fontSize: 16, padding: '2px 6px',
          transition: 'color 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--signal-sell)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
        title="Remove from watchlist"
      >×</button>
    </div>
  )

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 32px 100px' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, color: 'var(--text-primary)', marginBottom: 6 }}>
          ★ My Watchlist
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          {list.length} item{list.length !== 1 ? 's' : ''} saved · stored locally in your browser
        </p>
      </div>

      {stocks.length > 0 && (
        <section style={{ marginBottom: 32 }}>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'var(--font-display)', marginBottom: 12 }}>
            Stocks ({stocks.length})
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {stocks.map(item => <Item key={item.ticker} item={item} />)}
          </div>
        </section>
      )}

      {mfs.length > 0 && (
        <section>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'var(--font-display)', marginBottom: 12 }}>
            Mutual Funds ({mfs.length})
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {mfs.map(item => <Item key={item.ticker} item={item} />)}
          </div>
        </section>
      )}
    </div>
  )
}