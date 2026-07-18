'use client'

import { useState, useEffect } from 'react'

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('theme')
    const prefersDark = !saved ? true : saved === 'dark'
    setIsDark(prefersDark)
    aplicarTema(prefersDark)
  }, [])

  function aplicarTema(dark) {
    const root = document.documentElement
    if (dark) {
      root.style.setProperty('--background', '#0f1419')
      root.style.setProperty('--foreground', '#ffffff')
      document.body.classList.add('dark-theme')
      document.body.classList.remove('light-theme')
    } else {
      root.style.setProperty('--background', '#ffffff')
      root.style.setProperty('--foreground', '#171717')
      document.body.classList.add('light-theme')
      document.body.classList.remove('dark-theme')
    }
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }

  function toggle() {
    const newDark = !isDark
    setIsDark(newDark)
    aplicarTema(newDark)
  }

  if (!mounted) return null

  return (
    <button
      onClick={toggle}
      className="p-2 rounded-lg hover:bg-gray-700 transition-colors text-lg"
      title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  )
}