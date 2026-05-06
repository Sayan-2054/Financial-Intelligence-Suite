// src/hooks/usePortfolio.js
import { useLocalStorage } from './useLocalStorage.js'
import { useCallback } from 'react'

// holding: { id, ticker, name, type, quantity, buyPrice, buyDate, notes }
export function usePortfolio() {
  const [holdings, setHoldings] = useLocalStorage('fis_portfolio', [])

  const add = useCallback((holding) => {
    setHoldings(prev => [{
      ...holding,
      id: `h_${Date.now()}`,
      addedAt: new Date().toISOString(),
    }, ...prev])
  }, [setHoldings])

  const remove = useCallback((id) => {
    setHoldings(prev => prev.filter(h => h.id !== id))
  }, [setHoldings])

  const update = useCallback((id, changes) => {
    setHoldings(prev => prev.map(h => h.id === id ? { ...h, ...changes } : h))
  }, [setHoldings])

  // Compute P&L for a holding given current price
  const getPnL = useCallback((holding, currentPrice) => {
    if (!currentPrice || !holding.quantity || !holding.buyPrice) return null
    const invested  = holding.quantity * holding.buyPrice
    const current   = holding.quantity * currentPrice
    const pnl       = current - invested
    const pnlPct    = (pnl / invested) * 100
    return { invested, current, pnl, pnlPct }
  }, [])

  return { holdings, add, remove, update, getPnL }
}