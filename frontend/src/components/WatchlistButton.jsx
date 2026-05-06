// src/components/WatchlistButton.jsx
import { useWatchlist } from '../hooks/useWatchlist.js'

export default function WatchlistButton({ ticker, name, type = 'stock', size = 'md' }) {
  const { toggle, isWatched } = useWatchlist()
  const watched = isWatched(ticker)

  const sz = size === 'sm' ? 26 : 36

  return (
    <button
      onClick={e => { e.stopPropagation(); toggle({ ticker, name, type }) }}
      title={watched ? 'Remove from watchlist' : 'Add to watchlist'}
      style={{
        width: sz, height: sz, borderRadius: '50%', flexShrink: 0,
        background: watched ? 'rgba(245,158,11,0.15)' : 'var(--bg-elevated)',
        border: `1px solid ${watched ? 'var(--signal-hold)' : 'var(--border-default)'}`,
        color: watched ? 'var(--signal-hold)' : 'var(--text-muted)',
        cursor: 'pointer', fontSize: size === 'sm' ? 12 : 16,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.2s',
      }}
      onMouseEnter={e => { if (!watched) { e.currentTarget.style.borderColor = 'var(--signal-hold)'; e.currentTarget.style.color = 'var(--signal-hold)' }}}
      onMouseLeave={e => { if (!watched) { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.color = 'var(--text-muted)' }}}
    >
      {watched ? '★' : '☆'}
    </button>
  )
}