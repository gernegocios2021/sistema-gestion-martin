'use client'

import { useState, useEffect } from 'react'

export default function Ventas() {
  const [productos, setProductos] = useState([])
  const [items, setItems] = useState([{ producto_id: '', cantidad: 1, tipo_precio: 'sin_colocacion', precio_unitario: '' }])
  const [instalacion, setInstalacion] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [ventas, setVentas] = useState([])
  const [mensaje, setMensaje] = useState('')

  useEffect(() => {
    cargarDatos()
  }, [])

  async function cargarDatos() {
    const [prod, vent] = await Promise.all([
      fetch('/api/products').then(r => r.json()),
      fetch('/api/ventas').then(r => r.json())
    ])
    setProductos(prod)
    setVentas(vent)
  }

  function agregarItem() {
    setItems([...items, { producto_id: '', cantidad: 1, tipo_precio: 'sin_colocacion', precio_unitario: '' }])
  }

  function actualizarItem(index, campo, valor) {
    const nuevos = [...items]
    nuevos[index][campo] = valor

    // Si cambia el producto o el tipo de precio, autocompletar el precio unitario
    if (campo === 'producto_id' || campo === 'tipo_precio') {
      const p = productos.find(pr => String(pr.id) === String(nuevos[index].producto_id))
      if (p) {
        const precio = nuevos[index].tipo_precio === 'con_colocacion' ? p.precio_con_colocacion : p.precio_sin_colocacion
        nuevos[index].precio_unitario = precio !== null && precio !== undefined ? precio : ''
      }
    }

    setItems(nuevos)
  }

  function eliminarItem(index) {
    setItems(items.filter((_, i) => i !== index))
  }

  // Devuelve la unidad del producto elegido (m², Barra, etc.)
  function unidadDe(productoId) {
    const p = productos.find(pr => String(pr.id) === String(productoId))
    return p ? p.unidad : ''
  }

  const totalProductos = items.reduce((sum, item) => {
    return sum + (parseFloat(item.cantidad) * parseFloat(item.precio_unitario) || 0)
  }, 0)
  const totalInstalacion = parseFloat(instalacion) || 0
  const total = totalProductos + totalInstalacion

  async function registrarVenta() {
    if (items.some(i => !i.producto_id || !i.precio_unitario)) {
      setMensaje('Completá producto y precio en todos los renglones.')
      setTimeout(() => setMensaje(''), 3000)
      return
    }
    const res = await fetch('/api/ventas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: items.map(i => ({
          producto_id: parseInt(i.producto_id),
          cantidad: parseFloat(i.cantidad),
          precio_unitario: parseFloat(i.precio_unitario)
        })),
        instalacion: totalInstalacion,
        observaciones
      })
    })
    if (res.ok) {
      setMensaje('✓ Venta registrada correctamente')
      setItems([{ producto_id: '', cantidad: 1, tipo_precio: 'sin_colocacion', precio_unitario: '' }])
      setInstalacion('')
      setObservaciones('')
      cargarDatos()
      setTimeout(() => setMensaje(''), 3000)
    }
  }

  return (
    <div className="p-4 sm:p-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Ventas</h1>

      <div className="bg-white rounded-xl shadow p-4 sm:p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Nueva venta</h2>

        {items.map((item, index) => (
          <div key={index} className="mb-4 pb-4 border-b border-gray-100 last:border-b-0">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-2">
              <select
                className="border rounded-lg px-3 py-2 text-sm text-gray-800 bg-white sm:col-span-2"
                value={item.producto_id}
                onChange={(e) => actualizarItem(index, 'producto_id', e.target.value)}
              >
                <option value="">Seleccioná un producto</option>
                {productos.map(p => (
                  <option key={p.id} value={p.id}>{p.nombre} ({p.unidad})</option>
                ))}
              </select>
              <div className="flex items-center gap-2">
                <input
                  className="border rounded-lg px-3 py-2 text-sm text-gray-800 bg-white w-full"
                  type="number"
                  step="any"
                  placeholder="Cantidad"
                  value={item.cantidad}
                  onChange={(e) => actualizarItem(index, 'cantidad', e.target.value)}
                />
                {item.producto_id && (
                  <span className="text-xs text-gray-500 whitespace-nowrap">{unidadDe(item.producto_id)}</span>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  className="border rounded-lg px-3 py-2 text-sm text-gray-800 bg-white flex-1 min-w-0"
                  type="number"
                  step="any"
                  placeholder="Precio unitario"
                  value={item.precio_unitario}
                  onChange={(e) => actualizarItem(index, 'precio_unitario', e.target.value)}
                />
                {items.length > 1 && (
                  <button onClick={() => eliminarItem(index)} className="text-red-500 hover:text-red-700 px-2">✕</button>
                )}
              </div>
            </div>

            {item.producto_id && (
              <div className="flex gap-2">
                <button
                  onClick={() => actualizarItem(index, 'tipo_precio', 'sin_colocacion')}
                  className={`text-xs font-medium px-3 py-1.5 rounded-full ${
                    item.tipo_precio === 'sin_colocacion'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Sin colocación
                </button>
                <button
                  onClick={() => actualizarItem(index, 'tipo_precio', 'con_colocacion')}
                  className={`text-xs font-medium px-3 py-1.5 rounded-full ${
                    item.tipo_precio === 'con_colocacion'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Con colocación
                </button>
              </div>
            )}
          </div>
        ))}

        <button onClick={agregarItem} className="text-blue-600 text-sm hover:underline mb-4">
          + Agregar otro producto
        </button>

        <div className="mb-4">
          <label className="text-xs text-gray-500 mb-1 block">Servicio de instalación (opcional — no descuenta stock)</label>
          <input
            className="border rounded-lg px-4 py-2 text-sm text-gray-800 bg-white w-full sm:w-64"
            type="number"
            step="any"
            placeholder="Ej: 20000"
            value={instalacion}
            onChange={(e) => setInstalacion(e.target.value)}
          />
        </div>

        <input
          className="border rounded-lg px-4 py-2 text-sm text-gray-800 bg-white w-full mb-4"
          placeholder="Observaciones (opcional)"
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
        />

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div>
            {totalInstalacion > 0 && (
              <p className="text-xs text-gray-500">
                Productos: ${totalProductos.toLocaleString('es-AR', { minimumFractionDigits: 2 })} + Instalación: ${totalInstalacion.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </p>
            )}
            <p className="text-lg font-bold text-gray-800">
              Total: <span className="text-blue-600">${total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
            </p>
          </div>
          <button onClick={registrarVenta} className="bg-green-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-green-700">
            Registrar venta
          </button>
        </div>

        {mensaje && <p className="mt-3 text-green-600 text-sm font-medium">{mensaje}</p>}
      </div>

      <h2 className="text-lg font-semibold text-gray-700 mb-4">Historial de ventas</h2>
      <div className="overflow-x-auto bg-white rounded-xl shadow">
        <table className="w-full min-w-[500px]">
          <thead className="bg-gray-800 text-white">
            <tr>
              <th className="text-left px-6 py-3 text-sm">ID</th>
              <th className="text-left px-6 py-3 text-sm">Fecha</th>
              <th className="text-left px-6 py-3 text-sm">Instalación</th>
              <th className="text-left px-6 py-3 text-sm">Total</th>
              <th className="text-left px-6 py-3 text-sm">Observaciones</th>
            </tr>
          </thead>
          <tbody>
            {ventas.map((v) => (
              <tr key={v.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-800">#{v.id}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{new Date(v.fecha).toLocaleDateString('es-AR')}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{Number(v.instalacion) > 0 ? `$${parseFloat(v.instalacion).toLocaleString('es-AR', { minimumFractionDigits: 2 })}` : '-'}</td>
                <td className="px-6 py-4 text-sm font-medium text-green-600">${parseFloat(v.total).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{v.observaciones || '-'}</td>
              </tr>
            ))}
            {ventas.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-400 text-sm">No hay ventas registradas todavía</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}