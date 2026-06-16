'use client'

import { useState, useEffect, useRef } from 'react'
import QRCode from 'react-qr-code'

export default function Marcar() {
  const [token, setToken] = useState(null)
  const [empleados, setEmpleados] = useState([])
  const [segundos, setSegundos] = useState(30)
  const [urlQR, setUrlQR] = useState(null)
  const intervalRef = useRef(null)

  useEffect(() => {
    fetch('http://localhost:3000/api/empleados')
      .then(r => r.json())
      .then(data => setEmpleados(data))

    obtenerToken()
  }, [])

  async function obtenerToken() {
    const res = await fetch('http://localhost:3000/api/marcar')
    const data = await res.json()
    setToken(data.token)
    setUrlQR(`http://192.168.100.219:3000/confirmar?token=${data.token}`)
    setSegundos(30)
  }

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setSegundos(s => {
        if (s <= 1) {
          obtenerToken()
          return 30
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current)
  }, [])

  return (
    <div className="min-h-screen bg-gray-800 flex items-center justify-center p-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Marcá tu asistencia</h1>
        <p className="text-gray-300 mb-8">Escaneá el código con tu celular</p>

        {urlQR && (
          <div className="bg-white rounded-2xl p-8 inline-block mb-6 shadow-xl">
            <QRCode value={urlQR} size={250} />
          </div>
        )}

        <div className="bg-gray-700 rounded-xl px-6 py-3 inline-block mb-4">
          <p className="text-gray-300 text-sm">
            El código se renueva en{' '}
            <span className={`font-bold text-lg ${segundos <= 10 ? 'text-red-400' : 'text-green-400'}`}>
              {segundos}s
            </span>
          </p>
        </div>

        <p className="text-gray-500 text-xs block">Sistema de Gestión — Martín</p>
      </div>
    </div>
  )
}