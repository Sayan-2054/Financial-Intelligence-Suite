// src/hooks/useLocalStorage.js
import { useState, useCallback } from 'react'

export function useLocalStorage(key, initialValue) {
  const [stored, setStored] = useState(() => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch { return initialValue }
  })

  const setValue = useCallback((value) => {
    try {
      const next = value instanceof Function ? value(stored) : value
      setStored(next)
      localStorage.setItem(key, JSON.stringify(next))
    } catch (e) { console.error('localStorage error:', e) }
  }, [key, stored])

  const removeValue = useCallback(() => {
    try {
      localStorage.removeItem(key)
      setStored(initialValue)
    } catch { /* */ }
  }, [key, initialValue])

  return [stored, setValue, removeValue]
}