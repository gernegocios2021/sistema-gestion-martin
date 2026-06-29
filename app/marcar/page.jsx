'use client'

import { useState, useEffect, useRef } from 'react'
import QRCode from 'react-qr-code'

const DURACION = 60  // segundos que dura el QR (debe coincidir con el token)

export default function Marcar() {
  const [token, setToken] = useState(null)
  const [segundos, setSegundos] = useState(DURACION)
  const [urlQR, setUrlQR] = useState(null)
  const intervalRef = useRef(null)

  useEffect(() => {
    obtenerToken()
  }, [])

  async function obtenerToken() {
    const res = await fetch('/api/marcar')
    const data = await res.json()
    setToken(data.token)

    // window.location.origin para que el QR apunte a la dirección correcta
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    setUrlQR(`${baseUrl}/confirmar?token=${data.token}`)
    setSegundos(DURACION)
  }

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setSegundos(s => {
        if (s <= 1) {
          obtenerToken()
          return DURACION
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current)
  }, [])

  return (
    <div className="fixed inset-0 bg-gray-800 flex flex-col items-center justify-center p-8">
      <h1 className="text-3xl font-bold text-white mb-2 text-center">Marcá tu asistencia</h1>
      <p className="text-gray-300 mb-8 text-center">Escaneá el código con tu celular</p>

      {urlQR && (
        <div className="bg-white rounded-2xl p-8 mb-6 shadow-xl">
          <QRCode value={urlQR} size={250} />
        </div>
      )}

      <div className="bg-gray-700 rounded-xl px-6 py-3 mb-4">
        <p className="text-gray-300 text-sm">
          El código se renueva en{' '}
          <span className={`font-bold text-lg ${segundos <= 15 ? 'text-red-400' : 'text-green-400'}`}>
            {segundos}s
          </span>
        </p>
      </div>

      <p className="text-gray-500 text-xs">GestionPro</p>
    </div>
  )
}