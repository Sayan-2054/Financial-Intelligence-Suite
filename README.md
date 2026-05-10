# 💹 Financial Intelligence Suite

> AI-powered stock analysis platform with real-time data, ML forecasting, and an intelligent AI analyst — built with FastAPI, React, and Ollama.

**Live Demo →** [financial-intelligence-suite-seven.vercel.app](https://financial-intelligence-suite-seven.vercel.app)

---

## ✨ Features

### 📈 Stock Analysis
- **Global stock data** fetched in real-time via `yfinance` (NSE, BSE, NYSE, NASDAQ, LSE, Frankfurt, Tokyo)
- **Interactive price charts** with timeframe controls: `1D` `1W` `1M` `6M` `1Y` `5Y` `All`
- **7-day ML price forecast** overlaid as a dashed green line with a green confidence band
- **Auto-suggestions** when searching for any stock worldwide
- **Bullish / Bearish indicators** with trend breakdowns

### 🎯 Buy / Hold / Sell Signal
Every stock gets a composite **strength score (0–100)**:
- **Above 60** → BUY
- **40–60** → HOLD
- **Below 40** → SELL

### 📊 Fundamental Data
- PE Ratio, Market Cap, EPS, 52-week high/low, and more

### 🤖 ARIA — AI Analyst
ARIA is your on-demand AI financial analyst, available on **stock pages**, **mutual fund pages**, and the **comparison page**.
- Powered by **Ollama (Llama 3.2)** running locally, tunneled via **ngrok**
- **RAG-enhanced** — ARIA automatically receives the current screen's live data as context
- Ask anything: *"What does the RSI tell me?"*, *"Is this a good entry point?"*, *"Which of these 3 stocks is stronger?"*
- Tap the **◎** button on any supported page to open ARIA

### 🇮🇳 Mutual Funds (India)
- Search across **2,000+ Indian mutual funds**
- View **NAV history** and **returns across multiple periods**
- **SIP Calculator** with monthly amount, duration, expected return, annual step-up, and inflation-adjustment toggle
- Outputs: Total Invested · Wealth Gained · Maturity Value · Absolute Return
- Interactive graph: Total Invested vs Estimated Value
- NAV data sourced from **mfapi.in** (AMFI India)

### 💼 Portfolio Tracker
- Add holdings by company name
- Track **real-time P&L** and **return %** (prices fetched live from yfinance)
- P&L = (Current Price − Buy Price) × Quantity; Return % = (P&L / Total Invested) × 100
- View **sector allocation** pie chart based on current market value
- Data stored in **browser localStorage** — completely private, no account needed

### ⭐ Watchlist
- Star any stock or fund to save it
- One-click access from anywhere in the app

### ⚖️ Compare Tool
- Compare **up to 3 stocks** side by side
- Relative price performance, signal strength, and all indicators in parallel

### 🎨 UI / UX
- Futuristic **dark / night theme**
- Fully interactive charts and graphs throughout
- **Tour mode** for first-time users
- **"How It Works"** tab explaining the full technical architecture

---

## 🧠 ML Forecasting — Random Forest Regressor

### What is it?
The app uses a **Random Forest Regressor** — an ensemble of **200 decision trees** — to forecast the next 7 days of price movement for any stock.

### Input Features

| Feature | Description |
|---|---|
| 10 lag features | Past 1–10 day % price changes |
| RSI (14-day) | Momentum indicator |
| MACD line & signal line | Trend-following momentum |
| 50-day & 200-day SMA ratios | Long-term trend context |
| Volume ratio | Current volume vs 20-day average |
| Rolling 10-day volatility | Recent price variability |

### 7-Day Iterative Forecasting
The model uses **iterative multi-step forecasting**: it predicts Day 1, then feeds that prediction back as input to predict Day 2, and so on through Day 7. Each of the 200 trees produces its own independent prediction — the spread across all trees forms the **confidence band** (green shaded area on the chart).

### Confidence Bands
- **Upper band** = mean prediction + 1.5 × standard deviation of all trees
- **Lower band** = mean prediction − 1.5σ
- **Wider bands** = higher uncertainty in the forecast

### ⚠️ Important Limitation
> The model is **retrained from scratch on every request** using the last 2 years of daily OHLCV data. It has no memory of past predictions and **cannot account for news events, earnings surprises, or macroeconomic shocks**. Treat forecasts as probabilistic guidance, not financial advice.

---

## 🎯 Signal Scoring — How BUY / SELL / HOLD is Calculated

### Score Components (0–100)

| Condition | Points |
|---|---|
| RSI < 30 (oversold) | +30 |
| RSI > 70 (overbought) | −30 |
| RSI neutral | proportional |
| MACD Histogram positive | up to +20 |
| MACD Histogram negative | down to −20 |
| Price above 50-day SMA | +15 |
| Price below 50-day SMA | −15 |
| Price above 200-day SMA | +15 |
| Price below 200-day SMA | −15 |
| Golden Cross active | +10 |
| Death Cross active | −10 |
| ML forecast bullish (> +1.5%) | +10 |
| ML forecast bearish (< −1.5%) | −10 |

**Golden Cross** = 50-day SMA crosses above 200-day SMA (bullish). **Death Cross** = the opposite. Both are detected if the crossover occurred in the last 5 trading days.

> The ML model captures price patterns; technical indicators capture momentum and trend. Combining both produces a more robust signal than either alone.

---

## 📊 Technical Indicators

### RSI — Relative Strength Index
Measures how fast prices are moving up vs down over 14 days (scale: 0–100). Below 30 = oversold (bullish signal). Above 70 = overbought (bearish signal). Calculated using exponential weighted moving averages of gains and losses.

### MACD — Moving Average Convergence Divergence
- **MACD** = 12-day EMA − 26-day EMA
- **Signal Line** = 9-day EMA of MACD
- **Histogram** = MACD − Signal Line

Positive histogram = short-term momentum stronger than long-term (bullish). Negative = bearish.

### 50-Day & 200-Day SMA
Average closing price over the last 50 or 200 trading days. Price above SMA = uptrend. The 200-day SMA is widely watched by institutional investors as the long-term trend line.

---

## 💬 ARIA — RAG Architecture

### What is RAG?
RAG = **Retrieval-Augmented Generation**. Instead of asking the AI a raw question, the app first retrieves the stock's live indicators, forecast, and signal — and injects them into the conversation as context. ARIA answers based on that real data, not just its training knowledge.

### How ARIA Works Step by Step
1. You open a stock/fund/comparison page and click the **◎** button
2. The app fetches the latest analysis for that stock
3. All indicators, forecast, and signal are formatted as structured text
4. This context is prepended to your question as `<retrieved_context>`
5. The full prompt is sent to **Ollama running on your local machine** via ngrok tunnel
6. The local LLM (Llama 3.2) generates a response
7. If your question mentions investing, a **disclaimer is auto-appended**

### Privacy
Your questions and stock data never leave your machine. ngrok creates a secure tunnel so the deployed backend on Render can reach Ollama on your PC.

### System Prompt Guardrails
ARIA is instructed to: never guarantee returns, always include disclaimers on investment advice, refuse illegal activity requests, and clearly distinguish between historical facts and probabilistic forecasts. These rules are enforced in the system prompt and **cannot be overridden by users**.

---

## 📐 SIP Calculator Logic

### Basic SIP Formula
```
M = P × [(1 + r)^n − 1] / r × (1 + r)
```
Where `P` = monthly investment, `r` = monthly rate (annual rate ÷ 12), `n` = total months.

### Step-Up SIP
Every year, the monthly SIP amount increases by the step-up %. For example, starting at ₹5,000/month with a 10% step-up: Year 2 → ₹5,500, Year 3 → ₹6,050. This models real-world salary growth.

### Inflation Adjustment
When toggled on, the maturity value is divided by `(1 + inflation rate)^years` to show **real purchasing power**, not just the nominal value. Default inflation assumed: **6% per year**.

---

## 🗄️ Data Sources

| Data | Source |
|---|---|
| Stock OHLCV | Yahoo Finance via `yfinance` (cached 5 min on backend) |
| Mutual Fund NAV | `mfapi.in` sourced from AMFI India (called directly from browser) |
| Intraday prices | May be delayed 15–20 min depending on Yahoo Finance |

### Supported Exchanges

| Exchange | Suffix | Example |
|---|---|---|
| NSE India | `.NS` | `RELIANCE.NS` |
| BSE India | `.BO` | `RELIANCE.BO` |
| NYSE / NASDAQ | _(none)_ | `AAPL`, `MSFT` |
| London Stock Exchange | `.L` | `VOD.L` |
| Frankfurt | `.DE` | `BMW.DE` |
| Tokyo | `.T` | `7203.T` |

---

## 🏗️ System Architecture

```
Browser (React + Vite — Vercel)
    │
    ├──► FastAPI Backend (Render)
    │       ├── yfinance — stock data
    │       ├── scikit-learn — Random Forest ML engine
    │       └── ngrok tunnel ──► Ollama (Llama 3.2 — your local PC)
    │
    └──► mfapi.in — Mutual Fund NAV (direct, no backend)

localStorage — Portfolio, Watchlist, Recently Viewed (browser only)
```

### ⚠️ Cold Start Notice
Render's free tier spins down after 15 minutes of inactivity. The **first request may take 30–60 seconds** to wake the server. Subsequent requests are fast (5–10s). Upgrading to Render's $7/month paid tier eliminates cold starts.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, CSS |
| Backend | Python, FastAPI — deployed on Render |
| Stock Data | yfinance |
| Mutual Fund Data | mfapi.in (AMFI India) |
| AI / LLM | Ollama (Llama 3.2) via ngrok tunnel |
| ML Forecasting | Scikit-learn — Random Forest Regressor (200 estimators) |
| Storage | Browser localStorage |
| Deployment | Vercel (frontend), Render (backend) |

---

## 🏗️ Project Structure

```
Financial-Intelligence-Suite/
├── backend/          # FastAPI server — data fetching, ML engine, signal computation, ARIA RAG
└── frontend/         # React app — charts, UI, SIP calculator, portfolio tracker, watchlist
```

---

## 🚀 Getting Started

### Prerequisites
- Python 3.9+
- Node.js 18+
- [Ollama](https://ollama.ai) installed locally with `llama3.2` pulled
- ngrok account (for ARIA tunneling)

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### ARIA (Ollama + ngrok)

```bash
# Pull the model
ollama pull llama3.2

# Start Ollama
ollama serve

# Expose via ngrok
ngrok http 11434
```

Update the ngrok URL in your backend config so ARIA can reach your local Ollama instance.

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:5173`

---

## 📖 How to Use

| Feature | How to access |
|---|---|
| Search stocks | Type in the search bar — auto-suggestions appear |
| Open ARIA | Tap the **◎** button on any stock, fund, or compare page |
| SIP Calculator | Go to **Mutual Funds** tab → select any fund → scroll to calculator |
| Portfolio | Click **Portfolio** tab → add holdings by company name |
| Watchlist | Click the **☆** icon on any stock or fund |
| Compare stocks | Go to **Compare** tab → add up to 3 stocks |
| First-time tour | Click **Tour** for a guided walkthrough |

---

## 📄 License

MIT © [Sayantan Chowdhury](https://github.com/Sayan-2054)
