// src/hooks/useTheme.js
import { useEffect } from 'react'
import { useLocalStorage } from './useLocalStorage.js'

export function useTheme() {
  const [theme, setTheme] = useLocalStorage('fis_theme', 'dark')

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'light') {
      root.setAttribute('data-theme', 'light')
    } else {
      root.removeAttribute('data-theme')
    }
  }, [theme])

  const toggle = () => setTheme(t => t === 'dark' ? 'light' : 'dark')

  return { theme, toggle, isDark: theme === 'dark' }
}