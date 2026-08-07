'use client'

import { useState, useEffect } from 'react'

export default function Rentabilidad() {
  const [ventas, setVentas] = useState([])
  const [manoObra, setManoObra] = useState({}) // { ventaId: valor en edición }
  const [guardando, setGuardando] = useState(null)
  const [mensaje, setMensaje] = useState('')
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    cargar()
  }, [])

  async function cargar() {
    setCargando(true)
    const res = await fetch('/api/rentabilidad')
    const data = await res.json()
    setVentas(data)
    setCargando(false)
  }

  function formatearMoneda(v) {
    return `$${Number(v || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
  }

  async function guardarManoObra(id) {
    const valor = manoObra[id]
    if (valor === undefined) return
    setGuardando(id)
    try {
      const res = await fetch('/api/rentabilidad', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, mano_obra: valor })
      })
      if (res.ok) {
        setMensaje('✓ Guardado')
        cargar()
      } else {
        setMensaje('Error al guardar')
      }
    } catch (e) {
      setMensaje('Error de conexión')
    } finally {
      setGuardando(null)
      setTimeout(() => setMensaje(''), 2000)
    }
  }

  // Totales generales
  const totalVentas = ventas.reduce((sum, v) => sum + Number(v.total || 0), 0)
  const totalCostos = ventas.reduce((sum, v) => sum + Number(v.costo_materiales || 0), 0)
  const totalManoObra = ventas.reduce((sum, v) => sum + Number(v.mano_obra || 0), 0)
  const totalRentabilidad = totalVentas - totalCostos - totalManoObra

  return (
    <div className="p-4 sm:p-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Rentabilidad</h1>

      {mensaje && <p className="mb-4 text-sm font-medium text-green-600">{mensaje}</p>}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-xs text-gray-500">Total vendido</p>
          <p className="text-lg font-bold text-gray-800">{formatearMoneda(totalVentas)}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-xs text-gray-500">Costo materiales</p>
          <p className="text-lg font-bold text-gray-800">{formatearMoneda(totalCostos)}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-xs text-gray-500">Mano de obra</p>
          <p className="text-lg font-bold text-gray-800">{formatearMoneda(totalManoObra)}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-xs text-gray-500">Rentabilidad total</p>
          <p className={`text-lg font-bold ${totalRentabilidad >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatearMoneda(totalRentabilidad)}
          </p>
        </div>
      </div>

      <p className="text-xs text-gray-500 mb-4">
        El costo de materiales se calcula automáticamente según el precio de la última compra registrada de cada producto,
        a la fecha de la venta. La mano de obra la ingresás vos manualmente por cada venta.
      </p>

      {cargando ? (
        <p className="text-gray-400 text-sm">Cargando...</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl shadow">
          <table className="w-full min-w-[860px] text-xs">
            <thead className="bg-gray-800 text-white">
              <tr>
                <th className="text-left px-3 py-2 font-medium whitespace-nowrap">ID</th>
                <th className="text-left px-3 py-2 font-medium whitespace-nowrap">Fecha</th>
                <th className="text-left px-3 py-2 font-medium whitespace-nowrap">Total venta</th>
                <th className="text-left px-3 py-2 font-medium whitespace-nowrap">Costo materiales</th>
                <th className="text-left px-3 py-2 font-medium whitespace-nowrap">Mano de obra</th>
                <th className="text-left px-3 py-2 font-medium whitespace-nowrap">Rentabilidad</th>
                <th className="text-left px-3 py-2 font-medium whitespace-nowrap">Margen</th>
              </tr>
            </thead>
            <tbody>
              {ventas.map((v) => (
                <tr key={v.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-3 py-1.5 text-gray-800 whitespace-nowrap">#{v.id}</td>
                  <td className="px-3 py-1.5 text-gray-500 whitespace-nowrap">{new Date(v.fecha).toLocaleDateString('es-AR')}</td>
                  <td className="px-3 py-1.5 text-gray-700 whitespace-nowrap">{formatearMoneda(v.total)}</td>
                  <td className="px-3 py-1.5 text-gray-700 whitespace-nowrap">
                    {formatearMoneda(v.costo_materiales)}
                    {v.items_sin_costo > 0 && (
                      <span className="ml-1 text-yellow-600" title={`${v.items_sin_costo} producto(s) sin compras registradas`}>⚠️</span>
                    )}
                  </td>
                  <td className="px-3 py-1.5 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        step="any"
                        placeholder="0"
                        value={manoObra[v.id] ?? v.mano_obra ?? ''}
                        onChange={(e) => setManoObra((prev) => ({ ...prev, [v.id]: e.target.value }))}
                        className="border rounded px-2 py-1 text-xs text-gray-800 bg-white w-20"
                      />
                      <button
                        onClick={() => guardarManoObra(v.id)}
                        disabled={guardando === v.id}
                        className="bg-blue-100 text-blue-600 px-2 py-1 rounded hover:bg-blue-200 disabled:bg-gray-200"
                      >
                        {guardando === v.id ? '...' : '💾'}
                      </button>
                    </div>
                  </td>
                  <td className={`px-3 py-1.5 font-medium whitespace-nowrap ${Number(v.rentabilidad) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatearMoneda(v.rentabilidad)}
                  </td>
                  <td className={`px-3 py-1.5 font-medium whitespace-nowrap ${Number(v.margen) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {Number(v.margen).toFixed(1)}%
                  </td>
                </tr>
              ))}
              {ventas.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-gray-400">No hay ventas registradas todavía</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}