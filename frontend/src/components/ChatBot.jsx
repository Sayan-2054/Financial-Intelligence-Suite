import { useState, useRef, useEffect } from 'react'
import { sendChat } from '../api/client.js'

const INTRO = `Hi, I'm **ARIA** — your Analytical Risk Intelligence Assistant.

I can explain technical indicators, interpret investment signals, and discuss market patterns for any ticker you've analyzed.

**⚠ For educational purposes only — not financial advice.**

What would you like to know?`

const QUICK = [
  'What does the RSI indicate?',
  'Explain the MACD signal',
  'Is this a good entry point?',
  'What are the key risks?',
  'Explain the Golden Cross',
]

// Minimal markdown: **bold** and newlines → <br>
function renderMd(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br/>')
}

function Avatar() {
  return (
    <div style={{
      width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
      background: 'var(--accent-cyan)', color: '#080c12',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13,
      marginRight: 8, marginTop: 2,
    }}>Φ</div>
  )
}

function Bubble({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div style={{
      display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start',
      alignItems: 'flex-start', marginBottom: 14,
    }}>
      {!isUser && <Avatar />}
      <div
        style={{
          maxWidth: '80%', padding: '10px 14px', fontSize: 13, lineHeight: 1.7,
          fontFamily: 'var(--font-mono)', color: 'var(--text-primary)',
          borderRadius: isUser ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
          background: isUser ? 'var(--accent-indigo)' : 'var(--bg-elevated)',
          border: `1px solid ${isUser ? 'rgba(99,102,241,0.4)' : 'var(--border-subtle)'}`,
        }}
        dangerouslySetInnerHTML={{ __html: renderMd(msg.content) }}
      />
    </div>
  )
}

function Typing() {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 14 }}>
      <Avatar />
      <div style={{
        padding: '12px 16px', borderRadius: '14px 14px 14px 4px',
        background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
        display: 'flex', gap: 5, alignItems: 'center',
      }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 6, height: 6, borderRadius: '50%',
            background: 'var(--accent-cyan)', opacity: 0.7,
            animation: `bounce-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
          }} />
        ))}
      </div>
    </div>
  )
}

export default function ChatBot({ ticker, hasAnalysis, onClose, context = null }) {
  const [messages,   setMessages]   = useState([{ role: 'assistant', content: INTRO }])
  const [input,      setInput]      = useState('')
  const [loading,    setLoading]    = useState(false)
  const [sessionId]                 = useState(() => `s_${Date.now()}`)
  const bottomRef  = useRef(null)
  const inputRef   = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, loading])
  useEffect(() => { inputRef.current?.focus() }, [])

  async function send(text) {
    const msg = text.trim()
    if (!msg || loading) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: msg }])
    setLoading(true)
    try {
      const res = await sendChat({
        message:    msg,
        ticker:     hasAnalysis ? ticker : undefined,
        session_id: sessionId,
        // Pass MF context as part of message if available
        ...(context && !hasAnalysis ? { message: `Context:\n${context}\n\nQuestion: ${msg}` } : {}),
      })
      setMessages(prev => [...prev, { role: 'assistant', content: res.response }])
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `⚠ Error: ${err.message}. Check that the backend is running and ANTHROPIC_API_KEY is set.`,
      }])
    } finally {
      setLoading(false)
    }
  }

  const showSuggestions = messages.length <= 2 && !loading

  return (
    <div style={{
      position: 'fixed', bottom: 90, right: 28, zIndex: 200,
      width: 400, maxWidth: 'calc(100vw - 40px)',
      height: 560, maxHeight: 'calc(100vh - 120px)',
      display: 'flex', flexDirection: 'column',
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-xl)',
      boxShadow: '0 20px 60px rgba(0,0,0,0.6), var(--shadow-glow-cyan)',
      overflow: 'hidden',
      animation: 'fade-in-up 0.25s ease',
    }}>

      {/* Header */}
      <div style={{
        padding: '13px 16px', borderBottom: '1px solid var(--border-subtle)',
        background: 'var(--bg-deep)', display: 'flex', alignItems: 'center', gap: 10,
        flexShrink: 0,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'var(--accent-cyan)', color: '#080c12',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15,
        }}>Φ</div>
        <div style={{ flex: 1 }}>
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14 }}>ARIA</p>
          <p style={{ fontSize: 10, color: 'var(--text-muted)' }}>
            {hasAnalysis ? `Context: ${ticker}` : 'Financial Analyst AI'}
            {' · '}
            <span style={{ color: 'var(--signal-buy)' }}>● online</span>
          </p>
        </div>
        <button onClick={onClose} style={{
          background: 'none', border: 'none', color: 'var(--text-muted)',
          cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: '2px 4px',
        }}>×</button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px 0' }}>
        {messages.map((m, i) => <Bubble key={i} msg={m} />)}
        {loading && <Typing />}
        <div ref={bottomRef} />
      </div>

      {/* Quick suggestions */}
      {showSuggestions && (
        <div style={{ padding: '8px 14px', display: 'flex', gap: 6, flexWrap: 'wrap', flexShrink: 0 }}>
          {QUICK.map(s => (
            <button key={s} onClick={() => send(s)} style={{
              padding: '4px 10px', borderRadius: 20, fontSize: 11, cursor: 'pointer',
              background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)',
              transition: 'border-color 0.15s, color 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-cyan)'; e.currentTarget.style.color = 'var(--accent-cyan)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input row */}
      <div style={{
        padding: '10px 14px', borderTop: '1px solid var(--border-subtle)',
        background: 'var(--bg-deep)', display: 'flex', gap: 8, alignItems: 'flex-end',
        flexShrink: 0,
      }}>
        <textarea
          ref={inputRef}
          value={input}
          rows={1}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input) } }}
          placeholder="Ask about indicators, signals, risk…"
          style={{
            flex: 1, background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)', padding: '9px 12px',
            color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: 13,
            outline: 'none', resize: 'none', lineHeight: 1.5, maxHeight: 80, overflowY: 'auto',
          }}
          onFocus={e  => e.currentTarget.style.borderColor = 'var(--accent-cyan)'}
          onBlur={e   => e.currentTarget.style.borderColor = 'var(--border-default)'}
        />
        <button
          onClick={() => send(input)}
          disabled={loading || !input.trim()}
          style={{
            width: 38, height: 38, borderRadius: 'var(--radius-md)', flexShrink: 0,
            background: (!loading && input.trim()) ? 'var(--accent-cyan)' : 'var(--bg-elevated)',
            color:      (!loading && input.trim()) ? '#080c12' : 'var(--text-muted)',
            border: 'none', cursor: (!loading && input.trim()) ? 'pointer' : 'default',
            fontSize: 17, display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.2s, color 0.2s',
          }}
        >↑</button>
      </div>
    </div>
  )
}