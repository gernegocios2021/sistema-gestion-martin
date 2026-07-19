'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'

export default function HorasEmpleado({ params }) {
  const { id } = use(params)
  const [empleado, setEmpleado] = useState(null)
  const [asistencia, setAsistencia] = useState([])
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [nuevo, setNuevo] = useState({ fecha: '', hora_entrada: '', hora_salida: '' })
  const [mensaje, setMensaje] = useState('')

  useEffect(() => {
    cargarDatos()
  }, [])

  async function cargarDatos() {
    const [emp, asis] = await Promise.all([
      fetch(`/api/empleados/${id}`).then(r => r.json()),
      fetch(`/api/asistencia?empleado_id=${id}`).then(r => r.json())
    ])
    setEmpleado(emp)
    setAsistencia(asis)
  }

  async function registrarAsistencia() {
    if (!nuevo.fecha || !nuevo.hora_entrada || !nuevo.hora_salida) {
      setMensaje('Completá todos los campos.')
      return
    }
    const res = await fetch('/api/asistencia', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        empleado_id: parseInt(id),
        fecha: nuevo.fecha,
        hora_entrada: nuevo.hora_entrada,
        hora_salida: nuevo.hora_salida
      })
    })
    if (res.ok) {
      setMensaje('✓ Asistencia registrada')
      setNuevo({ fecha: '', hora_entrada: '', hora_salida: '' })
      setMostrarFormulario(false)
      cargarDatos()
      setTimeout(() => setMensaje(''), 3000)
    }
  }

  // Muestra la fecha tal como viene de la base, sin que JS la corra por zona horaria
  function formatearFecha(f) {
    return String(f).slice(0, 10).split('-').reverse().join('/')
  }

  const totalHoras = asistencia.reduce((sum, a) => sum + parseFloat(a.horas_trabajadas || 0), 0)
  const diasConComida = asistencia.filter(a => a.comida_marcada).length

  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/empleados" className="text-blue-600 hover:underline text-sm">← Volver</Link>
        <h1 className="text-2xl font-bold text-gray-800">
          {empleado ? `${empleado.nombre} ${empleado.apellido}` : 'Cargando...'}
        </h1>
      </div>

      {empleado && (
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div><span className="text-gray-500">Cargo:</span> <span className="font-medium text-gray-800">{empleado.cargo || '-'}</span></div>
            <div><span className="text-gray-500">DNI:</span> <span className="font-medium text-gray-800">{empleado.dni || '-'}</span></div>
            <div><span className="text-gray-500">Ingreso:</span> <span className="font-medium text-gray-800">{empleado.fecha_ingreso ? formatearFecha(empleado.fecha_ingreso) : '-'}</span></div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow p-6 text-center">
          <p className="text-sm text-gray-500 mb-1">Total horas mes</p>
          <p className="text-3xl font-bold text-blue-600">{totalHoras.toFixed(1)}h</p>
        </div>
        <div className="bg-white rounded-xl shadow p-6 text-center">
          <p className="text-sm text-gray-500 mb-1">Días trabajados</p>
          <p className="text-3xl font-bold text-green-600">{asistencia.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-6 text-center">
          <p className="text-sm text-gray-500 mb-1">Promedio diario</p>
          <p className="text-3xl font-bold text-purple-600">
            {asistencia.length > 0 ? (totalHoras / asistencia.length).toFixed(1) : 0}h
          </p>
        </div>
        <div className="bg-white rounded-xl shadow p-6 text-center">
          <p className="text-sm text-gray-500 mb-1">Días con comida</p>
          <p className="text-3xl font-bold" style={{ color: '#f97316' }}>{diasConComida}</p>
          <p className="text-xs text-gray-500 mt-1">+{(diasConComida * 0.5).toFixed(1)}h en total</p>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-700">Registro de asistencia</h2>
        <button
          onClick={() => setMostrarFormulario(!mostrarFormulario)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
        >
          + Registrar día
        </button>
      </div>

      {mensaje && <p className="mb-4 text-green-600 text-sm font-medium">{mensaje}</p>}

      {mostrarFormulario && (
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h3 className="text-md font-semibold text-gray-700 mb-4">Nuevo registro</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Fecha</label>
              <input className="border rounded-lg px-4 py-2 text-sm text-gray-800 bg-white w-full" type="date" value={nuevo.fecha} onChange={(e) => setNuevo({ ...nuevo, fecha: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Hora entrada</label>
              <input className="border rounded-lg px-4 py-2 text-sm text-gray-800 bg-white w-full" type="time" value={nuevo.hora_entrada} onChange={(e) => setNuevo({ ...nuevo, hora_entrada: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Hora salida</label>
              <input className="border rounded-lg px-4 py-2 text-sm text-gray-800 bg-white w-full" type="time" value={nuevo.hora_salida} onChange={(e) => setNuevo({ ...nuevo, hora_salida: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={registrarAsistencia} className="bg-green-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-green-700">Guardar</button>
            <button onClick={() => setMostrarFormulario(false)} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg text-sm hover:bg-gray-300">Cancelar</button>
          </div>
        </div>
      )}

      <table className="w-full bg-white rounded-xl shadow overflow-hidden">
        <thead className="bg-gray-800 text-white">
          <tr>
            <th className="text-left px-6 py-3 text-sm">Fecha</th>
            <th className="text-left px-6 py-3 text-sm">Entrada</th>
            <th className="text-left px-6 py-3 text-sm">Salida</th>
            <th className="text-left px-6 py-3 text-sm">Horas trabajadas</th>
            <th className="text-left px-6 py-3 text-sm">Comida</th>
          </tr>
        </thead>
        <tbody>
          {asistencia.map((a) => (
            <tr key={a.id} className="border-t border-gray-100 hover:bg-gray-50">
              <td className="px-6 py-4 text-sm text-gray-800">{formatearFecha(a.fecha)}</td>
              <td className="px-6 py-4 text-sm text-gray-500">{a.hora_entrada}</td>
              <td className="px-6 py-4 text-sm text-gray-500">{a.hora_salida}</td>
              <td className="px-6 py-4 text-sm font-medium text-blue-600">{parseFloat(a.horas_trabajadas).toFixed(1)}h</td>
              <td className="px-6 py-4 text-sm">
                {a.comida_marcada ? (
                  <span
                    className="inline-block px-3 py-1 rounded-full text-xs font-bold"
                    style={{ backgroundColor: '#f97316', color: '#ffffff' }}
                  >
                    🍴 +0.5h
                  </span>
                ) : (
                  <span className="text-gray-400 text-xs">—</span>
                )}
              </td>
            </tr>
          ))}
          {asistencia.length === 0 && (
            <tr>
              <td colSpan={5} className="px-6 py-8 text-center text-gray-400 text-sm">No hay registros de asistencia</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}