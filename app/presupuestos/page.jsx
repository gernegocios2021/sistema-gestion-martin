'use client'

import { useState, useEffect } from 'react'

const ESTADOS = ['enviado', 'aceptado', 'rechazado', 'vencido', 'convertido']

const colorEstado = {
  enviado: 'bg-yellow-100 text-yellow-700',
  aceptado: 'bg-green-100 text-green-700',
  rechazado: 'bg-red-100 text-red-600',
  vencido: 'bg-gray-100 text-gray-500',
  convertido: 'bg-blue-100 text-blue-600',
}

export default function Presupuestos() {
  const [presupuestos, setPresupuestos] = useState([])
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [cambiandoEstado, setCambiandoEstado] = useState(null)
  const [nuevo, setNuevo] = useState({ cliente: '', descripcion: '', monto: '', observaciones: '' })
  const [mensaje, setMensaje] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')

  useEffect(() => {
    cargarPresupuestos()
  }, [])

  async function cargarPresupuestos() {
    const res = await fetch('http:///api/presupuestos')
    const data = await res.json()
    setPresupuestos(data)
  }

  async function agregarPresupuesto() {
    if (!nuevo.cliente || !nuevo.monto) {
      setMensaje('Cliente y monto son obligatorios.')
      return
    }
    const res = await fetch('http:///api/presupuestos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cliente: nuevo.cliente,
        descripcion: nuevo.descripcion,
        monto: parseFloat(nuevo.monto),
        observaciones: nuevo.observaciones
      })
    })
    if (res.ok) {
      setMensaje('✓ Presupuesto registrado')
      setNuevo({ cliente: '', descripcion: '', monto: '', observaciones: '' })
      setMostrarFormulario(false)
      cargarPresupuestos()
      setTimeout(() => setMensaje(''), 3000)
    }
  }

  async function cambiarEstado(id, estado) {
    const res = await fetch('http:///api/presupuestos', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, estado, observaciones: '' })
    })
    if (res.ok) {
      setCambiandoEstado(null)
      cargarPresupuestos()
    }
  }

  const presupuestosFiltrados = filtroEstado
    ? presupuestos.filter(p => p.estado === filtroEstado)
    : presupuestos

  const totales = ESTADOS.reduce((acc, e) => {
    acc[e] = presupuestos.filter(p => p.estado === e).length
    return acc
  }, {})

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Presupuestos</h1>
        <button
          onClick={() => setMostrarFormulario(!mostrarFormulario)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
        >
          + Nuevo presupuesto
        </button>
      </div>

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        {ESTADOS.map(e => (
          <div key={e} className={`rounded-xl p-4 text-center cursor-pointer ${colorEstado[e]} ${filtroEstado === e ? 'ring-2 ring-offset-1 ring-gray-400' : ''}`} onClick={() => setFiltroEstado(filtroEstado === e ? '' : e)}>
            <p className="text-2xl font-bold">{totales[e] || 0}</p>
            <p className="text-xs capitalize mt-1">{e}</p>
          </div>
        ))}
      </div>

      {mensaje && <p className="mb-4 text-green-600 text-sm font-medium">{mensaje}</p>}

      {mostrarFormulario && (
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Nuevo presupuesto</h2>
          <div className="grid grid-cols-2 gap-4">
            <input className="border rounded-lg px-4 py-2 text-sm text-gray-800 bg-white" placeholder="Cliente" value={nuevo.cliente} onChange={(e) => setNuevo({ ...nuevo, cliente: e.target.value })} />
            <input className="border rounded-lg px-4 py-2 text-sm text-gray-800 bg-white" placeholder="Monto" type="number" value={nuevo.monto} onChange={(e) => setNuevo({ ...nuevo, monto: e.target.value })} />
            <input className="border rounded-lg px-4 py-2 text-sm text-gray-800 bg-white col-span-2" placeholder="Descripción del trabajo" value={nuevo.descripcion} onChange={(e) => setNuevo({ ...nuevo, descripcion: e.target.value })} />
            <input className="border rounded-lg px-4 py-2 text-sm text-gray-800 bg-white col-span-2" placeholder="Observaciones (opcional)" value={nuevo.observaciones} onChange={(e) => setNuevo({ ...nuevo, observaciones: e.target.value })} />
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={agregarPresupuesto} className="bg-green-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-green-700">Guardar</button>
            <button onClick={() => setMostrarFormulario(false)} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg text-sm hover:bg-gray-300">Cancelar</button>
          </div>
        </div>
      )}

      <table className="w-full bg-white rounded-xl shadow overflow-hidden">
        <thead className="bg-gray-800 text-white">
          <tr>
            <th className="text-left px-6 py-3 text-sm">Fecha</th>
            <th className="text-left px-6 py-3 text-sm">Cliente</th>
            <th className="text-left px-6 py-3 text-sm">Descripción</th>
            <th className="text-left px-6 py-3 text-sm">Monto</th>
            <th className="text-left px-6 py-3 text-sm">Estado</th>
            <th className="text-left px-6 py-3 text-sm">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {presupuestosFiltrados.map((p) => (
            <tr key={p.id} className="border-t border-gray-100 hover:bg-gray-50">
              <td className="px-6 py-4 text-sm text-gray-500">{new Date(p.fecha).toLocaleDateString('es-AR')}</td>
              <td className="px-6 py-4 text-sm font-medium text-gray-800">{p.cliente}</td>
              <td className="px-6 py-4 text-sm text-gray-500">{p.descripcion || '-'}</td>
              <td className="px-6 py-4 text-sm font-medium text-green-600">${parseFloat(p.monto).toLocaleString('es-AR')}</td>
              <td className="px-6 py-4">
                {cambiandoEstado === p.id ? (
                  <select
                    className="border rounded-lg px-2 py-1 text-xs text-gray-800 bg-white"
                    defaultValue={p.estado}
                    onChange={(e) => cambiarEstado(p.id, e.target.value)}
                  >
                    {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                ) : (
                  <span className={`text-xs font-medium px-3 py-1 rounded-full capitalize ${colorEstado[p.estado]}`}>
                    {p.estado}
                  </span>
                )}
              </td>
              <td className="px-6 py-4">
                <button
                  onClick={() => setCambiandoEstado(cambiandoEstado === p.id ? null : p.id)}
                  className="bg-yellow-100 text-yellow-700 text-xs font-medium px-3 py-1 rounded-full hover:bg-yellow-200"
                >
                  ✏ Estado
                </button>
              </td>
            </tr>
          ))}
          {presupuestosFiltrados.length === 0 && (
            <tr>
              <td colSpan={6} className="px-6 py-8 text-center text-gray-400 text-sm">No hay presupuestos registrados</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}