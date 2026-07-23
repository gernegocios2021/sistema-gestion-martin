'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function Presentes() {
  const [presentes, setPresentes] = useState([])
  const [horaConsulta, setHoraConsulta] = useState('')
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    cargar()
    // Refrescar cada 60 segundos para que las horas acumuladas se mantengan al día
    const intervalo = setInterval(cargar, 60000)
    return () => clearInterval(intervalo)
  }, [])

  async function cargar() {
    try {
      const res = await fetch('/api/presentes')
      const data = await res.json()
      setPresentes(data.presentes || [])
      setHoraConsulta(data.hora_consulta || '')
    } catch (e) {
      console.log('Error cargando presentes')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="p-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-2">
        <h1 className="text-2xl font-bold text-gray-800">Presentes hoy</h1>
        <Link href="/empleados" className="text-sm text-blue-600 hover:underline">
          Ver todos los empleados
        </Link>
      </div>

      <p className="text-sm text-gray-500 mb-6">
        Empleados que marcaron ingreso y todavía no marcaron salida
        {horaConsulta && ` · Actualizado ${horaConsulta}`}
      </p>

      {cargando && <p className="text-gray-400 text-sm">Cargando...</p>}

      {!cargando && presentes.length === 0 && (
        <div className="bg-white rounded-xl shadow p-12 text-center">
          <p className="text-5xl mb-3">🏠</p>
          <p className="text-gray-600 font-medium">No hay nadie en la fábrica en este momento</p>
          <p className="text-sm text-gray-400 mt-1">Nadie marcó ingreso hoy, o ya marcaron todos su salida</p>
        </div>
      )}

      {!cargando && presentes.length > 0 && (
        <>
          <p className="text-sm font-medium text-gray-600 mb-4">
            {presentes.length} {presentes.length === 1 ? 'persona presente' : 'personas presentes'}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {presentes.map((p) => (
              <div key={p.id} className="bg-white rounded-xl shadow p-6 border-l-4 border-green-400">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-lg">
                    {p.nombre?.[0]}{p.apellido?.[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{p.nombre} {p.apellido}</p>
                    <p className="text-sm text-gray-500">{p.cargo || 'Sin cargo definido'}</p>
                  </div>
                </div>

                <div className="flex gap-6 mb-4">
                  <div>
                    <p className="text-xs text-gray-500">Ingresó</p>
                    <p className="text-lg font-bold text-gray-800">{p.hora_entrada}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Lleva trabajando</p>
                    <p className="text-lg font-bold text-green-600">{p.horas_hasta_ahora}h</p>
                  </div>
                </div>

                <Link
                  href={`/empleados/${p.empleado_id}`}
                  className="bg-blue-100 text-blue-600 text-xs font-medium px-3 py-1 rounded-full hover:bg-blue-200"
                >
                  📋 Ver horas
                </Link>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}