'use client'

import { useState, useEffect } from 'react'

const CATEGORIAS = [
  'Compra de insumos',
  'Sueldos',
  'Alquiler',
  'Luz',
  'Teléfono',
  'Municipalidad',
  'Ingresos Brutos',
  'Seguros',
  'Automotor',
  'Retiro Martín',
  'Retiro Iván',
  'Vales de comida',
  'Otros',
]

export default function Gastos() {
  const [gastos, setGastos] = useState([])
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [editando, setEditando] = useState(null)
  const [nuevo, setNuevo] = useState({ categoria: '', descripcion: '', monto: '', responsable: 'Martín' })
  const [mensaje, setMensaje] = useState('')
  const [filtroMes, setFiltroMes] = useState('')

  useEffect(() => {
    cargarGastos()
  }, [])

  async function cargarGastos() {
    const res = await fetch('/api/gastos')
    const data = await res.json()
    setGastos(data)
  }

  async function agregarGasto() {
    if (!nuevo.categoria || !nuevo.monto) {
      setMensaje('Completá categoría y monto.')
      return
    }
    const res = await fetch('/api/gastos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        categoria: nuevo.categoria,
        descripcion: nuevo.descripcion,
        monto: parseFloat(nuevo.monto),
        responsable: nuevo.responsable
      })
    })
    if (res.ok) {
      setMensaje('✓ Gasto registrado correctamente')
      setNuevo({ categoria: '', descripcion: '', monto: '', responsable: 'Martín' })
      setMostrarFormulario(false)
      cargarGastos()
      setTimeout(() => setMensaje(''), 3000)
    }
  }

  async function guardarEdicion() {
    if (!editando.categoria || !editando.monto) {
      setMensaje('Completá categoría y monto.')
      return
    }
    const res = await fetch('/api/gastos', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: editando.id,
        categoria: editando.categoria,
        descripcion: editando.descripcion,
        monto: parseFloat(editando.monto),
        responsable: editando.responsable
      })
    })
    if (res.ok) {
      setMensaje('✓ Gasto modificado correctamente')
      setEditando(null)
      cargarGastos()
      setTimeout(() => setMensaje(''), 3000)
    }
  }

  const gastosFiltrados = filtroMes
    ? gastos.filter(g => g.fecha.startsWith(filtroMes))
    : gastos

  const totalMes = gastosFiltrados.reduce((sum, g) => sum + parseFloat(g.monto), 0)

  return (
    <div className="p-4 sm:p-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Gastos</h1>
        <button
          onClick={() => { setMostrarFormulario(!mostrarFormulario); setEditando(null) }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
        >
          + Registrar gasto
        </button>
      </div>

      {mensaje && <p className="mb-4 text-green-600 text-sm font-medium">{mensaje}</p>}

      {mostrarFormulario && (
        <div className="bg-white rounded-xl shadow p-4 sm:p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Nuevo gasto</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <select className="border rounded-lg px-4 py-2 text-sm text-gray-800 bg-white" value={nuevo.categoria} onChange={(e) => setNuevo({ ...nuevo, categoria: e.target.value })}>
              <option value="">Seleccioná una categoría</option>
              {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input className="border rounded-lg px-4 py-2 text-sm text-gray-800 bg-white" placeholder="Monto" type="number" value={nuevo.monto} onChange={(e) => setNuevo({ ...nuevo, monto: e.target.value })} />
            <input className="border rounded-lg px-4 py-2 text-sm text-gray-800 bg-white sm:col-span-2" placeholder="Descripción (opcional)" value={nuevo.descripcion} onChange={(e) => setNuevo({ ...nuevo, descripcion: e.target.value })} />
            <select className="border rounded-lg px-4 py-2 text-sm text-gray-800 bg-white" value={nuevo.responsable} onChange={(e) => setNuevo({ ...nuevo, responsable: e.target.value })}>
              <option value="Martín">Martín</option>
              <option value="Iván">Iván</option>
              <option value="Empresa">Empresa</option>
            </select>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={agregarGasto} className="bg-green-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-green-700">Guardar</button>
            <button onClick={() => setMostrarFormulario(false)} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg text-sm hover:bg-gray-300">Cancelar</button>
          </div>
        </div>
      )}

      {editando && (
        <div className="bg-white rounded-xl shadow p-4 sm:p-6 mb-6 border-l-4 border-yellow-400">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Editar gasto</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <select className="border rounded-lg px-4 py-2 text-sm text-gray-800 bg-white" value={editando.categoria} onChange={(e) => setEditando({ ...editando, categoria: e.target.value })}>
              <option value="">Seleccioná una categoría</option>
              {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input className="border rounded-lg px-4 py-2 text-sm text-gray-800 bg-white" placeholder="Monto" type="number" value={editando.monto} onChange={(e) => setEditando({ ...editando, monto: e.target.value })} />
            <input className="border rounded-lg px-4 py-2 text-sm text-gray-800 bg-white sm:col-span-2" placeholder="Descripción (opcional)" value={editando.descripcion || ''} onChange={(e) => setEditando({ ...editando, descripcion: e.target.value })} />
            <select className="border rounded-lg px-4 py-2 text-sm text-gray-800 bg-white" value={editando.responsable} onChange={(e) => setEditando({ ...editando, responsable: e.target.value })}>
              <option value="Martín">Martín</option>
              <option value="Iván">Iván</option>
              <option value="Empresa">Empresa</option>
            </select>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={guardarEdicion} className="bg-yellow-500 text-white px-6 py-2 rounded-lg text-sm hover:bg-yellow-600">Guardar cambios</button>
            <button onClick={() => setEditando(null)} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg text-sm hover:bg-gray-300">Cancelar</button>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-600">Filtrar por mes:</label>
          <input type="month" className="border rounded-lg px-3 py-1 text-sm text-gray-800 bg-white" value={filtroMes} onChange={(e) => setFiltroMes(e.target.value)} />
        </div>
        <div className="bg-white rounded-xl shadow px-6 py-3">
          <span className="text-sm text-gray-500">Total: </span>
          <span className="text-lg font-bold text-red-600">${totalMes.toLocaleString('es-AR')}</span>
        </div>
      </div>

      <div className="overflow-x-auto bg-white rounded-xl shadow">
        <table className="w-full min-w-[700px]">
          <thead className="bg-gray-800 text-white">
            <tr>
              <th className="text-left px-6 py-3 text-sm">Fecha</th>
              <th className="text-left px-6 py-3 text-sm">Categoría</th>
              <th className="text-left px-6 py-3 text-sm">Descripción</th>
              <th className="text-left px-6 py-3 text-sm">Responsable</th>
              <th className="text-left px-6 py-3 text-sm">Monto</th>
              <th className="text-left px-6 py-3 text-sm">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {gastosFiltrados.map((g) => (
              <tr key={g.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-500">{new Date(g.fecha).toLocaleDateString('es-AR')}</td>
                <td className="px-6 py-4 text-sm text-gray-800">{g.categoria}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{g.descripcion || '-'}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{g.responsable}</td>
                <td className="px-6 py-4 text-sm font-medium text-red-600">${parseFloat(g.monto).toLocaleString('es-AR')}</td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => { setEditando(g); setMostrarFormulario(false) }}
                    className="bg-yellow-100 text-yellow-700 text-xs font-medium px-3 py-1 rounded-full hover:bg-yellow-200"
                  >
                    ✏ Editar
                  </button>
                </td>
              </tr>
            ))}
            {gastosFiltrados.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-400 text-sm">No hay gastos registrados</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}