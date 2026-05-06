// src/hooks/useWatchlist.js
import { useLocalStorage } from './useLocalStorage.js'
import { useCallback } from 'react'

// item: { ticker, name, type: 'stock'|'mf', addedAt }
export function useWatchlist() {
  const [list, setList] = useLocalStorage('fis_watchlist', [])

  const add = useCallback((item) => {
    setList(prev => {
      if (prev.find(x => x.ticker === item.ticker)) return prev
      return [{ ...item, addedAt: new Date().toISOString() }, ...prev]
    })
  }, [setList])

  const remove = useCallback((ticker) => {
    setList(prev => prev.filter(x => x.ticker !== ticker))
  }, [setList])

  const toggle = useCallback((item) => {
    setList(prev => {
      const exists = prev.find(x => x.ticker === item.ticker)
      if (exists) return prev.filter(x => x.ticker !== item.ticker)
      return [{ ...item, addedAt: new Date().toISOString() }, ...prev]
    })
  }, [setList])

  const isWatched = useCallback((ticker) => {
    return list.some(x => x.ticker === ticker)
  }, [list])

  return { list, add, remove, toggle, isWatched }
}