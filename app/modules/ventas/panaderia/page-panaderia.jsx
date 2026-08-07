'use client'

import { useState, useEffect } from 'react'

const EMOJIS = {
  'Café Chico': '☕', 'Café Grande': '☕', 'Café c/Leche': '🥛',
  'Medialunas x2': '🥐', 'Medialunas común': '🥐', 'Medialunas de hojaldre': '🥐',
  'Pan de Miga': '🍞', 'Facturas Surtidas': '🥐', 'Tostadas': '🍞',
  'Sándwich Simple': '🥪', 'Criollos común': '🥐', 'Criollos de hojaldre': '🥐'
}

function emojiDe(nombre) {
  return EMOJIS[nombre] || '🛒'
}

function formatearPrecio(valor) {
  const num = Number(valor) || 0
  const partes = num.toFixed(2).split('.')
  const entero = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${entero},${partes[1]}`
}

export default function VentasPanaderia() {
  const [productos, setProductos] = useState([])
  const [carrito, setCarrito] = useState([])
  const [mensaje, setMensaje] = useState('')
  const [modalProducto, setModalProducto] = useState(null)
  const [inputGramos, setInputGramos] = useState('')
  const [inputDocenas, setInputDocenas] = useState('')

  useEffect(() => {
    cargarDatos()
  }, [])

  async function cargarDatos() {
    const res = await fetch('/api/products')
    setProductos(await res.json())
  }

  function abrirProducto(producto) {
    if (producto.tipo_medida === 'unidad') {
      agregarAlCarrito(producto, 1, parseFloat(producto.precio_sin_colocacion))
    } else {
      setModalProducto(producto)
      setInputGramos('')
      setInputDocenas('')
    }
  }

  function agregarAlCarrito(producto, cantidad, precioTotal, detalle = '') {
    const key = producto.nombre + detalle
    const existe = carrito.find(p => p.key === key)
    if (existe) {
      setCarrito(carrito.map(p =>
        p.key === key ? { ...p, cantidad: p.cantidad + cantidad, precioTotal: p.precioTotal + precioTotal } : p
      ))
    } else {
      setCarrito([...carrito, {
        key,
        producto_id: producto.id,
        nombre: producto.nombre,
        detalle,
        cantidad,
        precioTotal
      }])
    }
    setModalProducto(null)
  }

  function confirmarPeso() {
    const gramos = parseFloat(inputGramos)
    if (!gramos || gramos <= 0) return
    const precioKg = parseFloat(modalProducto.precio_sin_colocacion)
    const precioTotal = (precioKg * gramos) / 1000
    agregarAlCarrito(modalProducto, gramos / 1000, precioTotal, `${gramos}g`)
  }

  function confirmarDocena(tipo) {
    const precioUnit = parseFloat(modalProducto.precio_sin_colocacion)
    let cantidad = 1
    let detalle = '1 un'
    if (tipo === 'media') { cantidad = 6; detalle = '1/2 doc' }
    if (tipo === 'docena') { cantidad = 12; detalle = '1 doc' }
    const precioTotal = precioUnit * cantidad
    agregarAlCarrito(modalProducto, cantidad, precioTotal, detalle)
  }

  function confirmarPorcion() {
    const porciones = parseInt(inputDocenas) || 1
    const precioUnit = parseFloat(modalProducto.precio_sin_colocacion)
    agregarAlCarrito(modalProducto, porciones, precioUnit * porciones, `${porciones} porc`)
  }

  function quitarDelCarrito(key) {
    setCarrito(carrito.filter(p => p.key !== key))
  }

  const total = carrito.reduce((sum, item) => sum + item.precioTotal, 0)

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
          producto_id: c.producto_id,
          cantidad: c.cantidad,
          precio_unitario: c.cantidad > 0 ? c.precioTotal / c.cantidad : c.precioTotal
        })),
        instalacion: 0,
        observaciones: 'Venta panadería'
      })
    })

    if (res.ok) {
      setMensaje('✓ Venta de $' + formatearPrecio(total) + ' registrada')
      setCarrito([])
      setTimeout(() => setMensaje(''), 3000)
    }
  }

  return (
    <div className="p-4 sm:p-8 bg-gradient-to-br from-orange-50 to-yellow-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-2 inline-block px-3 py-1 rounded-lg" style={{ color: '#ffffff', backgroundColor: '#c2410c' }}>🥐 Panadería</h1>
      <p className="text-sm text-orange-600 mb-6">POS rápido y simple</p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {productos.map((p) => (
          <button
            key={p.id}
            onClick={() => abrirProducto(p)}
            className="bg-white border-2 border-orange-300 rounded-lg p-4 hover:bg-orange-100 hover:border-orange-500 transition flex flex-col items-center justify-center min-h-24 shadow-sm"
          >
            <span className="text-3xl mb-2">{emojiDe(p.nombre)}</span>
            <p className="text-sm font-bold text-gray-800 text-center">{p.nombre}</p>
            <p className="text-lg font-bold text-orange-600">
              ${formatearPrecio(p.precio_sin_colocacion)}
              {p.tipo_medida === 'peso' && ' /kg'}
            </p>
          </button>
        ))}
      </div>

      {modalProducto && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-4">{modalProducto.nombre}</h3>

            {modalProducto.tipo_medida === 'peso' && (
              <>
                <p className="text-xs text-gray-500 mb-2">Precio por kg: ${formatearPrecio(modalProducto.precio_sin_colocacion)}</p>
                <div className="flex gap-2 mb-3">
                  {[250, 500, 1000].map(g => (
                    <button
                      key={g}
                      onClick={() => setInputGramos(String(g))}
                      className="flex-1 bg-orange-100 text-orange-700 rounded-lg py-2 text-sm font-medium hover:bg-orange-200"
                    >
                      {g >= 1000 ? '1 kg' : `${g}g`}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  placeholder="Gramos (ej: 250)"
                  value={inputGramos}
                  onChange={(e) => setInputGramos(e.target.value)}
                  className="border rounded-lg px-3 py-2 w-full mb-3 text-sm"
                />
                <button
                  onClick={confirmarPeso}
                  className="w-full bg-green-600 text-white py-2 rounded-lg font-bold hover:bg-green-700"
                >
                  Agregar
                </button>
              </>
            )}

            {modalProducto.tipo_medida === 'docena' && (
              <div className="flex flex-col gap-2 mb-3">
                <button onClick={() => confirmarDocena('unidad')} className="bg-orange-100 text-orange-700 rounded-lg py-3 text-sm font-medium hover:bg-orange-200">
                  1 unidad — ${formatearPrecio(modalProducto.precio_sin_colocacion)}
                </button>
                <button onClick={() => confirmarDocena('media')} className="bg-orange-100 text-orange-700 rounded-lg py-3 text-sm font-medium hover:bg-orange-200">
                  1/2 docena (6) — ${formatearPrecio(parseFloat(modalProducto.precio_sin_colocacion) * 6)}
                </button>
                <button onClick={() => confirmarDocena('docena')} className="bg-orange-100 text-orange-700 rounded-lg py-3 text-sm font-medium hover:bg-orange-200">
                  1 docena (12) — ${formatearPrecio(parseFloat(modalProducto.precio_sin_colocacion) * 12)}
                </button>
              </div>
            )}

            {modalProducto.tipo_medida === 'porcion' && (
              <>
                <input
                  type="number"
                  placeholder="Cantidad de porciones"
                  value={inputDocenas}
                  onChange={(e) => setInputDocenas(e.target.value)}
                  className="border rounded-lg px-3 py-2 w-full mb-3 text-sm"
                />
                <button
                  onClick={confirmarPorcion}
                  className="w-full bg-green-600 text-white py-2 rounded-lg font-bold hover:bg-green-700"
                >
                  Agregar
                </button>
              </>
            )}

            <button
              onClick={() => setModalProducto(null)}
              className="w-full mt-2 bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-300"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg p-6 max-w-md mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">🛒 Carrito</h2>

        {carrito.length === 0 ? (
          <p className="text-gray-400 text-center py-8">Sin productos</p>
        ) : (
          <>
            {carrito.map((item) => (
              <div key={item.key} className="flex justify-between items-center border-b py-3 mb-3">
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">{item.nombre}</p>
                  {item.detalle && <p className="text-xs text-gray-500">{item.detalle}</p>}
                </div>
                <button
                  onClick={() => quitarDelCarrito(item.key)}
                  className="bg-red-100 text-red-600 w-6 h-6 rounded hover:bg-red-200 mr-3"
                >
                  ✕
                </button>
                <p className="font-bold text-orange-600 min-w-16 text-right">
                  ${formatearPrecio(item.precioTotal)}
                </p>
              </div>
            ))}

            <div className="border-t-2 pt-4 mt-4">
              <p className="text-3xl font-bold text-center text-orange-700 mb-4">
                ${formatearPrecio(total)}
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