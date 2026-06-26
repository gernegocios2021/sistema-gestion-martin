'use client'

import { useState } from 'react'

export default function CambiarPassword() {
  const [actual, setActual] = useState('')
  const [nueva, setNueva] = useState('')
  const [repetir, setRepetir] = useState('')
  const [mensaje, setMensaje] = useState(null)
  const [error, setError] = useState(null)
  const [cargando, setCargando] = useState(false)

  async function cambiar() {
    setError(null)
    setMensaje(null)
    if (!actual || !nueva) { setError('Completá todos los campos'); return }
    if (nueva !== repetir) { setError('La nueva contraseña y su repetición no coinciden'); return }

    setCargando(true)
    try {
      const res = await fetch('/api/cambiar-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password_actual: actual, password_nueva: nueva }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'No se pudo cambiar')
        return
      }
      setMensaje('✓ Contraseña cambiada correctamente')
      setActual(''); setNueva(''); setRepetir('')
    } catch (e) {
      setError('Error de conexión')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="p-4 sm:p-8 max-w-md">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Cambiar mi contraseña</h1>

      <div className="bg-white rounded-xl shadow p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña actual</label>
          <input
            type="password"
            value={actual}
            onChange={(e) => setActual(e.target.value)}
            className="w-full p-3 border rounded-xl bg-white text-gray-800"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nueva contraseña</label>
          <input
            type="password"
            value={nueva}
            onChange={(e) => setNueva(e.target.value)}
            className="w-full p-3 border rounded-xl bg-white text-gray-800"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Repetir nueva contraseña</label>
          <input
            type="password"
            value={repetir}
            onChange={(e) => setRepetir(e.target.value)}
            className="w-full p-3 border rounded-xl bg-white text-gray-800"
          />
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}
        {mensaje && <p className="text-green-600 text-sm font-medium">{mensaje}</p>}

        <button
          onClick={cambiar}
          disabled={cargando}
          className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 disabled:bg-gray-300"
        >
          {cargando ? 'Guardando...' : 'Cambiar contraseña'}
        </button>
      </div>
    </div>
  )
}