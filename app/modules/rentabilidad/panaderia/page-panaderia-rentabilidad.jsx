'use client'

import { useState, useEffect } from 'react'

export default function RentabilidadPanaderia() {
  const [periodo, setPeriodo] = useState('hoy')
  const [datos, setDatos] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    cargarDatos()
  }, [periodo])

  async function cargarDatos() {
    setCargando(true)
    const res = await fetch(`/api/rentabilidad/panaderia?periodo=${periodo}`)
    const data = await res.json()
    setDatos(Array.isArray(data) ? data : [])
    setCargando(false)
  }

  const totalIngresos = datos.reduce((sum, d) => sum + parseFloat(d.total_ingresos || 0), 0)
  const totalCosto = datos.reduce((sum, d) => sum + parseFloat(d.total_costo || 0), 0)
  const totalGanancia = totalIngresos - totalCosto

  return (
    <div className="p-4 sm:p-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">📈 Rentabilidad</h1>

      {/* Selector de período */}
      <div className="flex gap-2 mb-6">
        {[
          { value: 'hoy', label: 'Hoy' },
          { value: 'semana', label: 'Últimos 7 días' },
          { value: 'mes', label: 'Últimos 30 días' },
        ].map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriodo(p.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              periodo === p.value
                ? 'bg-orange-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-xs text-gray-500 mb-1">Ingresos totales</p>
          <p className="text-2xl font-bold text-blue-600">${totalIngresos.toLocaleString('es-AR')}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-xs text-gray-500 mb-1">Costo total</p>
          <p className="text-2xl font-bold text-gray-600">${totalCosto.toLocaleString('es-AR')}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-xs text-gray-500 mb-1">Ganancia total</p>
          <p className={`text-2xl font-bold ${totalGanancia >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${totalGanancia.toLocaleString('es-AR')}
          </p>
        </div>
      </div>

      {/* Tabla por producto */}
      {cargando ? (
        <p className="text-gray-400 text-sm">Cargando...</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="w-full min-w-[700px]">
            <thead style={{ backgroundColor: '#fed7aa' }}>
              <tr>
                <th className="text-left px-4 py-3 text-sm font-bold" style={{ color: '#1f2937' }}>Producto</th>
                <th className="text-left px-4 py-3 text-sm font-bold" style={{ color: '#1f2937' }}>Cantidad vendida</th>
                <th className="text-left px-4 py-3 text-sm font-bold" style={{ color: '#1f2937' }}>Ingresos</th>
                <th className="text-left px-4 py-3 text-sm font-bold" style={{ color: '#1f2937' }}>Costo</th>
                <th className="text-left px-4 py-3 text-sm font-bold" style={{ color: '#1f2937' }}>Ganancia</th>
              </tr>
            </thead>
            <tbody>
              {datos.map((d, idx) => (
                <tr key={idx} className="border-t hover:bg-orange-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-800">{d.nombre}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {parseFloat(d.cantidad_vendida).toLocaleString('es-AR')} {d.unidad}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    ${parseFloat(d.total_ingresos).toLocaleString('es-AR')}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    ${parseFloat(d.total_costo).toLocaleString('es-AR')}
                  </td>
                  <td className={`px-4 py-3 text-sm font-bold ${parseFloat(d.ganancia) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${parseFloat(d.ganancia).toLocaleString('es-AR')}
                  </td>
                </tr>
              ))}
              {datos.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400 text-sm">
                    No hay ventas en este período
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}