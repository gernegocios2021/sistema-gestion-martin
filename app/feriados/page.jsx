'use client'

import { useState, useEffect } from 'react'

export default function Feriados() {
  const [feriados, setFeriados] = useState([])
  const [fecha, setFecha] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [mensaje, setMensaje] = useState('')

  useEffect(() => {
    cargar()
  }, [])

  async function cargar() {
    const res = await fetch('/api/feriados')
    const data = await res.json()
    setFeriados(data)
  }

  async function agregar() {
    if (!fecha) {
      setMensaje('Elegí una fecha.')
      setTimeout(() => setMensaje(''), 3000)
      return
    }
    const res = await fetch('/api/feriados', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fecha, descripcion })
    })
    if (res.ok) {
      setFecha('')
      setDescripcion('')
      setMensaje('✓ Feriado agregado')
      cargar()
      setTimeout(() => setMensaje(''), 3000)
    }
  }

  async function eliminar(fechaEliminar) {
    if (!confirm('¿Eliminar este feriado?')) return
    const res = await fetch('/api/feriados', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fecha: fechaEliminar })
    })
    if (res.ok) {
      cargar()
    }
  }

  function formatearFecha(f) {
    const [anio, mes, dia] = f.split('T')[0].split('-')
    return `${dia}/${mes}/${anio}`
  }

  return (
    <div className="p-4 sm:p-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Feriados</h1>
      <p className="text-xs text-gray-500 mb-6">
        Los feriados cargados acá se usan en la Liquidación de Sueldos: si un empleado no trabaja ese día, se le paga igual;
        si trabaja, se le paga el doble de esas horas.
      </p>

      {mensaje && <p className="mb-4 text-sm font-medium text-green-600">{mensaje}</p>}

      <div className="bg-white rounded-xl shadow p-4 sm:p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Agregar feriado</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="border rounded-lg px-4 py-2 text-sm text-gray-800 bg-white"
          />
          <input
            type="text"
            placeholder="Descripción (ej: Día de la Independencia)"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            className="border rounded-lg px-4 py-2 text-sm text-gray-800 bg-white flex-1"
          />
          <button
            onClick={agregar}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-blue-700 whitespace-nowrap"
          >
            + Agregar
          </button>
        </div>
      </div>

      <div className="overflow-x-auto bg-white rounded-xl shadow">
        <table className="w-full min-w-[400px]">
          <thead className="bg-gray-800 text-white">
            <tr>
              <th className="text-left px-6 py-3 text-sm">Fecha</th>
              <th className="text-left px-6 py-3 text-sm">Descripción</th>
              <th className="text-left px-6 py-3 text-sm">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {feriados.map((f) => (
              <tr key={f.fecha} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-800">{formatearFecha(f.fecha)}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{f.descripcion || '-'}</td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => eliminar(f.fecha.split('T')[0])}
                    className="bg-red-100 text-red-600 text-xs font-medium px-3 py-1 rounded-full hover:bg-red-200"
                  >
                    🗑 Eliminar
                  </button>
                </td>
              </tr>
            ))}
            {feriados.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-gray-400 text-sm">No hay feriados cargados</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}