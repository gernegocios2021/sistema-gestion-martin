'use client'

import { useState, useEffect } from 'react'

const UNIDADES = ['Unidad', 'Barra', 'Metro', 'Kilo', 'm²', 'Caja', 'Plancha']

export default function Stock() {
  const [productos, setProductos] = useState([])
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [editando, setEditando] = useState(null)
  const [reponiendo, setReponiendo] = useState(null)
  const [cantidadReponer, setCantidadReponer] = useState('')
  const [nuevo, setNuevo] = useState({ nombre: '', unidad: 'Unidad', stock_actual: '', stock_minimo: '', categoria: 'materia_prima' })
  const [mensaje, setMensaje] = useState('')

  useEffect(() => {
    cargarProductos()
  }, [])

  async function cargarProductos() {
    const res = await fetch('/api/products')
    const data = await res.json()
    setProductos(data)
  }

  async function agregarProducto() {
    if (!nuevo.nombre) {
      setMensaje('El nombre es obligatorio.')
      setTimeout(() => setMensaje(''), 3000)
      return
    }
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: nuevo.nombre,
        unidad: nuevo.unidad,
        stock_actual: Number(nuevo.stock_actual) || 0,
        stock_minimo: Number(nuevo.stock_minimo) || 0,
        categoria: nuevo.categoria
      })
    })
    if (res.ok) {
      const creado = await res.json()
      setProductos((prev) => [...prev, creado])
      setNuevo({ nombre: '', unidad: 'Unidad', stock_actual: '', stock_minimo: '', categoria: 'materia_prima' })
      setMostrarFormulario(false)
      setMensaje('✓ Producto agregado')
      setTimeout(() => setMensaje(''), 3000)
    }
  }

  async function guardarEdicion() {
    if (!editando.nombre) {
      setMensaje('El nombre es obligatorio.')
      setTimeout(() => setMensaje(''), 3000)
      return
    }
    const res = await fetch('/api/products', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: editando.id,
        nombre: editando.nombre,
        unidad: editando.unidad,
        stock_actual: editando.stock_actual,
        stock_minimo: editando.stock_minimo,
        categoria: editando.categoria
      })
    })
    if (res.ok) {
      const actualizado = await res.json()
      setProductos((prev) => prev.map((p) => (p.id === actualizado.id ? actualizado : p)))
      setEditando(null)
      setMensaje('✓ Producto actualizado')
      setTimeout(() => setMensaje(''), 3000)
    }
  }

  async function reponerStock() {
    const cantidad = Number(cantidadReponer)
    if (!cantidad || cantidad <= 0) return
    const res = await fetch('/api/products', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: reponiendo.id,
        cantidad: cantidad
      })
    })
    if (res.ok) {
      const actualizado = await res.json()
      setProductos((prev) => prev.map((p) => (p.id === actualizado.id ? actualizado : p)))
      setMensaje(`✓ Se agregaron ${cantidad} a ${reponiendo.nombre}`)
      setReponiendo(null)
      setCantidadReponer('')
      setTimeout(() => setMensaje(''), 3000)
    }
  }

  async function eliminarProducto(id, nombre) {
    if (!confirm(`¿Seguro que querés eliminar "${nombre}"?`)) return
    try {
      const res = await fetch('/api/products', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })
      if (res.ok) {
        setProductos((prev) => prev.filter((p) => p.id !== id))
        setMensaje(`✓ "${nombre}" eliminado`)
      } else {
        setMensaje('No se pudo eliminar (puede tener ventas asociadas)')
      }
    } catch (e) {
      setMensaje('No se pudo eliminar')
    } finally {
      setTimeout(() => setMensaje(''), 4000)
    }
  }

  async function enviarAlerta() {
    const res = await fetch('/api/alertas', { method: 'POST' })
    const data = await res.json()
    setMensaje(data.mensaje || data.error)
    setTimeout(() => setMensaje(''), 4000)
  }

  return (
    <div className="p-4 sm:p-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Stock / Inventario</h1>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={enviarAlerta}
            className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-600"
          >
            🔔 Enviar alerta stock
          </button>
          <button
            onClick={() => { setMostrarFormulario(!mostrarFormulario); setEditando(null) }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
          >
            + Agregar producto
          </button>
        </div>
      </div>

      {mensaje && <p className="mb-4 text-green-600 text-sm font-medium">{mensaje}</p>}

      {mostrarFormulario && (
        <div className="bg-white rounded-xl shadow p-4 sm:p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Nuevo producto</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Nombre del producto</label>
              <input className="border rounded-lg px-4 py-2 text-sm text-gray-800 bg-white w-full" placeholder="Ej: Perfil ADR2200" value={nuevo.nombre} onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Unidad de medida</label>
              <select className="border rounded-lg px-4 py-2 text-sm text-gray-800 bg-white w-full" value={nuevo.unidad} onChange={(e) => setNuevo({ ...nuevo, unidad: e.target.value })}>
                {UNIDADES.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Stock actual</label>
              <input className="border rounded-lg px-4 py-2 text-sm text-gray-800 bg-white w-full" placeholder="Ej: 20" type="number" value={nuevo.stock_actual} onChange={(e) => setNuevo({ ...nuevo, stock_actual: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Stock mínimo</label>
              <input className="border rounded-lg px-4 py-2 text-sm text-gray-800 bg-white w-full" placeholder="Ej: 5" type="number" value={nuevo.stock_minimo} onChange={(e) => setNuevo({ ...nuevo, stock_minimo: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-gray-500 mb-1 block">Categoría</label>
              <select className="border rounded-lg px-4 py-2 text-sm text-gray-800 bg-white w-full" value={nuevo.categoria} onChange={(e) => setNuevo({ ...nuevo, categoria: e.target.value })}>
                <option value="materia_prima">🔧 Materia prima (aluminio, herrajes, etc.)</option>
                <option value="mercaderia">🪟 Mercadería para reventa (vidrio, etc.)</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={agregarProducto} className="bg-green-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-green-700">Guardar</button>
            <button onClick={() => setMostrarFormulario(false)} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg text-sm hover:bg-gray-300">Cancelar</button>
          </div>
        </div>
      )}

      {editando && (
        <div className="bg-white rounded-xl shadow p-4 sm:p-6 mb-6 border-l-4 border-yellow-400">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Editar producto</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Nombre del producto</label>
              <input className="border rounded-lg px-4 py-2 text-sm text-gray-800 bg-white w-full" value={editando.nombre} onChange={(e) => setEditando({ ...editando, nombre: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Unidad de medida</label>
              <select className="border rounded-lg px-4 py-2 text-sm text-gray-800 bg-white w-full" value={editando.unidad || 'Unidad'} onChange={(e) => setEditando({ ...editando, unidad: e.target.value })}>
                {UNIDADES.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Stock actual</label>
              <input className="border rounded-lg px-4 py-2 text-sm text-gray-800 bg-white w-full" type="number" value={editando.stock_actual ?? ''} onChange={(e) => setEditando({ ...editando, stock_actual: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Stock mínimo</label>
              <input className="border rounded-lg px-4 py-2 text-sm text-gray-800 bg-white w-full" type="number" value={editando.stock_minimo ?? ''} onChange={(e) => setEditando({ ...editando, stock_minimo: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-gray-500 mb-1 block">Categoría</label>
              <select className="border rounded-lg px-4 py-2 text-sm text-gray-800 bg-white w-full" value={editando.categoria || 'materia_prima'} onChange={(e) => setEditando({ ...editando, categoria: e.target.value })}>
                <option value="materia_prima">🔧 Materia prima (aluminio, herrajes, etc.)</option>
                <option value="mercaderia">🪟 Mercadería para reventa (vidrio, etc.)</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={guardarEdicion} className="bg-yellow-500 text-white px-6 py-2 rounded-lg text-sm hover:bg-yellow-600">Guardar cambios</button>
            <button onClick={() => setEditando(null)} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg text-sm hover:bg-gray-300">Cancelar</button>
          </div>
        </div>
      )}

      {reponiendo && (
        <div className="bg-white rounded-xl shadow p-4 sm:p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Reponer stock — {reponiendo.nombre}</h2>
          <p className="text-sm text-gray-500 mb-4">Stock actual: <strong>{reponiendo.stock_actual}</strong> {reponiendo.unidad}</p>
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <input
              className="border rounded-lg px-4 py-2 text-sm text-gray-800 bg-white w-full sm:w-48"
              type="number"
              placeholder="Cantidad a agregar"
              value={cantidadReponer}
              onChange={(e) => setCantidadReponer(e.target.value)}
            />
            <div className="flex gap-3">
              <button onClick={reponerStock} className="bg-green-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-green-700">Confirmar</button>
              <button onClick={() => { setReponiendo(null); setCantidadReponer('') }} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg text-sm hover:bg-gray-300">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto bg-white rounded-xl shadow">
        <table className="w-full min-w-[760px]">
          <thead className="bg-gray-800 text-white">
            <tr>
              <th className="text-left px-6 py-3 text-sm">Producto</th>
              <th className="text-left px-6 py-3 text-sm">Categoría</th>
              <th className="text-left px-6 py-3 text-sm">Unidad de medida</th>
              <th className="text-left px-6 py-3 text-sm">Stock actual</th>
              <th className="text-left px-6 py-3 text-sm">Stock mínimo</th>
              <th className="text-left px-6 py-3 text-sm">Estado</th>
              <th className="text-left px-6 py-3 text-sm">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {productos.map((p) => (
              <tr key={p.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-800">{p.nombre}</td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {p.categoria === 'mercaderia' ? '🪟 Mercadería' : '🔧 Materia prima'}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{p.unidad}</td>
                <td className="px-6 py-4 text-sm font-medium text-gray-800">{p.stock_actual}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{p.stock_minimo}</td>
                <td className="px-6 py-4">
                  {Number(p.stock_actual) <= Number(p.stock_minimo) ? (
                    <span className="bg-red-100 text-red-600 text-xs font-medium px-3 py-1 rounded-full">⚠ Stock bajo</span>
                  ) : (
                    <span className="bg-green-100 text-green-600 text-xs font-medium px-3 py-1 rounded-full">✓ Normal</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => { setReponiendo(p); setCantidadReponer(''); setEditando(null); setMostrarFormulario(false) }}
                      className="bg-blue-100 text-blue-600 text-xs font-medium px-3 py-1 rounded-full hover:bg-blue-200"
                    >
                      + Reponer
                    </button>
                    <button
                      onClick={() => { setEditando(p); setReponiendo(null); setMostrarFormulario(false) }}
                      className="bg-yellow-100 text-yellow-700 text-xs font-medium px-3 py-1 rounded-full hover:bg-yellow-200"
                    >
                      ✏ Editar
                    </button>
                    <button
                      onClick={() => eliminarProducto(p.id, p.nombre)}
                      className="bg-red-100 text-red-600 text-xs font-medium px-3 py-1 rounded-full hover:bg-red-200"
                    >
                      🗑 Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}