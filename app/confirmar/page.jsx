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
      <div className="min-h-screen bg-[#0f1c2e] flex items-center justify-center p-6">
        <div className="w-full max-w-sm bg-[#16273d] border border-white/10 rounded-2xl p-8 text-center shadow-xl">
          <p className="text-6xl mb-4">
            {resultado.accion === 'entrada' ? '✅' :
             resultado.accion === 'salida' ? '👋' :
             resultado.error ? '❌' : '⚠️'}
          </p>

          <p className="text-xl font-bold text-white mb-3">
            {resultado.empleado ? `${resultado.empleado.nombre} ${resultado.empleado.apellido}` : ''}
          </p>

          {resultado.accion === 'entrada' && (
            <>
              <p className="text-2xl font-bold text-orange-400 mb-2">
                ¡Buen trabajo!
              </p>
              <p className="text-base text-slate-200">
                Ingreso registrado a las <strong className="text-white">{resultado.hora}</strong>
              </p>
            </>
          )}

          {resultado.accion === 'salida' && (
            <>
              <p className="text-2xl font-bold text-orange-400 mb-2">
                ¡Te esperamos mañana!
              </p>
              <p className="text-base text-slate-200">
                Salida a las <strong className="text-white">{resultado.hora}</strong>
              </p>
              <p className="text-base text-slate-200">
                <strong className="text-white">{resultado.horas_trabajadas}h</strong> trabajadas
              </p>
              {resultado.comida_ok && (
                <div className="mt-4 bg-orange-500/15 border border-orange-500/40 rounded-xl py-3 px-4">
                  <p className="text-sm font-semibold text-orange-300">
                    🍴 Sin almuerzo: +0.5h
                    {resultado.horas_totales ? ` · total ${resultado.horas_totales}h` : ''}
                  </p>
                </div>
              )}
            </>
          )}

          {resultado.accion === 'ya_registrado' && (
            <p className="text-base text-slate-200">{resultado.mensaje}</p>
          )}

          {resultado.error && (
            <p className="text-base text-red-300">{resultado.error}</p>
          )}
        </div>
      </div>
    )
  }

  // ----- PANTALLA: cargando -----
  if (estado === 'cargando') {
    return (
      <div className="min-h-screen bg-[#0f1c2e] flex items-center justify-center p-8">
        <p className="text-slate-300">Cargando...</p>
      </div>
    )
  }

  // ----- PANTALLA: celular vinculado, listo para marcar -----
  if (estado === 'vinculado') {
    return (
      <div className="min-h-screen bg-[#0f1c2e] flex items-center justify-center p-6">
        <div className="w-full max-w-sm text-center">
          <div className="w-24 h-24 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-3xl mx-auto mb-5 shadow-lg">
            {empleadoVinculado?.nombre?.[0]}{empleadoVinculado?.apellido?.[0]}
          </div>

          <h1 className="text-3xl font-bold text-white mb-1">
            Hola, {empleadoVinculado?.nombre}
          </h1>

          <p className="text-base text-slate-300 mb-8">
            {yaIngreso ? 'Registrá tu salida' : 'Registrá tu ingreso'}
          </p>

          {/* CHECKBOX: solo aparece cuando va a marcar salida */}
          {yaIngreso && (
            <label className="flex items-center gap-4 bg-[#16273d] border-2 border-white/15 rounded-2xl p-5 mb-5 cursor-pointer text-left active:border-orange-500 transition">
              <input
                type="checkbox"
                checked={noAlmorzo}
                onChange={e => setNoAlmorzo(e.target.checked)}
                className="w-7 h-7 accent-orange-500 shrink-0"
              />
              <span className="text-base font-semibold text-white leading-tight">
                No almorcé
                <span className="block text-sm font-normal text-slate-400">Suma 0.5h al día</span>
              </span>
            </label>
          )}

          <button
            onClick={marcar}
            disabled={procesando}
            className="w-full py-5 rounded-2xl bg-orange-500 text-white font-bold text-xl shadow-lg active:bg-orange-600 disabled:bg-slate-600 disabled:text-slate-400 transition"
          >
            {procesando ? 'Registrando...' : yaIngreso ? 'Marcar salida' : 'Marcar ingreso'}
          </button>
        </div>
      </div>
    )
  }

  // ----- PANTALLA: celular sin vincular, alta inicial -----
  return (
    <div className="min-h-screen bg-[#0f1c2e] flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-white mb-2 text-center">Vincular este celular</h1>
        <p className="text-sm text-slate-300 mb-6 text-center">
          Este teléfono todavía no está registrado. Elegí tu nombre y pedile al encargado que ingrese la clave.
        </p>

        <label className="block text-sm font-semibold text-slate-200 mb-2">Tu nombre</label>
        <select
          value={empleadoElegido}
          onChange={e => setEmpleadoElegido(e.target.value)}
          className="w-full p-4 rounded-xl mb-5 bg-[#16273d] border-2 border-white/15 text-white"
        >
          <option value="" className="bg-[#16273d] text-white">Elegí tu nombre...</option>
          {empleados.map(e => (
            <option key={e.id} value={e.id} className="bg-[#16273d] text-white">{e.nombre} {e.apellido}</option>
          ))}
        </select>

        <label className="block text-sm font-semibold text-slate-200 mb-2">Clave del encargado</label>
        <input
          type="password"
          value={claveAdmin}
          onChange={e => setClaveAdmin(e.target.value)}
          placeholder="La ingresa el encargado"
          className="w-full p-4 rounded-xl mb-5 bg-[#16273d] border-2 border-white/15 text-white placeholder:text-slate-500"
        />

        {errorVinc && (
          <p className="text-red-300 text-sm mb-4">{errorVinc}</p>
        )}

        <button
          onClick={vincular}
          disabled={procesando}
          className="w-full py-4 rounded-xl bg-orange-500 text-white font-bold text-lg active:bg-orange-600 disabled:bg-slate-600 disabled:text-slate-400 transition"
        >
          {procesando ? 'Vinculando...' : 'Vincular celular'}
        </button>
      </div>
    </div>
  )
}