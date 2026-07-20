'use client'

import { useState, useEffect, use } from 'react'

// Genera un código único y aleatorio para identificar este celular
function generarDeviceId() {
  return 'dev_' + Math.random().toString(36).slice(2) + Date.now().toString(36) + Math.random().toString(36).slice(2)
}

export default function Confirmar({ searchParams }) {
  const { token } = use(searchParams)

  const [deviceId, setDeviceId] = useState(null)
  const [estado, setEstado] = useState('cargando')
  const [empleadoVinculado, setEmpleadoVinculado] = useState(null)
  const [empleados, setEmpleados] = useState([])
  const [resultado, setResultado] = useState(null)
  const [procesando, setProcesando] = useState(false)
  const [marcandoComida, setMarcandoComida] = useState(false)
  const [resultadoComida, setResultadoComida] = useState(null)
  const [yaIngreso, setYaIngreso] = useState(false)
  const [noAlmorzo, setNoAlmorzo] = useState(false)

  const [empleadoElegido, setEmpleadoElegido] = useState('')
  const [claveAdmin, setClaveAdmin] = useState('')
  const [errorVinc, setErrorVinc] = useState(null)

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

  async function verificarIngreso(empleadoId) {
    try {
      const res = await fetch(`/api/check-ingreso?empleado_id=${empleadoId}`)
      const data = await res.json()
      setYaIngreso(data.ya_ingreso)
    } catch (e) {
      console.log('Error verificando ingreso')
    }
  }

  async function marcar() {
    setProcesando(true)
    try {
      const res = await fetch('/api/marcar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ device_id: deviceId, token }),
      })
      const data = await res.json()
      setResultado({ ...data, empleado: empleadoVinculado })
      setResultadoComida(null)

      // Si es salida y tiene marcado "No almorcé", marcar comida automáticamente
      if (data.accion === 'salida' && noAlmorzo) {
        setTimeout(() => marcarComida(), 500)
      }

      // Actualizar estado después de marcar
      if (data.accion === 'entrada') {
        setYaIngreso(true)
      } else if (data.accion === 'salida') {
        setYaIngreso(false)
      }
    } catch (e) {
      setResultado({ error: 'Error de conexión' })
    } finally {
      setProcesando(false)
    }
  }

  async function marcarComida() {
    setMarcandoComida(true)
    try {
      const res = await fetch('/api/marcar-comida', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ device_id: deviceId }),
      })
      const data = await res.json()
      setResultadoComida(data)
      setNoAlmorzo(false)
    } catch (e) {
      setResultadoComida({ error: 'Error de conexión' })
    } finally {
      setMarcandoComida(false)
    }
  }

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

  if (resultadoComida) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <div className={`rounded-2xl p-8 text-center max-w-sm w-full ${
          resultadoComida.success ? 'bg-orange-50 border-2 border-orange-400' :
          'bg-red-50 border-2 border-red-400'
        }`}>
          <p className="text-6xl mb-4">
            {resultadoComida.success ? '🍴' : '❌'}
          </p>
          <p className="text-lg font-bold text-gray-800 mb-2">
            {resultadoComida.mensaje || resultadoComida.error}
          </p>
          {resultadoComida.horas_totales && (
            <p className="text-sm text-gray-600">
              Total del día: <strong>{resultadoComida.horas_totales}h</strong>
            </p>
          )}
        </div>
      </div>
    )
  }

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
          <p className="text-xl font-bold text-gray-800 mb-2">
            {resultado.empleado ? `${resultado.empleado.nombre} ${resultado.empleado.apellido}` : ''}
          </p>
          <p className="text-lg font-medium text-gray-600 mb-6">
            {resultado.accion === 'entrada' && `Entrada registrada a las ${resultado.hora} ✓`}
            {resultado.accion === 'salida' && `Salida registrada a las ${resultado.hora} — ${resultado.horas_trabajadas}h trabajadas`}
            {resultado.accion === 'ya_registrado' && resultado.mensaje}
            {resultado.error && resultado.error}
          </p>

          {resultado.accion === 'salida' && (
            <>
              <button
                onClick={marcarComida}
                disabled={marcandoComida}
                className="w-full py-4 rounded-xl bg-orange-500 text-white font-bold text-base hover:bg-orange-600 disabled:bg-gray-300 transition"
              >
                {marcandoComida ? 'Procesando...' : '🍴 No almorcé (+0.5h)'}
              </button>
              <p className="text-xs text-gray-500 mt-3">
                Tocá solo si trabajaste en obra y no almorzaste
              </p>
            </>
          )}
        </div>
      </div>
    )
  }

  if (estado === 'cargando') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <p className="text-gray-500">Cargando...</p>
      </div>
    )
  }

  if (estado === 'vinculado') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-sm w-full text-center">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-2xl mx-auto mb-6">
            {empleadoVinculado?.nombre?.[0]}{empleadoVinculado?.apellido?.[0]}
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Hola, {empleadoVinculado?.nombre}
          </h1>
          <p className="text-sm text-gray-600 mb-8">
            {yaIngreso ? 'Tocá el botón para registrar tu salida' : 'Tocá el botón para registrar tu ingreso'}
          </p>

          {yaIngreso && (
            <div className="bg-white rounded-lg p-4 mb-6 text-left border border-gray-200">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={noAlmorzo}
                  onChange={(e) => setNoAlmorzo(e.target.checked)}
                  className="w-5 h-5"
                />
                <span className="text-sm font-medium text-gray-700">No almorcé (+0.5h)</span>
              </label>
            </div>
          )}

          <button
            onClick={marcar}
            disabled={procesando}
            className="w-full py-4 rounded-xl bg-blue-600 text-white font-bold text-lg hover:bg-blue-700 disabled:bg-gray-300"
          >
            {procesando ? 'Registrando...' : 'Marcar'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-sm w-full">
        <h1 className="text-2xl font-bold text-gray-800 mb-1 text-center">Vincular este celular</h1>
        <p className="text-sm text-gray-500 mb-6 text-center">
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