'use client'

import { useState, useEffect } from 'react'

export default function Empleados() {
  const [empleados, setEmpleados] = useState([])
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [nuevo, setNuevo] = useState({ nombre: '', apellido: '', dni: '', cargo: '', fecha_ingreso: '' })
  const [mensaje, setMensaje] = useState('')

  useEffect(() => {
    cargarEmpleados()
  }, [])

  async function cargarEmpleados() {
    const res = await fetch('http://localhost:3000/api/empleados')
    const data = await res.json()
    setEmpleados(data)
  }

  async function agregarEmpleado() {
    if (!nuevo.nombre || !nuevo.apellido) {
      setMensaje('Nombre y apellido son obligatorios.')
      return
    }
    const res = await fetch('http://localhost:3000/api/empleados', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nuevo)
    })
    if (res.ok) {
      setMensaje('✓ Empleado agregado correctamente')
      setNuevo({ nombre: '', apellido: '', dni: '', cargo: '', fecha_ingreso: '' })
      setMostrarFormulario(false)
      cargarEmpleados()
      setTimeout(() => setMensaje(''), 3000)
    }
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Empleados</h1>
        <button
          onClick={() => setMostrarFormulario(!mostrarFormulario)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
        >
          + Agregar empleado
        </button>
      </div>

      {mensaje && <p className="mb-4 text-green-600 text-sm font-medium">{mensaje}</p>}

      {mostrarFormulario && (
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Nuevo empleado</h2>
          <div className="grid grid-cols-2 gap-4">
            <input className="border rounded-lg px-4 py-2 text-sm text-gray-800 bg-white" placeholder="Nombre" value={nuevo.nombre} onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })} />
            <input className="border rounded-lg px-4 py-2 text-sm text-gray-800 bg-white" placeholder="Apellido" value={nuevo.apellido} onChange={(e) => setNuevo({ ...nuevo, apellido: e.target.value })} />
            <input className="border rounded-lg px-4 py-2 text-sm text-gray-800 bg-white" placeholder="DNI" value={nuevo.dni} onChange={(e) => setNuevo({ ...nuevo, dni: e.target.value })} />
            <input className="border rounded-lg px-4 py-2 text-sm text-gray-800 bg-white" placeholder="Cargo" value={nuevo.cargo} onChange={(e) => setNuevo({ ...nuevo, cargo: e.target.value })} />
            <div className="col-span-2">
              <label className="text-xs text-gray-500 mb-1 block">Fecha de ingreso</label>
              <input className="border rounded-lg px-4 py-2 text-sm text-gray-800 bg-white w-full" type="date" value={nuevo.fecha_ingreso} onChange={(e) => setNuevo({ ...nuevo, fecha_ingreso: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={agregarEmpleado} className="bg-green-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-green-700">Guardar</button>
            <button onClick={() => setMostrarFormulario(false)} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg text-sm hover:bg-gray-300">Cancelar</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        {empleados.map((e) => (
          <div key={e.id} className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center gap-4 mb-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-lg">
                {e.nombre[0]}{e.apellido[0]}
              </div>
              <div>
                <p className="font-semibold text-gray-800">{e.nombre} {e.apellido}</p>
                <p className="text-sm text-gray-500">{e.cargo || 'Sin cargo definido'}</p>
              </div>
            </div>
            <div className="text-sm text-gray-500 space-y-1">
              {e.dni && <p>DNI: {e.dni}</p>}
              {e.fecha_ingreso && <p>Ingreso: {new Date(e.fecha_ingreso).toLocaleDateString('es-AR')}</p>}
            </div>
          </div>
        ))}
        {empleados.length === 0 && (
          <div className="col-span-3 text-center py-12 text-gray-400">
            No hay empleados cargados todavía
          </div>
        )}
      </div>
    </div>
  )
}