'use client'

import { useState, useEffect } from 'react'

export default function VentasPanaderia() {
  const [productos, setProductos] = useState([])
  const [carrito, setCarrito] = useState([])
  const [mensaje, setMensaje] = useState('')

  const BOTONES = [
    { nombre: 'Café Chico', precio: 80, emoji: '☕' },
    { nombre: 'Café Grande', precio: 120, emoji: '☕' },
    { nombre: 'Café c/Leche', precio: 100, emoji: '🥛' },
    { nombre: 'Medialunas x2', precio: 150, emoji: '🥐' },
    { nombre: 'Pan de Miga', precio: 200, emoji: '🍞' },
    { nombre: 'Facturas Surtidas', precio: 250, emoji: '🥐' },
    { nombre: 'Tostadas', precio: 90, emoji: '🍞' },
    { nombre: 'Sándwich Simple', precio: 350, emoji: '🥪' },
  ]

  useEffect(() => {
    cargarDatos()
  }, [])

  async function cargarDatos() {
    const res = await fetch('/api/products')
    setProductos(await res.json())
  }

  function agregarAlCarrito(producto) {
    const existe = carrito.find(p => p.nombre === producto.nombre)
    if (existe) {
      setCarrito(carrito.map(p =>
        p.nombre === producto.nombre ? { ...p, cantidad: p.cantidad + 1 } : p
      ))
    } else {
      setCarrito([...carrito, { ...producto, cantidad: 1 }])
    }
  }

  function quitarDelCarrito(nombre) {
    setCarrito(carrito.filter(p => p.nombre !== nombre))
  }

  function cambiarCantidad(nombre, cantidad) {
    if (cantidad <= 0) {
      quitarDelCarrito(nombre)
    } else {
      setCarrito(carrito.map(p =>
        p.nombre === nombre ? { ...p, cantidad } : p
      ))
    }
  }

  const total = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0)

  async function cobrar() {
    if (carrito.length === 0) {
      setMensaje('Agregá productos al carrito')
      return
    }

    const res = await fetch('/api/ventas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: carrito.map(c => ({
          producto_id: c.producto_id || 1, // Dummy ID
          cantidad: c.cantidad,
          precio_unitario: c.precio
        })),
        instalacion: 0,
        observaciones: 'Venta panadería'
      })
    })

    if (res.ok) {
      setMensaje(`✓ Venta de $${total} registrada`)
      setCarrito([])
      setTimeout(() => setMensaje(''), 3000)
    }
  }

  return (
    <div className="p-4 sm:p-8 bg-gradient-to-br from-orange-50 to-yellow-50 min-h-screen">
      <h1 className="text-3xl font-bold text-orange-800 mb-2">🥐 Panadería</h1>
      <p className="text-sm text-orange-600 mb-6">POS rápido y simple</p>

      {/* BOTONERA TÁCTIL */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {BOTONES.map((btn, idx) => (
          <button
            key={idx}
            onClick={() => agregarAlCarrito(btn)}
            className="bg-white border-2 border-orange-300 rounded-lg p-4 hover:bg-orange-100 hover:border-orange-500 transition flex flex-col items-center justify-center min-h-24 shadow-sm"
          >
            <span className="text-3xl mb-2">{btn.emoji}</span>
            <p className="text-sm font-bold text-gray-800 text-center">{btn.nombre}</p>
            <p className="text-lg font-bold text-orange-600">${btn.precio}</p>
          </button>
        ))}
      </div>

      {/* CARRITO */}
      <div className="bg-white rounded-xl shadow-lg p-6 max-w-md mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">🛒 Carrito</h2>

        {carrito.length === 0 ? (
          <p className="text-gray-400 text-center py-8">Sin productos</p>
        ) : (
          <>
            {carrito.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center border-b py-3 mb-3">
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">{item.nombre}</p>
                  <p className="text-xs text-gray-500">${item.precio} c/u</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => cambiarCantidad(item.nombre, item.cantidad - 1)}
                    className="bg-red-100 text-red-600 w-6 h-6 rounded hover:bg-red-200"
                  >
                    −
                  </button>
                  <span className="w-6 text-center font-bold">{item.cantidad}</span>
                  <button
                    onClick={() => cambiarCantidad(item.nombre, item.cantidad + 1)}
                    className="bg-green-100 text-green-600 w-6 h-6 rounded hover:bg-green-200"
                  >
                    +
                  </button>
                </div>
                <p className="font-bold text-orange-600 ml-3 min-w-16 text-right">
                  ${(item.precio * item.cantidad).toLocaleString('es-AR')}
                </p>
              </div>
            ))}

            <div className="border-t-2 pt-4 mt-4">
              <p className="text-3xl font-bold text-center text-orange-700 mb-4">
                ${total.toLocaleString('es-AR')}
              </p>
              <button
                onClick={cobrar}
                className="w-full bg-green-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-green-700 mb-2"
              >
                💳 COBRAR
              </button>
              <button
                onClick={() => setCarrito([])}
                className="w-full bg-gray-300 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-400"
              >
                ❌ Cancelar
              </button>
            </div>
          </>
        )}

        {mensaje && (
          <p className="mt-4 text-green-600 font-bold text-center">{mensaje}</p>
        )}
      </div>
    </div>
  )
}