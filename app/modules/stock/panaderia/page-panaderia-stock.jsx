'use client'

import { useState, useEffect } from 'react'

const TIPOS_MEDIDA = [
  { value: 'unidad', label: 'Por unidad' },
  { value: 'docena', label: 'Por docena/media docena' },
  { value: 'peso', label: 'Por peso (kg/gramos)' },
  { value: 'porcion', label: 'Por porción' },
]

export default function StockPanaderia() {
  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [porcentajeAumento, setPorcentajeAumento] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [modalAgregar, setModalAgregar] = useState(false)
  const [editando, setEditando] = useState(null)
  const [nuevoProducto, setNuevoProducto] = useState({ nombre: '', precio: '', stock: '', unidad: 'unidades', tipo_medida: 'unidad' })

  useEffect(() => {
    cargarProductos()
  }, [])

  async function cargarProductos() {
    const res = await fetch('/api/products')
    setProductos(await res.json())
    setCargando(false)
  }

  async function actualizarPrecio(id, nuevoPrecio) {
    const res = await fetch('/api/products', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        precio_sin_colocacion: parseFloat(nuevoPrecio),
        precio_con_colocacion: parseFloat(nuevoPrecio)
      })
    })
    if (res.ok) {
      cargarProductos()
      setMensaje('✓ Precio actualizado')
      setTimeout(() => setMensaje(''), 2000)
    }
  }

  async function actualizarStock(id, nuevoStock) {
    const res = await fetch('/api/products', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, set_stock: parseFloat(nuevoStock) })
    })
    if (res.ok) {
      cargarProductos()
    }
  }

  async function aumentarPrecioATodos() {
    if (!porcentajeAumento || isNaN(porcentajeAumento)) {
      setMensaje('Ingresá un porcentaje válido')
      return
    }

    const res = await fetch('/api/products/actualizar-precio-porcentaje', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ porcentaje: parseFloat(porcentajeAumento) })
    })

    if (res.ok) {
      setMensaje(`✓ Todos los precios aumentaron ${porcentajeAumento}%`)
      setPorcentajeAumento('')
      cargarProductos()
      setTimeout(() => setMensaje(''), 3000)
    }
  }

  async function agregarProducto() {
    if (!nuevoProducto.nombre || !nuevoProducto.precio || !nuevoProducto.stock) {
      setMensaje('Completá todos los campos')
      return
    }

    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: nuevoProducto.nombre,
        precio_sin_colocacion: parseFloat(nuevoProducto.precio),
        precio_con_colocacion: parseFloat(nuevoProducto.precio),
        stock_actual: parseFloat(nuevoProducto.stock),
        unidad: nuevoProducto.unidad,
        tipo_medida: nuevoProducto.tipo_medida
      })
    })

    if (res.ok) {
      setMensaje('✓ Producto agregado')
      setNuevoProducto({ nombre: '', precio: '', stock: '', unidad: 'unidades', tipo_medida: 'unidad' })
      setModalAgregar(false)
      cargarProductos()
    }
  }

  function abrirEditar(p) {
    setEditando({
      id: p.id,
      nombre: p.nombre,
      unidad: p.unidad,
      tipo_medida: p.tipo_medida || 'unidad'
    })
  }

  async function guardarEdicion() {
    const res = await fetch('/api/products', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: editando.id,
        set_nombre: editando.nombre,
        set_unidad: editando.unidad,
        set_tipo_medida: editando.tipo_medida
      })
    })
    if (res.ok) {
      setMensaje('✓ Producto actualizado')
      setEditando(null)
      cargarProductos()
      setTimeout(() => setMensaje(''), 2000)
    }
  }

  async function eliminarProducto(id, nombre) {
    if (!confirm(`¿Eliminar "${nombre}"? Esta acción no se puede deshacer.`)) return
    const res = await fetch('/api/products', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
    if (res.ok) {
      setMensaje(`✓ "${nombre}" eliminado`)
      cargarProductos()
    } else {
      setMensaje('No se pudo eliminar (puede tener ventas asociadas)')
    }
    setTimeout(() => setMensaje(''), 3000)
  }

  if (cargando) return <div className="p-8 text-center">Cargando...</div>

  return (
    <div className="p-4 sm:p-8">
      <h1 className="text-2xl font-bold mb-6">📦 Stock</h1>

      {/* Aumentar % a todos */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Ajuste de precios</h2>
        <div className="flex gap-2 flex-wrap">
          <input
            type="number"
            placeholder="Ej: 10 (para +10%)"
            value={porcentajeAumento}
            onChange={(e) => setPorcentajeAumento(e.target.value)}
            className="border rounded px-3 py-2 w-32 text-sm"
          />
          <button
            onClick={aumentarPrecioATodos}
            className="bg-orange-600 text-white px-4 py-2 rounded text-sm hover:bg-orange-700"
          >
            Aumentar % a TODOS
          </button>
        </div>
      </div>

      {/* Botón agregar producto */}
      <button
        onClick={() => setModalAgregar(true)}
        className="bg-green-600 text-white px-4 py-2 rounded mb-6 text-sm hover:bg-green-700"
      >
        + Agregar producto
      </button>

      {/* Modal agregar */}
      {modalAgregar && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold mb-4">Agregar producto</h3>
            <input
              type="text"
              placeholder="Nombre"
              value={nuevoProducto.nombre}
              onChange={(e) => setNuevoProducto({ ...nuevoProducto, nombre: e.target.value })}
              className="border rounded px-3 py-2 w-full mb-3 text-sm"
            />
            <label className="text-xs text-gray-500 mb-1 block">Cómo se vende</label>
            <select
              value={nuevoProducto.tipo_medida}
              onChange={(e) => setNuevoProducto({ ...nuevoProducto, tipo_medida: e.target.value })}
              className="border rounded px-3 py-2 w-full mb-3 text-sm"
            >
              {TIPOS_MEDIDA.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <label className="text-xs text-gray-500 mb-1 block">Unidad (texto libre, ej: taza, kg, unidades)</label>
            <input
              type="text"
              placeholder="Ej: unidades, kg, taza"
              value={nuevoProducto.unidad}
              onChange={(e) => setNuevoProducto({ ...nuevoProducto, unidad: e.target.value })}
              className="border rounded px-3 py-2 w-full mb-3 text-sm"
            />
            <label className="text-xs text-gray-500 mb-1 block">
              Precio {nuevoProducto.tipo_medida === 'peso' ? '(por kg)' : ''}
            </label>
            <input
              type="number"
              placeholder="Precio"
              value={nuevoProducto.precio}
              onChange={(e) => setNuevoProducto({ ...nuevoProducto, precio: e.target.value })}
              className="border rounded px-3 py-2 w-full mb-3 text-sm"
            />
            <label className="text-xs text-gray-500 mb-1 block">
              Stock {nuevoProducto.tipo_medida === 'peso' ? '(en kg)' : ''}
            </label>
            <input
              type="number"
              placeholder="Stock"
              value={nuevoProducto.stock}
              onChange={(e) => setNuevoProducto({ ...nuevoProducto, stock: e.target.value })}
              className="border rounded px-3 py-2 w-full mb-3 text-sm"
            />
            <div className="flex gap-2">
              <button
                onClick={agregarProducto}
                className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 flex-1"
              >
                Agregar
              </button>
              <button
                onClick={() => setModalAgregar(false)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-400 flex-1"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal editar */}
      {editando && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold mb-4">Editar producto</h3>
            <label className="text-xs text-gray-500 mb-1 block">Nombre</label>
            <input
              type="text"
              value={editando.nombre}
              onChange={(e) => setEditando({ ...editando, nombre: e.target.value })}
              className="border rounded px-3 py-2 w-full mb-3 text-sm"
            />
            <label className="text-xs text-gray-500 mb-1 block">Cómo se vende</label>
            <select
              value={editando.tipo_medida}
              onChange={(e) => setEditando({ ...editando, tipo_medida: e.target.value })}
              className="border rounded px-3 py-2 w-full mb-3 text-sm"
            >
              {TIPOS_MEDIDA.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <label className="text-xs text-gray-500 mb-1 block">Unidad</label>
            <input
              type="text"
              value={editando.unidad}
              onChange={(e) => setEditando({ ...editando, unidad: e.target.value })}
              className="border rounded px-3 py-2 w-full mb-3 text-sm"
            />
            <div className="flex gap-2">
              <button
                onClick={guardarEdicion}
                className="bg-yellow-500 text-white px-4 py-2 rounded text-sm hover:bg-yellow-600 flex-1"
              >
                Guardar
              </button>
              <button
                onClick={() => setEditando(null)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-400 flex-1"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabla Stock */}
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="w-full min-w-[700px]">
          <thead className="bg-gray-800 text-white">
            <tr>
              <th className="text-left px-6 py-3 text-sm">Producto</th>
              <th className="text-left px-6 py-3 text-sm">Unidad</th>
              <th className="text-left px-6 py-3 text-sm">Precio</th>
              <th className="text-left px-6 py-3 text-sm">Stock</th>
              <th className="text-left px-6 py-3 text-sm">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {productos.map((p) => (
              <tr key={p.id} className="border-t hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-800">{p.nombre}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{p.unidad}</td>
                <td className="px-6 py-4 text-sm">
                  <div className="flex items-center gap-1">
                    <span className="text-gray-500">$</span>
                    <input
                      type="number"
                      defaultValue={p.precio_sin_colocacion}
                      onBlur={(e) => actualizarPrecio(p.id, e.target.value)}
                      className="border rounded px-2 py-1 w-24 text-sm"
                      step="0.01"
                    />
                  </div>
                </td>
                <td className="px-6 py-4 text-sm">
                  <input
                    type="number"
                    defaultValue={p.stock_actual}
                    onBlur={(e) => actualizarStock(p.id, e.target.value)}
                    className="border rounded px-2 py-1 w-20 text-sm"
                    step="any"
                  />
                </td>
                <td className="px-6 py-4 text-sm">
                  <div className="flex gap-2">
                    <button
                      onClick={() => abrirEditar(p)}
                      className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-medium hover:bg-yellow-200"
                    >
                      ✏ Editar
                    </button>
                    <button
                      onClick={() => eliminarProducto(p.id, p.nombre)}
                      className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs font-medium hover:bg-red-200"
                    >
                      🗑
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {mensaje && <p className="mt-4 text-green-600 font-bold text-center">{mensaje}</p>}
    </div>
  )
}