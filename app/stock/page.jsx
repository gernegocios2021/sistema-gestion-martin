'use client'

import { useState, useEffect } from 'react'

export default function Stock() {
  const [productos, setProductos] = useState([])
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [reponiendo, setReponiendo] = useState(null)
  const [cantidadReponer, setCantidadReponer] = useState('')
  const [nuevo, setNuevo] = useState({ nombre: '', unidad: '', stock_actual: '', stock_minimo: '', categoria: 'materia_prima' })
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
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: nuevo.nombre,
        unidad: nuevo.unidad,
        stock_actual: parseInt(nuevo.stock_actual),
        stock_minimo: parseInt(nuevo.stock_minimo),
        categoria: nuevo.categoria
      })
    })
    if (res.ok) {
      setNuevo({ nombre: '', unidad: '', stock_actual: '', stock_minimo: '', categoria: 'materia_prima' })
      setMostrarFormulario(false)
      cargarProductos()
    }
  }

  async function reponerStock() {
    if (!cantidadReponer || cantidadReponer <= 0) return
    const res = await fetch('/api/products', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: reponiendo.id,
        cantidad: parseInt(cantidadReponer)
      })
    })
    if (res.ok) {
      setMensaje(`✓ Se agregaron ${cantidadReponer} unidades a ${reponiendo.nombre}`)
      setReponiendo(null)
      setCantidadReponer('')
      cargarProductos()
      setTimeout(() => setMensaje(''), 3000)
    }
  }

  async function enviarAlerta() {
    const res = await fetch('/api/alertas', {
      method: 'POST'
    })
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
  style={{ backgroundColor: '#ef4444', color: 'white', padding: '8px 16px', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}
>
  🔔 Enviar alerta stock
</button>
          <button
            onClick={() => setMostrarFormulario(!mostrarFormulario)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
          >
            + Agregar producto
          </button>
        </div>
      </div>

      {mensaje && <p className="mb-4 text-green-600 text-sm font-medium">{mensaje}</p>}

      {mostrarFormulario && (
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Nuevo producto</h2>
          <div className="grid grid-cols-2 gap-4">
            <input className="border rounded-lg px-4 py-2 text-sm text-gray-800 bg-white" placeholder="Nombre del producto" value={nuevo.nombre} onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })} />
            <input className="border rounded-lg px-4 py-2 text-sm text-gray-800 bg-white" placeholder="Unidad (barra, metro, caja...)" value={nuevo.unidad} onChange={(e) => setNuevo({ ...nuevo, unidad: e.target.value })} />
            <input className="border rounded-lg px-4 py-2 text-sm text-gray-800 bg-white" placeholder="Stock actual" type="number" value={nuevo.stock_actual} onChange={(e) => setNuevo({ ...nuevo, stock_actual: e.target.value })} />
            <input className="border rounded-lg px-4 py-2 text-sm text-gray-800 bg-white" placeholder="Stock mínimo" type="number" value={nuevo.stock_minimo} onChange={(e) => setNuevo({ ...nuevo, stock_minimo: e.target.value })} />
            <select className="border rounded-lg px-4 py-2 text-sm text-gray-800 bg-white col-span-2" value={nuevo.categoria} onChange={(e) => setNuevo({ ...nuevo, categoria: e.target.value })}>
              <option value="materia_prima">🔧 Materia prima (aluminio, herrajes, etc.)</option>
              <option value="mercaderia">🪟 Mercadería para reventa (vidrio, etc.)</option>
            </select>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={agregarProducto} className="bg-green-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-green-700">Guardar</button>
            <button onClick={() => setMostrarFormulario(false)} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg text-sm hover:bg-gray-300">Cancelar</button>
          </div>
        </div>
      )}

      {reponiendo && (
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Reponer stock — {reponiendo.nombre}</h2>
          <p className="text-sm text-gray-500 mb-4">Stock actual: <strong>{reponiendo.stock_actual}</strong> {reponiendo.unidad}</p>
          <div className="flex gap-3 items-center">
            <input
              className="border rounded-lg px-4 py-2 text-sm text-gray-800 bg-white w-48"
              type="number"
              placeholder="Cantidad a agregar"
              value={cantidadReponer}
              onChange={(e) => setCantidadReponer(e.target.value)}
            />
            <button onClick={reponerStock} className="bg-green-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-green-700">Confirmar</button>
            <button onClick={() => { setReponiendo(null); setCantidadReponer('') }} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg text-sm hover:bg-gray-300">Cancelar</button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto bg-white rounded-xl shadow">
      <table className="w-full min-w-[700px]">
        <thead className="bg-gray-800 text-white">
          <tr>
            <th className="text-left px-6 py-3 text-sm">Producto</th>
            <th className="text-left px-6 py-3 text-sm">Categoría</th>
            <th className="text-left px-6 py-3 text-sm">Unidad</th>
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
                {p.stock_actual < p.stock_minimo ? (
                  <span className="bg-red-100 text-red-600 text-xs font-medium px-3 py-1 rounded-full">⚠ Stock bajo</span>
                ) : (
                  <span className="bg-green-100 text-green-600 text-xs font-medium px-3 py-1 rounded-full">✓ Normal</span>
                )}
              </td>
              <td className="px-6 py-4">
                <button
                  onClick={() => { setReponiendo(p); setCantidadReponer('') }}
                  className="bg-blue-100 text-blue-600 text-xs font-medium px-3 py-1 rounded-full hover:bg-blue-200"
                >
                  + Reponer
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  )
}