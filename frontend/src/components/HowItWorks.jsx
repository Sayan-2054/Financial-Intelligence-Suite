// src/components/HowItWorks.jsx
import { useState } from 'react'

const SECTIONS = [
  {
    id: 'prediction',
    icon: '🤖',
    title: 'Prediction Model',
    subtitle: 'Random Forest Regressor',
    color: '#22d3ee',
    content: [
      {
        heading: 'What is it?',
        body: `The app uses a Random Forest Regressor — an ensemble of 200 decision trees — to forecast the next 7 days of price movement for any stock.`,
      },
      {
        heading: 'Input Features (what it learns from)',
        body: null,
        list: [
          '10 lag features — past 1–10 day % price changes',
          'RSI (14-day) — momentum indicator',
          'MACD line and signal line',
          '50-day and 200-day SMA ratios',
          'Volume ratio (current vs 20-day average)',
          'Rolling 10-day volatility',
        ],
      },
      {
        heading: 'How it forecasts 7 days',
        body: `It uses iterative multi-step forecasting. The model predicts day 1, then uses that prediction as input to predict day 2, and so on. Each tree in the forest gives its own prediction — the spread of tree predictions forms the confidence band (the green shaded area on the chart).`,
      },
      {
        heading: 'Confidence Bands',
        body: `Upper band = mean prediction + 1.5 × standard deviation of all trees. Lower band = mean − 1.5σ. Wider bands = more uncertainty.`,
      },
      {
        heading: 'Important Limitation',
        body: `The model is retrained from scratch on every request using the last 2 years of daily data. It has no memory of past predictions. It cannot account for news events, earnings surprises, or macroeconomic shocks.`,
      },
    ],
  },
  {
    id: 'scoring',
    icon: '🎯',
    title: 'Signal Scoring',
    subtitle: 'How BUY / SELL / HOLD is calculated',
    color: '#a78bfa',
    content: [
      {
        heading: 'The Composite Score (0–100)',
        body: `Every stock gets a score from 0 to 100. Above 60 = BUY, below 40 = SELL, 40–60 = HOLD.`,
      },
      {
        heading: 'Score Components',
        body: null,
        list: [
          'RSI < 30 (oversold): +30 points',
          'RSI > 70 (overbought): −30 points',
          'RSI neutral: proportional score',
          'MACD Histogram positive: up to +20 points',
          'MACD Histogram negative: down to −20 points',
          'Price above 50-Day SMA: +15 points',
          'Price below 50-Day SMA: −15 points',
          'Price above 200-Day SMA: +15 points',
          'Price below 200-Day SMA: −15 points',
          'Golden Cross active: +10 points',
          'Death Cross active: −10 points',
          'ML forecast bullish (>+1.5%): +10 points',
          'ML forecast bearish (<−1.5%): −10 points',
        ],
      },
      {
        heading: 'Golden Cross vs Death Cross',
        body: `Golden Cross = the 50-day SMA crosses above the 200-day SMA. Historically bullish. Death Cross = the opposite. Both are detected by checking if the crossover happened in the last 5 trading days.`,
      },
      {
        heading: 'Why not just use the ML forecast?',
        body: `The ML model only captures price patterns. Technical indicators capture momentum and trend. Combining both gives a more robust signal than either alone.`,
      },
    ],
  },
  {
    id: 'indicators',
    icon: '📊',
    title: 'Technical Indicators',
    subtitle: 'RSI, MACD, Moving Averages',
    color: '#34d399',
    content: [
      {
        heading: 'RSI — Relative Strength Index',
        body: `RSI measures how fast prices are moving up vs down over 14 days. Scale: 0–100. Below 30 = oversold (potentially undervalued, bullish signal). Above 70 = overbought (potentially overvalued, bearish signal). Calculated using exponential weighted moving averages of gains and losses.`,
      },
      {
        heading: 'MACD — Moving Average Convergence Divergence',
        body: `MACD = 12-day EMA minus 26-day EMA. Signal Line = 9-day EMA of MACD. Histogram = MACD minus Signal. When histogram is positive, short-term momentum is stronger than long-term — bullish. When negative — bearish.`,
      },
      {
        heading: '50-Day & 200-Day Simple Moving Average',
        body: `Average closing price over the last 50 or 200 trading days. Price above SMA = uptrend. Price below = downtrend. The 200-day SMA is widely watched by institutional investors as the long-term trend line.`,
      },
      {
        heading: 'Why these three?',
        body: `RSI catches momentum extremes (oversold/overbought). MACD captures trend changes. Moving averages confirm the overall direction. Together they cover three different aspects of price behaviour.`,
      },
    ],
  },
  {
    id: 'sip',
    icon: '📐',
    title: 'SIP Calculator',
    subtitle: 'Compound interest & step-up logic',
    color: '#fb923c',
    content: [
      {
        heading: 'Basic SIP Formula',
        body: `Each month you invest a fixed amount. That amount earns compound interest every month. The formula used is: M = P × [(1 + r)^n − 1] / r × (1 + r), where P = monthly investment, r = monthly rate (annual rate ÷ 12), n = total months.`,
      },
      {
        heading: 'Step-Up SIP',
        body: `Every year, your monthly SIP amount increases by the step-up percentage. For example, if you start at ₹5,000/month with a 10% step-up, year 2 becomes ₹5,500, year 3 becomes ₹6,050, and so on. This models real-world salary growth.`,
      },
      {
        heading: 'Inflation Adjustment',
        body: `When "Inflation Adjusted" is toggled on, the maturity value is divided by (1 + inflation rate)^years. This shows the real purchasing power of your returns, not just the nominal value. Default inflation assumed: 6% per year.`,
      },
      {
        heading: 'Important Note',
        body: `The expected return % you enter is an assumption, not a guarantee. Mutual fund returns vary year to year. Historical average for Indian equity funds is roughly 12–15% CAGR over long periods, but any single year can be significantly different.`,
      },
    ],
  },
  {
    id: 'chatbot',
    icon: '💬',
    title: 'ARIA Chatbot',
    subtitle: 'RAG architecture with local LLM',
    color: '#f472b6',
    content: [
      {
        heading: 'What is RAG?',
        body: `RAG = Retrieval-Augmented Generation. Instead of asking the AI a raw question, we first retrieve relevant data (the stock's indicators, forecast, signal) and inject it into the conversation as context. The AI then answers based on that real data, not just its training knowledge.`,
      },
      {
        heading: 'How ARIA works step by step',
        body: null,
        list: [
          'Step 1: You open a stock and click the chat button',
          'Step 2: The app fetches the latest analysis for that stock',
          'Step 3: All indicators, forecast, and signal are formatted as structured text',
          'Step 4: This context is prepended to your question as <retrieved_context>',
          'Step 5: The full prompt is sent to Ollama running on your local machine',
          'Step 6: The local LLM (e.g. llama3.2) generates a response',
          'Step 7: If your question mentions investing, a disclaimer is auto-appended',
        ],
      },
      {
        heading: 'Local LLM via Ollama',
        body: `Unlike cloud AI services, ARIA runs on your own computer via Ollama. Your questions and stock data never leave your machine. ngrok creates a secure tunnel so the deployed backend on Render can reach Ollama on your PC.`,
      },
      {
        heading: 'System Prompt Guardrails',
        body: `ARIA is instructed to never guarantee returns, always include disclaimers on investment advice, refuse illegal activity requests, and distinguish clearly between historical facts and probabilistic forecasts. These rules are enforced in the system prompt and cannot be overridden by users.`,
      },
    ],
  },
  {
    id: 'portfolio',
    icon: '📁',
    title: 'Portfolio Tracker',
    subtitle: 'Local-first, no account needed',
    color: '#60a5fa',
    content: [
      {
        heading: 'How P&L is calculated',
        body: `P&L (Profit & Loss) = (Current Price − Buy Price) × Quantity. Return % = (P&L / Total Invested) × 100. Current prices are fetched live from yfinance when you open the Portfolio page.`,
      },
      {
        heading: 'Data Storage',
        body: `All portfolio data is stored in your browser's localStorage. It never leaves your device. No account, no server, no cloud. The tradeoff: clearing browser data or using a different device will lose your portfolio.`,
      },
      {
        heading: 'Sector Allocation Chart',
        body: `The pie chart shows how your portfolio is distributed across sectors (Technology, Banking, Energy, etc.) based on current market value — not invested amount. This updates automatically as prices change.`,
      },
    ],
  },
  {
    id: 'data',
    icon: '🗄️',
    title: 'Data Sources',
    subtitle: 'Where the numbers come from',
    color: '#fbbf24',
    content: [
      {
        heading: 'Stock Price Data — yfinance',
        body: `All stock OHLCV (Open, High, Low, Close, Volume) data comes from Yahoo Finance via the yfinance Python library. Data is fetched on-demand from the Render backend. 5-minute cache prevents repeated calls for the same ticker.`,
      },
      {
        heading: 'Mutual Fund NAV — mfapi.in + AMFI',
        body: `NAV (Net Asset Value) history for Indian mutual funds comes from mfapi.in, which sources data directly from AMFI India (Association of Mutual Funds in India). This API is called directly from your browser — no Render backend involved.`,
      },
      {
        heading: 'Supported Exchanges',
        body: null,
        list: [
          'NSE India — append .NS (e.g. RELIANCE.NS)',
          'BSE India — append .BO (e.g. RELIANCE.BO)',
          'NYSE / NASDAQ — no suffix (e.g. AAPL, MSFT)',
          'London Stock Exchange — append .L',
          'Frankfurt — append .DE',
          'Tokyo — append .T',
        ],
      },
      {
        heading: 'Data Freshness',
        body: `Stock data is cached for 5 minutes on the Render backend. Mutual fund NAV is updated by AMFI once daily after market close. Intraday prices may be delayed by 15–20 minutes depending on Yahoo Finance.`,
      },
    ],
  },
  {
    id: 'architecture',
    icon: '🏗️',
    title: 'System Architecture',
    subtitle: 'How all the pieces connect',
    color: '#818cf8',
    content: [
      {
        heading: 'Full Stack Overview',
        body: null,
        list: [
          'Frontend: React + Vite, deployed on Vercel (free)',
          'Backend API: FastAPI + Python, deployed on Render (free)',
          'ML Engine: scikit-learn Random Forest, runs on Render',
          'LLM: Ollama running locally on your PC',
          'Tunnel: ngrok connects Render → your local Ollama',
          'MF Data: mfapi.in called directly from browser (no backend)',
          'Storage: localStorage for portfolio, watchlist, recently viewed',
        ],
      },
      {
        heading: 'Why Render Free Tier is Slow',
        body: `Render's free tier spins down after 15 minutes of inactivity. The first request takes 30–60 seconds to wake the server. Subsequent requests are fast (5–10s). This is a cost tradeoff — upgrading to Render's $7/month paid tier eliminates cold starts.`,
      },
      {
        heading: 'Security Note',
        body: `The app uses CORS to restrict which domains can call the backend API. Your portfolio and watchlist data never touches any server. The only data sent to the backend is ticker symbols for analysis requests.`,
      },
    ],
  },
]

