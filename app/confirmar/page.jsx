'use client'

import { useState, useEffect, use } from 'react'

export default function Confirmar({ searchParams }) {
  const { token } = use(searchParams)
  const [empleados, setEmpleados] = useState([])
  const [resultado, setResultado] = useState(null)
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    fetch('http:///api/empleados')
      .then(r => r.json())
      .then(data => setEmpleados(data))
  }, [])

  async function marcar(empleado_id) {
    setCargando(true)
    const res = await fetch('http:///api/marcar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ empleado_id, token })
    })
    const data = await res.json()
    const empleado = empleados.find(e => e.id === empleado_id)
    setResultado({ ...data, empleado })
    setCargando(false)
  }

  if (resultado) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <div className={`rounded-2xl p-8 text-center max-w-sm w-full ${
          resultado.accion === 'entrada' ? 'bg-green-50 border-2 border-green-400' :
          resultado.accion === 'salida' ? 'bg-blue-50 border-2 border-blue-400' :
          resultado.error ? 'bg-red-50 border-2 border-red-400' :
          'bg-yellow-50 border-2 border-yellow-400'
        }`}>
          <p className="text-6xl mb-4">
            {resultado.accion === 'entrada' ? '✅' :
             resultado.accion === 'salida' ? '👋' :
             resultado.error ? '❌' : '⚠️'}
          </p>
          <p className="text-xl font-bold text-gray-800 mb-2">
            {resultado.empleado ? `${resultado.empleado.nombre} ${resultado.empleado.apellido}` : ''}
          </p>
          <p className="text-lg font-medium text-gray-600">
            {resultado.accion === 'entrada' && `Entrada registrada a las ${resultado.hora} ✓`}
            {resultado.accion === 'salida' && `Salida registrada a las ${resultado.hora} — ${resultado.horas_trabajadas}h trabajadas`}
            {resultado.accion === 'ya_registrado' && resultado.mensaje}
            {resultado.error && resultado.error}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-sm w-full">
        <h1 className="text-2xl font-bold text-gray-800 mb-2 text-center">Marcar asistencia</h1>
        <p className="text-sm text-gray-500 mb-6 text-center">Seleccioná tu nombre</p>

        {cargando ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Registrando...</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {empleados.map(e => (
              <button
                key={e.id}
                onClick={() => marcar(e.id)}
                className="flex items-center gap-3 p-4 bg-white border rounded-xl hover:bg-blue-50 hover:border-blue-300 transition-colors shadow-sm"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                  {e.nombre[0]}{e.apellido[0]}
                </div>
                <span className="font-medium text-gray-800">{e.nombre} {e.apellido}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}