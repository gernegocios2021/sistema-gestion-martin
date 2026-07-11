'use client'

import { useState, useEffect } from 'react'

export default function Precios() {
  const [productos, setProductos] = useState([])
  const [porcentajes, setPorcentajes] = useState({})
  const [porcentajeGlobal, setPorcentajeGlobal] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [aplicando, setAplicando] = useState(null)

  useEffect(() => {
    cargar()
  }, [])

  async function cargar() {
    const res = await fetch('/api/products')
    const data = await res.json()
    setProductos(data)
  }

  const grupos = {}
  productos.forEach((p) => {
    const g = p.grupo || 'Sin grupo'
    if (!grupos[g]) grupos[g] = []
    grupos[g].push(p)
  })

  function formatearPrecio(v) {
    if (v === null || v === undefined || v === '') return '-'
    return `$${Number(v).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
  }

  function previsualizar(precio, pct) {
    if (precio === null || precio === undefined) return null
    const p = Number(pct)
    if (!p) return precio
    return Number(precio) * (1 + p / 100)
  }

  async function aplicarAumento(grupo) {
    const pct = grupo ? porcentajes[grupo] : porcentajeGlobal
    if (!pct || Number(pct) === 0) {
      setMensaje('Ingresá un porcentaje válido.')
      setTimeout(() => setMensaje(''), 3000)
      return
    }

    const confirmado = confirm(
      `¿Confirmás aplicar un aumento del ${pct}% a ${grupo ? `"${grupo}"` : 'TODO el catálogo'}?\n\nEsta acción actualiza los precios directamente y no se puede deshacer.`
    )
    if (!confirmado) return

    setAplicando(grupo || 'global')
    try {
      const res = await fetch('/api/precios/aumentar', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grupo: grupo || null, porcentaje: pct })
      })
      const data = await res.json()
      if (res.ok) {
        setMensaje(`✓ Se actualizaron ${data.actualizados} productos`)
        if (grupo) {
          setPorcentajes((prev) => ({ ...prev, [grupo]: '' }))
        } else {
          setPorcentajeGlobal('')
        }
        cargar()
      } else {
        setMensaje(data.error || 'Error al aplicar el aumento')
      }
    } catch (e) {
      setMensaje('Error de conexión')
    } finally {
      setAplicando(null)
      setTimeout(() => setMensaje(''), 4000)
    }
  }

  return (
    <div className="p-4 sm:p-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Lista de Precios</h1>

      {mensaje && <p className="mb-4 text-sm font-medium text-green-600">{mensaje}</p>}

      <div className="bg-white rounded-xl shadow p-4 sm:p-6 mb-8 border-l-4 border-red-400">
        <h2 className="text-lg font-semibold text-gray-700 mb-1">Aumento general</h2>
        <p className="text-xs text-gray-500 mb-3">
          Aplica el porcentaje a TODOS los productos del catálogo, sin importar el grupo. Usalo para ajustes generales por inflación.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="flex items-center gap-2">
            <input
              type="number"
              step="any"
              placeholder="Ej: 8"
              value={porcentajeGlobal}
              onChange={(e) => setPorcentajeGlobal(e.target.value)}
              className="border rounded-lg px-4 py-2 text-sm text-gray-800 bg-white w-32"
            />
            <span className="text-sm text-gray-500">%</span>
          </div>
          <button
            onClick={() => aplicarAumento(null)}
            disabled={aplicando === 'global'}
            className="bg-red-500 text-white px-6 py-2 rounded-lg text-sm hover:bg-red-600 disabled:bg-gray-300"
          >
            {aplicando === 'global' ? 'Aplicando...' : 'Aplicar a todo el catálogo'}
          </button>
        </div>
      </div>

      {Object.keys(grupos).sort().map((grupo) => (
        <div key={grupo} className="bg-white rounded-xl shadow mb-6 overflow-hidden">
          <div className="bg-gray-800 text-white px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <h3 className="font-semibold">
              {grupo}{' '}
              <span className="text-gray-400 text-xs font-normal">({grupos[grupo].length} productos)</span>
            </h3>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="any"
                placeholder="%"
                value={porcentajes[grupo] || ''}
                onChange={(e) => setPorcentajes((prev) => ({ ...prev, [grupo]: e.target.value }))}
                className="border rounded-lg px-3 py-1.5 text-sm text-gray-800 bg-white w-20"
              />
              <button
                onClick={() => aplicarAumento(grupo)}
                disabled={aplicando === grupo}
                className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-blue-700 disabled:bg-gray-400 whitespace-nowrap"
              >
                {aplicando === grupo ? 'Aplicando...' : 'Aplicar a este grupo'}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-xs">
              <thead className="bg-gray-100 text-gray-600">
                <tr>
                  <th className="text-left px-3 py-2 font-medium whitespace-nowrap">Producto</th>
                  <th className="text-left px-3 py-2 font-medium whitespace-nowrap">Sin colocación</th>
                  <th className="text-left px-3 py-2 font-medium whitespace-nowrap">Con colocación</th>
                </tr>
              </thead>
              <tbody>
                {grupos[grupo].map((p) => {
                  const pctPreview = porcentajes[grupo] || porcentajeGlobal
                  const hayCambio = pctPreview && Number(pctPreview) !== 0
                  const valorSin = hayCambio ? previsualizar(p.precio_sin_colocacion, pctPreview) : p.precio_sin_colocacion
                  const valorCon = hayCambio ? previsualizar(p.precio_con_colocacion, pctPreview) : p.precio_con_colocacion
                  return (
                    <tr key={p.id} className="border-t border-gray-100">
                      <td className="px-3 py-1.5 text-gray-800 whitespace-nowrap">{p.nombre}</td>
                      <td className={`px-3 py-1.5 whitespace-nowrap ${hayCambio ? 'text-green-600 font-medium' : 'text-gray-700'}`}>
                        {formatearPrecio(valorSin)}
                      </td>
                      <td className={`px-3 py-1.5 whitespace-nowrap ${hayCambio ? 'text-green-600 font-medium' : 'text-gray-700'}`}>
                        {formatearPrecio(valorCon)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {productos.length === 0 && (
        <p className="text-center text-gray-400 text-sm py-8">No hay productos cargados todavía.</p>
      )}
    </div>
  )
}