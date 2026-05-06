// src/components/OnboardingTour.jsx
import { useState, useEffect } from 'react'

const STEPS = [
  {
    icon: '👋',
    title: 'Welcome to Financial Intelligence Suite',
    body: 'Your AI-powered platform for stock analysis, mutual fund research, and investment planning. Built by Sayantan Chowdhury.',
    highlight: null,
    tip: null,
  },
  {
    icon: '🔍',
    title: 'Search Any Stock or Company',
    body: 'Use the search bar to find any stock worldwide. Just type the company name — no ticker codes needed. Try "Reliance", "Apple", or "HDFC Bank".',
    highlight: 'search',
    tip: '💡 The search covers 200+ stocks across India, US, and global markets.',
  },
  {
    icon: '📊',
    title: 'Understand the Signal',
    body: 'Every stock gets a BUY / SELL / HOLD signal with a strength score (0–100). This combines RSI, MACD, Moving Averages, and our ML forecast into one composite score.',
    highlight: null,
    tip: '💡 Click "How It Works" anytime to understand the exact calculation.',
  },
  {
    icon: '📈',
    title: 'Explore the Chart',
    body: 'The price chart shows historical data plus a 7-day ML forecast (dashed green line). Use the timeframe buttons — 1D, 1W, 1M, 6M, 1Y, 5Y, All — to zoom in or out.',
    highlight: null,
    tip: '💡 The green shaded area around the forecast shows the confidence band — wider = more uncertainty.',
  },
  {
    icon: '💬',
    title: 'Ask ARIA',
    body: 'Tap the ◎ button on any stock page to open ARIA — your AI analyst. Ask anything: "What does the RSI tell me?" or "Is this a good entry point?" ARIA uses the actual stock data to answer.',
    highlight: null,
    tip: '💡 ARIA runs on your local Ollama model — your questions never leave your machine.',
  },
  {
    icon: '📊',
    title: 'Explore Mutual Funds',
    body: 'Switch to the Mutual Funds tab to search 2,000+ Indian funds. View NAV history, returns across periods, and use the SIP Calculator to plan your investments.',
    highlight: 'mf-tab',
    tip: '💡 MF data is fetched directly from AMFI India — no backend calls needed.',
  },
  {
    icon: '📁',
    title: 'Track Your Portfolio',
    body: 'Use the Portfolio tab to add your holdings by company name. Track real-time P&L, returns, and sector allocation — all stored privately in your browser.',
    highlight: null,
    tip: '💡 No account needed. All data stays in your browser\'s localStorage.',
  },
  {
    icon: '★',
    title: 'Save to Watchlist',
    body: 'Click the ☆ star icon on any stock or fund to add it to your Watchlist for quick access. Your watchlist is always one click away.',
    highlight: null,
    tip: null,
  },
  {
    icon: '⚖',
    title: 'Compare Stocks',
    body: 'Use the Compare tab to pit up to 3 stocks against each other. See relative price performance, signal strength, and all indicators side by side.',
    highlight: null,
    tip: null,
  },
  {
    icon: '🚀',
    title: "You're Ready!",
    body: 'Start by searching for a stock you\'re interested in, or click any of the popular stocks on the home screen. Remember: this is for education only — always consult an advisor before investing.',
    highlight: null,
    tip: '⚖ Not financial advice. For educational purposes only.',
  },
]

export default function OnboardingTour({ onComplete }) {
  const [step, setStep] = useState(0)
  const current = STEPS[step]
  const isLast  = step === STEPS.length - 1

  function next() {
    if (isLast) { onComplete(); return }
    setStep(s => s + 1)
  }

  function skip() { onComplete() }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-xl)', padding: '36px 32px', width: '100%', maxWidth: 500,
        boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
        animation: 'fade-in-up 0.3s ease',
      }}>
        {/* Progress dots */}
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 28 }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{
              width: i === step ? 20 : 6, height: 6, borderRadius: 3,
              background: i === step ? 'var(--accent-cyan)' : i < step ? 'var(--border-accent)' : 'var(--bg-hover)',
              transition: 'all 0.3s',
            }} />
          ))}
        </div>

        {/* Icon */}
        <div style={{ textAlign: 'center', fontSize: 52, marginBottom: 16 }}>
          {current.icon}
        </div>

        {/* Title */}
        <h2 style={{
          fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22,
          color: 'var(--text-primary)', textAlign: 'center', marginBottom: 14, lineHeight: 1.3,
        }}>
          {current.title}
        </h2>

        {/* Body */}
        <p style={{
          fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.75,
          textAlign: 'center', marginBottom: current.tip ? 16 : 28,
        }}>
          {current.body}
        </p>

        {/* Tip */}
        {current.tip && (
          <div style={{
            padding: '10px 16px', borderRadius: 'var(--radius-md)', marginBottom: 28,
            background: 'rgba(34,211,238,0.06)', border: '1px solid rgba(34,211,238,0.2)',
          }}>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, textAlign: 'center' }}>
              {current.tip}
            </p>
          </div>
        )}

        {/* Step counter */}
        <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', marginBottom: 18 }}>
          {step + 1} of {STEPS.length}
        </p>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          {!isLast && (
            <button onClick={skip} style={{
              flex: 1, padding: '11px', borderRadius: 'var(--radius-md)',
              background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
              color: 'var(--text-secondary)', cursor: 'pointer',
              fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13,
              transition: 'all 0.2s',
            }}>
              Skip Tour
            </button>
          )}
          <button onClick={next} style={{
            flex: 2, padding: '11px', borderRadius: 'var(--radius-md)',
            background: isLast ? 'var(--signal-buy)' : 'var(--accent-cyan)',
            color: '#080c12', border: 'none', cursor: 'pointer',
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14,
            transition: 'all 0.2s',
          }}>
            {isLast ? "Let's Go! 🚀" : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  )
}