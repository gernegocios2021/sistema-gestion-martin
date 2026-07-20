'use client'

import { useState, useEffect, use } from 'react'

// Genera un código único y aleatorio para identificar este celular
function generarDeviceId() {
  return 'dev_' + Math.random().toString(36).slice(2) + Date.now().toString(36) + Math.random().toString(36).slice(2)
}

export default function Confirmar({ searchParams }) {
  const { token } = use(searchParams)

  const [deviceId, setDeviceId] = useState(null)
  const [estado, setEstado] = useState('cargando') // cargando | vinculado | sin_vincular
  const [empleadoVinculado, setEmpleadoVinculado] = useState(null)
  const [empleados, setEmpleados] = useState([])
  const [resultado, setResultado] = useState(null)
  const [procesando, setProcesando] = useState(false)
  const [yaIngreso, setYaIngreso] = useState(false)
  const [noAlmorzo, setNoAlmorzo] = useState(false)

  // Para el formulario de vinculación
  const [empleadoElegido, setEmpleadoElegido] = useState('')
  const [claveAdmin, setClaveAdmin] = useState('')
  const [errorVinc, setErrorVinc] = useState(null)

  // 1. Al abrir: obtener (o crear) el device_id y consultar si está vinculado
  useEffect(() => {
    let id = localStorage.getItem('device_id')
    if (!id) {
      id = generarDeviceId()
      localStorage.setItem('device_id', id)
    }
    setDeviceId(id)

    fetch('/api/dispositivo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ device_id: id }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.vinculado) {
          setEmpleadoVinculado(data.empleado)
          verificarIngreso(data.empleado.id)
          setEstado('vinculado')
        } else {
          setEstado('sin_vincular')
          fetch('/api/empleados').then(r => r.json()).then(setEmpleados)
        }
      })
      .catch(() => setEstado('sin_vincular'))
  }, [])

  // 2. Consultar si ya tiene entrada sin salida hoy
  async function verificarIngreso(empleadoId) {
    try {
      const res = await fetch(`/api/check-ingreso?empleado_id=${empleadoId}`)
      const data = await res.json()
      setYaIngreso(data.ya_ingreso)
    } catch (e) {
      console.log('Error verificando ingreso')
    }
  }

  // 3. Marcar entrada/salida (y comida si corresponde)
  async function marcar() {
    setProcesando(true)
    try {
      const res = await fetch('/api/marcar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ device_id: deviceId, token }),
      })
      const data = await res.json()

      // Si marcó salida y tildó "No almorcé", sumamos la media hora
      if (data.accion === 'salida' && noAlmorzo) {
        try {
          const resComida = await fetch('/api/marcar-comida', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ device_id: deviceId }),
          })
          const dataComida = await resComida.json()
          data.comida_ok = dataComida.success
          data.horas_totales = dataComida.horas_totales
        } catch (e) {
          console.log('Error marcando comida')
        }
      }

      setResultado({ ...data, empleado: empleadoVinculado })

      if (data.accion === 'entrada') setYaIngreso(true)
      if (data.accion === 'salida') setYaIngreso(false)
    } catch (e) {
      setResultado({ error: 'Error de conexión' })
    } finally {
      setProcesando(false)
    }
  }

  // 4. Vincular este celular a un empleado
  async function vincular() {
    setErrorVinc(null)
    if (!empleadoElegido) { setErrorVinc('Elegí tu nombre'); return }
    if (!claveAdmin) { setErrorVinc('Falta la clave del encargado'); return }

    setProcesando(true)
    try {
      const res = await fetch('/api/vincular', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device_id: deviceId,
          empleado_id: Number(empleadoElegido),
          clave_admin: claveAdmin,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErrorVinc(data.error || 'No se pudo vincular')
        return
      }
      const emp = empleados.find(e => e.id === Number(empleadoElegido))
      setEmpleadoVinculado(emp ? { id: emp.id, nombre: emp.nombre, apellido: emp.apellido } : null)
      verificarIngreso(Number(empleadoElegido))
      setEstado('vinculado')
    } catch (e) {
      setErrorVinc('Error de conexión')
    } finally {
      setProcesando(false)
    }
  }

  // ----- PANTALLA: resultado de marcar -----
  if (resultado) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <div className={`rounded-2xl p-8 text-center max-w-sm w-full ${
          resultado.accion === 'entrada' ? 'bg-green-50 border-2 border-green-400' :
          resultado.accion === 'salida' ? 'bg-blue-50 border-2 border-blue-400' :
          resultado.error ? 'bg-red-50 border-2 border-red-400' :
          'bg-yellow-50 border-2 border-yellow-400'
        }`}>
          <p className="text-6xl mb-4">
            {resultado.accion === 'entrada' ? '✅' :
             resultado.accion === 'salida' ? '👋' :
             resultado.error ? '❌' : '⚠️'}
          </p>

          <p className="text-xl font-bold text-gray-900 mb-2">
            {resultado.empleado ? `${resultado.empleado.nombre} ${resultado.empleado.apellido}` : ''}
          </p>

          {resultado.accion === 'entrada' && (
            <p className="text-lg font-medium text-gray-700">
              Ingreso registrado a las {resultado.hora}
            </p>
          )}

          {resultado.accion === 'salida' && (
            <>
              <p className="text-2xl font-bold text-gray-900 mb-2">
                ¡Te esperamos mañana!
              </p>
              <p className="text-base text-gray-700">
                Salida registrada a las {resultado.hora} — {resultado.horas_trabajadas}h trabajadas
              </p>
              {resultado.comida_ok && (
                <p className="text-sm font-medium text-orange-600 mt-3">
                  🍴 Sin almuerzo: +0.5h
                  {resultado.horas_totales ? ` (total ${resultado.horas_totales}h)` : ''}
                </p>
              )}
            </>
          )}

          {resultado.accion === 'ya_registrado' && (
            <p className="text-lg font-medium text-gray-700">{resultado.mensaje}</p>
          )}

          {resultado.error && (
            <p className="text-lg font-medium text-gray-700">{resultado.error}</p>
          )}
        </div>
      </div>
    )
  }

  // ----- PANTALLA: cargando -----
  if (estado === 'cargando') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <p className="text-gray-500">Cargando...</p>
      </div>
    )
  }

  // ----- PANTALLA: celular vinculado, listo para marcar -----
  if (estado === 'vinculado') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-sm w-full text-center">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-2xl mx-auto mb-4">
            {empleadoVinculado?.nombre?.[0]}{empleadoVinculado?.apellido?.[0]}
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Hola, {empleadoVinculado?.nombre}
          </h1>

          <p className="text-sm text-gray-600 mb-6">
            {yaIngreso ? 'Registrá tu salida' : 'Registrá tu ingreso'}
          </p>

          {/* CHECKBOX: solo aparece cuando va a marcar salida */}
          {yaIngreso && (
            <label className="flex items-center gap-3 bg-white border-2 border-gray-300 rounded-xl p-4 mb-4 cursor-pointer text-left">
              <input
                type="checkbox"
                checked={noAlmorzo}
                onChange={e => setNoAlmorzo(e.target.checked)}
                className="w-6 h-6 accent-orange-500"
              />
              <span className="text-sm font-medium text-gray-900">
                No almorcé (+0.5h)
              </span>
            </label>
          )}

          <button
            onClick={marcar}
            disabled={procesando}
            className={`w-full py-4 rounded-xl text-white font-bold text-lg disabled:bg-gray-300 ${
              yaIngreso ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {procesando ? 'Registrando...' : yaIngreso ? 'Marcar salida' : 'Marcar ingreso'}
          </button>
        </div>
      </div>
    )
  }

  // ----- PANTALLA: celular sin vincular, alta inicial -----
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-sm w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-1 text-center">Vincular este celular</h1>
        <p className="text-sm text-gray-600 mb-6 text-center">
          Este teléfono todavía no está registrado. Elegí tu nombre y pedile al encargado que ingrese la clave.
        </p>

        <label className="block text-sm font-medium text-gray-700 mb-1">Tu nombre</label>
        <select
          value={empleadoElegido}
          onChange={e => setEmpleadoElegido(e.target.value)}
          className="w-full p-3 border rounded-xl mb-4 bg-white text-gray-800"
        >
          <option value="" className="text-gray-800">Elegí tu nombre...</option>
          {empleados.map(e => (
            <option key={e.id} value={e.id} className="text-gray-800">{e.nombre} {e.apellido}</option>
          ))}
        </select>

        <label className="block text-sm font-medium text-gray-700 mb-1">Clave del encargado</label>
        <input
          type="password"
          value={claveAdmin}
          onChange={e => setClaveAdmin(e.target.value)}
          placeholder="La ingresa el encargado"
          className="w-full p-3 border rounded-xl mb-4 bg-white text-gray-800"
        />

        {errorVinc && (
          <p className="text-red-600 text-sm mb-4">{errorVinc}</p>
        )}

        <button
          onClick={vincular}
          disabled={procesando}
          className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 disabled:bg-gray-300"
        >
          {procesando ? 'Vinculando...' : 'Vincular celular'}
        </button>
      </div>
    </div>
  )
}