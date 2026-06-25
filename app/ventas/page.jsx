'use client'

import { useState, useEffect } from 'react'

export default function Ventas() {
  const [productos, setProductos] = useState([])
  const [items, setItems] = useState([{ producto_id: '', cantidad: 1, precio_unitario: '' }])
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
    setItems([...items, { producto_id: '', cantidad: 1, precio_unitario: '' }])
  }

  function actualizarItem(index, campo, valor) {
    const nuevos = [...items]
    nuevos[index][campo] = valor
    setItems(nuevos)
  }

  function eliminarItem(index) {
    setItems(items.filter((_, i) => i !== index))
  }

  const total = items.reduce((sum, item) => {
    return sum + (parseFloat(item.cantidad) * parseFloat(item.precio_unitario) || 0)
  }, 0)

  async function registrarVenta() {
    if (items.some(i => !i.producto_id || !i.precio_unitario)) {
      setMensaje('Completá todos los campos antes de guardar.')
      return
    }
    const res = await fetch('/api/ventas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: items.map(i => ({
          producto_id: parseInt(i.producto_id),
          cantidad: parseInt(i.cantidad),
          precio_unitario: parseFloat(i.precio_unitario)
        })),
        observaciones
      })
    })
    if (res.ok) {
      setMensaje('✓ Venta registrada correctamente')
      setItems([{ producto_id: '', cantidad: 1, precio_unitario: '' }])
      setObservaciones('')
      cargarDatos()
      setTimeout(() => setMensaje(''), 3000)
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Ventas</h1>

      <div className="bg-white rounded-xl shadow p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Nueva venta</h2>

        {items.map((item, index) => (
          <div key={index} className="grid grid-cols-4 gap-3 mb-3">
            <select
              className="border rounded-lg px-3 py-2 text-sm text-gray-800 bg-white col-span-2"
              value={item.producto_id}
              onChange={(e) => actualizarItem(index, 'producto_id', e.target.value)}
            >
              <option value="">Seleccioná un producto</option>
              {productos.map(p => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
            <input
              className="border rounded-lg px-3 py-2 text-sm text-gray-800 bg-white"
              type="number"
              placeholder="Cantidad"
              value={item.cantidad}
              onChange={(e) => actualizarItem(index, 'cantidad', e.target.value)}
            />
            <div className="flex gap-2">
              <input
                className="border rounded-lg px-3 py-2 text-sm text-gray-800 bg-white flex-1"
                type="number"
                placeholder="Precio unitario"
                value={item.precio_unitario}
                onChange={(e) => actualizarItem(index, 'precio_unitario', e.target.value)}
              />
              {items.length > 1 && (
                <button onClick={() => eliminarItem(index)} className="text-red-500 hover:text-red-700 px-2">✕</button>
              )}
            </div>
          </div>
        ))}

        <button onClick={agregarItem} className="text-blue-600 text-sm hover:underline mb-4">
          + Agregar otro producto
        </button>

        <input
          className="border rounded-lg px-4 py-2 text-sm text-gray-800 bg-white w-full mb-4"
          placeholder="Observaciones (opcional)"
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
        />

        <div className="flex justify-between items-center">
          <p className="text-lg font-bold text-gray-800">
            Total: <span className="text-blue-600">${total.toFixed(2)}</span>
          </p>
          <button onClick={registrarVenta} className="bg-green-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-green-700">
            Registrar venta
          </button>
        </div>

        {mensaje && <p className="mt-3 text-green-600 text-sm font-medium">{mensaje}</p>}
      </div>

      <h2 className="text-lg font-semibold text-gray-700 mb-4">Historial de ventas</h2>
      <table className="w-full bg-white rounded-xl shadow overflow-hidden">
        <thead className="bg-gray-800 text-white">
          <tr>
            <th className="text-left px-6 py-3 text-sm">ID</th>
            <th className="text-left px-6 py-3 text-sm">Fecha</th>
            <th className="text-left px-6 py-3 text-sm">Total</th>
            <th className="text-left px-6 py-3 text-sm">Observaciones</th>
          </tr>
        </thead>
        <tbody>
          {ventas.map((v) => (
            <tr key={v.id} className="border-t border-gray-100 hover:bg-gray-50">
              <td className="px-6 py-4 text-sm text-gray-800">#{v.id}</td>
              <td className="px-6 py-4 text-sm text-gray-500">{new Date(v.fecha).toLocaleDateString('es-AR')}</td>
              <td className="px-6 py-4 text-sm font-medium text-green-600">${parseFloat(v.total).toFixed(2)}</td>
              <td className="px-6 py-4 text-sm text-gray-500">{v.observaciones || '-'}</td>
            </tr>
          ))}
          {ventas.length === 0 && (
            <tr>
              <td colSpan={4} className="px-6 py-8 text-center text-gray-400 text-sm">No hay ventas registradas todavía</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}