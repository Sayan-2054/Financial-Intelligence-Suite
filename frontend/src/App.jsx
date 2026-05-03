import { useState, useCallback } from 'react'
import Dashboard from './components/Dashboard.jsx'

export default function App() {
  const [input, setInput]   = useState('AAPL')
  const [ticker, setTicker] = useState('AAPL')

  const handleSearch = useCallback((val) => {
    const t = val.toUpperCase().trim()
    if (t) setTicker(t)
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      background: `
        radial-gradient(ellipse 80% 50% at 50% -20%, rgba(34,211,238,0.04) 0%, transparent 70%),
        radial-gradient(ellipse 60% 40% at 80% 80%, rgba(99,102,241,0.03) 0%, transparent 60%),
        var(--bg-void)
      `,
    }}>
      <Dashboard
        ticker={ticker}
        input={input}
        onInputChange={setInput}
        onSearch={handleSearch}
      />
    </div>
  )
}