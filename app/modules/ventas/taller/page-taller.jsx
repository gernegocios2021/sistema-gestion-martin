'use client'

import { useState, useEffect } from 'react'

export default function VentasTaller() {
  const [productos, setProductos] = useState([])
  const [items, setItems] = useState([{ producto_id: '', cantidad: 1, precio_unitario: '' }])
  const [carrito, setCarrito] = useState([])
  const [total, setTotal] = useState(0)
  const [mensaje, setMensaje] = useState('')

  useEffect(() => {
    cargarDatos()
  }, [])

  async function cargarDatos() {
    const res = await fetch('/api/products')
    setProductos(await res.json())
  }

  const totalCalculado = items.reduce((sum, item) => sum + (parseFloat(item.cantidad) * parseFloat(item.precio_unitario) || 0), 0)

  async function registrarVenta() {
    if (items.some(i => !i.producto_id || !i.precio_unitario)) {
      setMensaje('Completá producto y precio')
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
        instalacion: 0,
        observaciones: ''
      })
    })

    if (res.ok) {
      setMensaje('✓ Venta registrada')
      setItems([{ producto_id: '', cantidad: 1, precio_unitario: '' }])
      setTimeout(() => setMensaje(''), 3000)
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Ventas - Taller (Versión Simplificada)</h1>
      
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <p className="text-sm text-gray-600 mb-4">Total: ${totalCalculado.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</p>
        <button onClick={registrarVenta} className="bg-green-600 text-white px-6 py-2 rounded">
          Registrar Venta
        </button>
        {mensaje && <p className="mt-3 text-green-600">{mensaje}</p>}
      </div>
    </div>
  )
}