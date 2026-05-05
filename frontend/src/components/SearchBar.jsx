import { useState, useRef, useEffect } from 'react'
import { searchStocks } from '../data/stocks.js'

const FLAG = { IN: '🇮🇳', US: '🇺🇸', CN: '🇨🇳', TW: '🇹🇼', JP: '🇯🇵', DE: '🇩🇪', NL: '🇳🇱', GB: '🇬🇧', FR: '🇫🇷', CH: '🇨🇭', DK: '🇩🇰', SE: '🇸🇪', SG: '🇸🇬', CA: '🇨🇦' }

export default function SearchBar({ onSearch, loading, initialValue = '' }) {
  const [input,     setInput]     = useState(initialValue)
  const [results,   setResults]   = useState([])
  const [open,      setOpen]      = useState(false)
  const [highlight, setHighlight] = useState(-1)
  const wrapRef  = useRef(null)
  const inputRef = useRef(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function handleInput(val) {
    setInput(val)
    setHighlight(-1)
    if (val.trim().length >= 1) {
      setResults(searchStocks(val, 8))
      setOpen(true)
    } else {
      setResults([])
      setOpen(false)
    }
  }

  function handleSelect(stock) {
    setInput(stock.name)
    setOpen(false)
    setResults([])
    onSearch(stock.ticker)
  }

  function handleKeyDown(e) {
    if (!open || !results.length) {
      if (e.key === 'Enter' && input.trim()) {
        // No dropdown open — search the raw input as ticker
        onSearch(input.trim())
        setOpen(false)
      }
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlight(h => Math.min(h + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight(h => Math.max(h - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      // Always select first result if nothing highlighted
      const idx = highlight >= 0 ? highlight : 0
      handleSelect(results[idx])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative', flex: 1, maxWidth: 420 }}>
      {/* Input Row */}
      <div style={{
        display: 'flex', alignItems: 'center',
        background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
        borderRadius: open && results.length ? '10px 10px 0 0' : 'var(--radius-md)',
        overflow: 'visible', boxShadow: 'var(--shadow-glow-cyan)',
        transition: 'border-color 0.2s',
      }}>
        <span style={{ padding: '0 12px', color: 'var(--text-muted)', fontSize: 16, userSelect: 'none' }}>⌕</span>
        <input
          ref={inputRef}
          value={input}
          onChange={e => handleInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => input.trim().length >= 1 && results.length && setOpen(true)}
          placeholder="Search stocks, company names, sectors…"
          style={{
            flex: 1, background: 'transparent', border: 'none', outline: 'none',
            color: 'var(--text-primary)', fontFamily: 'var(--font-mono)',
            fontSize: 14, padding: '11px 0',
          }}
        />
        {loading && (
          <div style={{ padding: '0 12px' }}>
            <span style={{
              display: 'inline-block', width: 16, height: 16,
              border: '2px solid var(--border-default)',
              borderTopColor: 'var(--accent-cyan)',
              borderRadius: '50%', animation: 'spin 0.75s linear infinite',
            }} />
          </div>
        )}
      </div>

      {/* Dropdown */}
      {open && results.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 500,
          background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
          borderTop: 'none', borderRadius: '0 0 var(--radius-md) var(--radius-md)',
          boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
          maxHeight: 380, overflowY: 'auto',
        }}>
          {results.map((s, i) => (
            <div
              key={s.ticker}
              onMouseDown={() => handleSelect(s)}
              onMouseEnter={() => setHighlight(i)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 14px', cursor: 'pointer',
                background: highlight === i ? 'var(--bg-hover)' : 'transparent',
                borderBottom: i < results.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                transition: 'background 0.1s',
              }}
            >
              {/* Flag */}
              <span style={{ fontSize: 18, flexShrink: 0 }}>{FLAG[s.country] ?? '🌐'}</span>

              {/* Name + Ticker */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontSize: 13, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {s.name}
                </p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                  {s.ticker} · {s.exchange}
                </p>
              </div>

              {/* Sector badge */}
              <span style={{
                fontSize: 10, padding: '2px 8px', borderRadius: 20, flexShrink: 0,
                background: 'var(--bg-card)', color: 'var(--text-secondary)',
                border: '1px solid var(--border-subtle)',
              }}>
                {s.sector}
              </span>
            </div>
          ))}

          {/* Footer hint */}
          <div style={{
            padding: '7px 14px', fontSize: 10, color: 'var(--text-muted)',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex', gap: 12,
          }}>
            <span>↑↓ navigate</span>
            <span>↵ select</span>
            <span>esc close</span>
          </div>
        </div>
      )}
    </div>
  )
}