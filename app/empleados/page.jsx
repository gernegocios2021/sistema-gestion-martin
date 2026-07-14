'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const CARGOS = ['Carpintero', 'Administrativo', 'Vendedor', 'Producción', 'Otro']

function FormularioEmpleado({ datos, setDatos, onGuardar, onCancelar, titulo, colorBoton }) {
  return (
    <div className="bg-white rounded-xl shadow p-6 mb-6 border-l-4 border-blue-400">
      <h2 className="text-lg font-semibold text-gray-700 mb-4">{titulo}</h2>
      <div className="grid grid-cols-2 gap-4">
        <input className="border rounded-lg px-4 py-2 text-sm text-gray-800 bg-white" placeholder="Nombre" value={datos.nombre} onChange={(e) => setDatos({ ...datos, nombre: e.target.value })} />
        <input className="border rounded-lg px-4 py-2 text-sm text-gray-800 bg-white" placeholder="Apellido" value={datos.apellido} onChange={(e) => setDatos({ ...datos, apellido: e.target.value })} />
        <input className="border rounded-lg px-4 py-2 text-sm text-gray-800 bg-white" placeholder="DNI" value={datos.dni || ''} onChange={(e) => setDatos({ ...datos, dni: e.target.value })} />
        <input className="border rounded-lg px-4 py-2 text-sm text-gray-800 bg-white" placeholder="Cargo" value={datos.cargo || ''} onChange={(e) => setDatos({ ...datos, cargo: e.target.value })} />
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Fecha de ingreso</label>
          <input className="border rounded-lg px-4 py-2 text-sm text-gray-800 bg-white w-full" type="date" value={datos.fecha_ingreso ? datos.fecha_ingreso.split('T')[0] : ''} onChange={(e) => setDatos({ ...datos, fecha_ingreso: e.target.value })} />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Sueldo mensual</label>
          <input className="border rounded-lg px-4 py-2 text-sm text-gray-800 bg-white w-full" type="number" step="any" placeholder="Ej: 800000" value={datos.sueldo_mensual ?? ''} onChange={(e) => setDatos({ ...datos, sueldo_mensual: e.target.value })} />
        </div>
      </div>
      <div className="flex gap-3 mt-4">
        <button onClick={onGuardar} className={`${colorBoton} text-white px-6 py-2 rounded-lg text-sm`}>Guardar</button>
        <button onClick={onCancelar} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg text-sm hover:bg-gray-300">Cancelar</button>
      </div>
    </div>
  )
}

export default function Empleados() {
  const [empleados, setEmpleados] = useState([])
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [editando, setEditando] = useState(null)
  const [nuevo, setNuevo] = useState({ nombre: '', apellido: '', dni: '', cargo: '', fecha_ingreso: '', sueldo_mensual: '' })
  const [mensaje, setMensaje] = useState('')

  useEffect(() => {
    cargarEmpleados()
  }, [])

  async function cargarEmpleados() {
    const res = await fetch('/api/empleados')
    const data = await res.json()
    setEmpleados(data)
  }

  async function agregarEmpleado() {
    if (!nuevo.nombre || !nuevo.apellido) {
      setMensaje('Nombre y apellido son obligatorios.')
      return
    }
    const res = await fetch('/api/empleados', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nuevo)
    })
    if (res.ok) {
      setMensaje('✓ Empleado agregado correctamente')
      setNuevo({ nombre: '', apellido: '', dni: '', cargo: '', fecha_ingreso: '', sueldo_mensual: '' })
      setMostrarFormulario(false)
      cargarEmpleados()
      setTimeout(() => setMensaje(''), 3000)
    }
  }

  async function guardarEdicion() {
    const res = await fetch('/api/empleados', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editando)
    })
    if (res.ok) {
      setMensaje('✓ Empleado actualizado correctamente')
      setEditando(null)
      cargarEmpleados()
      setTimeout(() => setMensaje(''), 3000)
    }
  }

  async function eliminarEmpleado(id, nombre) {
    if (!confirm(`¿Seguro que querés eliminar a ${nombre}?`)) return
    const res = await fetch('/api/empleados', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
    if (res.ok) {
      setMensaje('✓ Empleado eliminado')
      cargarEmpleados()
      setTimeout(() => setMensaje(''), 3000)
    }
  }

  async function desvincularEmpleado(id, nombre) {
    if (!confirm(`¿Desvincular el celular de ${nombre}?\n\nLa próxima vez que escanee el QR tendrá que vincular su celular de nuevo (con la clave del encargado). Útil si cambió de teléfono o renunció.`)) return
    const res = await fetch('/api/desvincular', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ empleado_id: id })
    })
    const data = await res.json()
    if (res.ok) {
      if (data.borrados > 0) {
        setMensaje(`✓ Celular de ${nombre} desvinculado`)
      } else {
        setMensaje(`${nombre} no tenía ningún celular vinculado`)
      }
      setTimeout(() => setMensaje(''), 4000)
    } else {
      setMensaje(data.error || 'No se pudo desvincular')
      setTimeout(() => setMensaje(''), 4000)
    }
  }

  function formatearMoneda(v) {
    if (!v) return null
    return `$${Number(v).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
  }

  return (
    <div className="p-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Empleados</h1>
        <button
          onClick={() => { setMostrarFormulario(!mostrarFormulario); setEditando(null) }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
        >
          + Agregar empleado
        </button>
      </div>

      {mensaje && <p className="mb-4 text-green-600 text-sm font-medium">{mensaje}</p>}

      {mostrarFormulario && (
        <FormularioEmpleado
          datos={nuevo}
          setDatos={setNuevo}
          onGuardar={agregarEmpleado}
          onCancelar={() => setMostrarFormulario(false)}
          titulo="Nuevo empleado"
          colorBoton="bg-green-600 hover:bg-green-700"
        />
      )}

      {editando && (
        <FormularioEmpleado
          datos={editando}
          setDatos={setEditando}
          onGuardar={guardarEdicion}
          onCancelar={() => setEditando(null)}
          titulo="Editar empleado"
          colorBoton="bg-yellow-500 hover:bg-yellow-600"
        />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
            <div className="text-sm text-gray-500 space-y-1 mb-4">
              {e.dni && <p>DNI: {e.dni}</p>}
              {e.fecha_ingreso && <p>Ingreso: {new Date(e.fecha_ingreso).toLocaleDateString('es-AR')}</p>}
              {formatearMoneda(e.sueldo_mensual) && <p>Sueldo mensual: {formatearMoneda(e.sueldo_mensual)}</p>}
            </div>
            <div className="flex gap-2 flex-wrap">
              <Link href={`/empleados/${e.id}`} className="bg-blue-100 text-blue-600 text-xs font-medium px-3 py-1 rounded-full hover:bg-blue-200">
                📋 Ver horas
              </Link>
              <button onClick={() => { setEditando(e); setMostrarFormulario(false) }} className="bg-yellow-100 text-yellow-700 text-xs font-medium px-3 py-1 rounded-full hover:bg-yellow-200">
                ✏ Editar
              </button>
              <button onClick={() => desvincularEmpleado(e.id, e.nombre)} className="bg-orange-100 text-orange-700 text-xs font-medium px-3 py-1 rounded-full hover:bg-orange-200">
                📱 Desvincular
              </button>
              <button onClick={() => eliminarEmpleado(e.id, e.nombre)} className="bg-red-100 text-red-600 text-xs font-medium px-3 py-1 rounded-full hover:bg-red-200">
                🗑 Eliminar
              </button>
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