'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function generarDeviceId() {
  return 'dev_' + Math.random().toString(36).slice(2) + Date.now().toString(36) + Math.random().toString(36).slice(2)
}

function ConfirmarContenido() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [deviceId, setDeviceId] = useState(null)
  const [estado, setEstado] = useState('cargando')
  const [empleadoVinculado, setEmpleadoVinculado] = useState(null)
  const [tipoNegocio, setTipoNegocio] = useState(null)
  const [empleados, setEmpleados] = useState([])
  const [resultado, setResultado] = useState(null)
  const [procesando, setProcesando] = useState(false)
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
          setTipoNegocio(data.tipo_negocio)
          verificarIngreso(data.empleado.id)
          setEstado('vinculado')
        } else {
          setEstado('sin_vincular')
          fetch(`/api/empleados-publico?token=${token}`)
            .then(r => r.json())
            .then(data => {
              if (Array.isArray(data)) {
                setEmpleados(data)
              } else {
                setErrorVinc('DEBUG: ' + JSON.stringify(data))
              }
            })
            .catch(e => setErrorVinc('DEBUG catch: ' + e.message))
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

      if (data.accion === 'salida' && noAlmorzo) {
        try {
          const resComida = await fetch('/api/marcar-comida', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ device_id: deviceId, token }),
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

  if (resultado) {
    return (
      <div className="gp-marcar min-h-screen flex items-center justify-center p-6">
        <div className="gp-card w-full max-w-sm rounded-2xl p-8 text-center">
          <p className="text-6xl mb-4">
            {resultado.accion === 'entrada' ? '✅' :
             resultado.accion === 'salida' ? '👋' :
             resultado.error ? '❌' : '⚠️'}
          </p>

          <p className="gp-titulo text-xl font-bold mb-3">
            {resultado.empleado ? `${resultado.empleado.nombre} ${resultado.empleado.apellido}` : ''}
          </p>

          {resultado.accion === 'entrada' && (
            <>
              <p className="gp-naranja text-2xl font-bold mb-2">¡Buen trabajo!</p>
              <p className="gp-sub text-base">
                Ingreso registrado a las <strong className="gp-titulo">{resultado.hora}</strong>
              </p>
            </>
          )}

          {resultado.accion === 'salida' && (
            <>
              <p className="gp-naranja text-2xl font-bold mb-2">¡Te esperamos mañana!</p>
              <p className="gp-sub text-base">
                Salida a las <strong className="gp-titulo">{resultado.hora}</strong>
              </p>
              <p className="gp-sub text-base">
                <strong className="gp-titulo">{resultado.horas_trabajadas}h</strong> trabajadas
              </p>
              {resultado.comida_ok && (
                <div className="gp-alerta mt-4 rounded-xl py-3 px-4">
                  <p className="text-sm font-semibold">
                    🍴 Sin almuerzo: +0.5h
                    {resultado.horas_totales ? ` · total ${resultado.horas_totales}h` : ''}
                  </p>
                </div>
              )}
            </>
          )}

          {resultado.accion === 'ya_registrado' && (
            <p className="gp-sub text-base">{resultado.mensaje}</p>
          )}

          {resultado.error && (
            <p className="gp-error text-base">{resultado.error}</p>
          )}
        </div>
      </div>
    )
  }

  if (estado === 'cargando') {
    return (
      <div className="gp-marcar min-h-screen flex items-center justify-center p-8">
        <p className="gp-sub">Cargando...</p>
      </div>
    )
  }

  if (estado === 'vinculado') {
    return (
      <div className="gp-marcar min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-sm text-center">
          <div className="gp-avatar w-24 h-24 rounded-full flex items-center justify-center font-bold text-3xl mx-auto mb-5">
            {empleadoVinculado?.nombre?.[0]}{empleadoVinculado?.apellido?.[0]}
          </div>

          <h1 className="gp-titulo text-3xl font-bold mb-1">
            Hola, {empleadoVinculado?.nombre}
          </h1>

          <p className="gp-sub text-base mb-8">
            {yaIngreso ? 'Registrá tu salida' : 'Registrá tu ingreso'}
          </p>

          {yaIngreso && tipoNegocio === 'taller' && (
            <label className="gp-card flex items-center gap-4 rounded-2xl p-5 mb-5 cursor-pointer text-left">
              <input
                type="checkbox"
                checked={noAlmorzo}
                onChange={e => setNoAlmorzo(e.target.checked)}
                className="w-7 h-7 shrink-0"
              />
              <span className="gp-titulo text-base font-semibold leading-tight">
                No almorcé
                <span className="gp-sub block text-sm font-normal">Suma 0.5h al día</span>
              </span>
            </label>
          )}

          <button
            onClick={marcar}
            disabled={procesando}
            className="gp-btn w-full py-5 rounded-2xl font-bold text-xl"
          >
            {procesando ? 'Registrando...' : yaIngreso ? 'Marcar salida' : 'Marcar ingreso'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="gp-marcar min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <h1 className="gp-titulo text-2xl font-bold mb-2 text-center">Vincular este celular</h1>
        <p className="gp-sub text-sm mb-6 text-center">
          Este teléfono todavía no está registrado. Elegí tu nombre y pedile al encargado que ingrese la clave.
        </p>

        <label className="gp-sub block text-sm font-semibold mb-2">Tu nombre</label>
        <select
          value={empleadoElegido}
          onChange={e => setEmpleadoElegido(e.target.value)}
          className="w-full p-4 rounded-xl mb-5"
        >
          <option value="">Elegí tu nombre...</option>
          {empleados.map(e => (
            <option key={e.id} value={e.id}>{e.nombre} {e.apellido}</option>
          ))}
        </select>

        <label className="gp-sub block text-sm font-semibold mb-2">Clave del encargado</label>
        <input
          type="password"
          value={claveAdmin}
          onChange={e => setClaveAdmin(e.target.value)}
          placeholder="La ingresa el encargado"
          className="w-full p-4 rounded-xl mb-5"
        />

        {errorVinc && (
          <p className="gp-error text-sm mb-4">{errorVinc}</p>
        )}

        <button
          onClick={vincular}
          disabled={procesando}
          className="gp-btn w-full py-4 rounded-xl font-bold text-lg"
        >
          {procesando ? 'Vinculando...' : 'Vincular celular'}
        </button>
      </div>
    </div>
  )
}

export default function Confirmar() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p>Cargando...</p></div>}>
      <ConfirmarContenido />
    </Suspense>
  )
}