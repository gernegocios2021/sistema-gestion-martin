'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Login() {
  const router = useRouter()
  const [usuario, setUsuario] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [cargando, setCargando] = useState(false)

  async function ingresar() {
    setError(null)
    if (!usuario || !password) {
      setError('Completá usuario y contraseña')
      return
    }
    setCargando(true)
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'No se pudo ingresar')
        return
      }
      // Login OK: vamos al dashboard
      router.push('/')
      router.refresh()
    } catch (e) {
      setError('Error de conexión')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gray-800 mb-1 text-center">Sistema Martín</h1>
        <p className="text-sm text-gray-500 mb-6 text-center">Ingresá para continuar</p>

        <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
        <input
          type="text"
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
          className="w-full p-3 border rounded-xl mb-4 bg-white text-gray-800"
          placeholder="Tu usuario"
        />

        <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && ingresar()}
          className="w-full p-3 border rounded-xl mb-4 bg-white text-gray-800"
          placeholder="Tu contraseña"
        />

        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

        <button
          onClick={ingresar}
          disabled={cargando}
          className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 disabled:bg-gray-300"
        >
          {cargando ? 'Ingresando...' : 'Ingresar'}
        </button>
      </div>
    </div>
  )
}