function Section({ section }) {
  const [open, setOpen] = useState(false)

  return (
    <div style={{
      border: `1px solid ${open ? section.color + '40' : 'var(--border-subtle)'}`,
      borderRadius: 'var(--radius-lg)', overflow: 'hidden',
      transition: 'border-color 0.2s',
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', padding: '18px 22px',
          background: open ? `${section.color}08` : 'var(--bg-card)',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 14,
          transition: 'background 0.2s',
        }}
      >
        <span style={{ fontSize: 28, flexShrink: 0 }}>{section.icon}</span>
        <div style={{ flex: 1, textAlign: 'left' }}>
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: open ? section.color : 'var(--text-primary)', transition: 'color 0.2s' }}>
            {section.title}
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{section.subtitle}</p>
        </div>
        <span style={{ fontSize: 18, color: 'var(--text-muted)', transition: 'transform 0.2s', transform: open ? 'rotate(90deg)' : 'rotate(0)' }}>›</span>
      </button>

      {open && (
        <div style={{ padding: '0 22px 22px', borderTop: `1px solid ${section.color}20` }}>
          {section.content.map((block, i) => (
            <div key={i} style={{ marginTop: 18 }}>
              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13, color: section.color, marginBottom: 8, letterSpacing: '0.03em' }}>
                {block.heading}
              </p>
              {block.body && (
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.75 }}>
                  {block.body}
                </p>
              )}
              {block.list && (
                <ul style={{ paddingLeft: 20, margin: 0 }}>
                  {block.list.map((item, j) => (
                    <li key={j} style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.75, marginBottom: 4 }}>
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function HowItWorks({ onClose }) {
  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 32px 100px' }}>
      <div style={{ marginBottom: 36 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, color: 'var(--text-primary)', marginBottom: 6 }}>
              ❓ How It Works
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 520 }}>
              Everything explained — from the ML model to the chatbot architecture. Click any section to expand.
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {SECTIONS.map(s => <Section key={s.id} section={s} />)}
      </div>

      <div style={{
        marginTop: 32, padding: '16px 20px', borderRadius: 'var(--radius-md)',
        background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)',
        color: 'var(--text-muted)', fontSize: 12, lineHeight: 1.7,
      }}>
        ⚖ <strong style={{ color: 'var(--signal-hold)' }}>DISCLAIMER:</strong> This application is built for educational and portfolio demonstration purposes only. All analysis, signals, forecasts, and recommendations are not financial advice. Always consult a SEBI-registered investment advisor before making investment decisions.
      </div>
    </div>
  )
}