'use client'

import { useState, useEffect } from 'react'

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

export default function Liquidacion() {
  const hoy = new Date()
  const [anio, setAnio] = useState(hoy.getFullYear())
  const [mes, setMes] = useState(hoy.getMonth() + 1)
  const [datos, setDatos] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [mensaje, setMensaje] = useState('')

  useEffect(() => {
    consultar()
  }, [])

  async function consultar() {
    setCargando(true)
    setMensaje('')
    try {
      const res = await fetch(`/api/liquidacion?anio=${anio}&mes=${mes}`)
      const data = await res.json()
      if (res.ok) {
        setDatos(data)
      } else {
        setMensaje(data.error || 'Error al calcular')
        setDatos(null)
      }
    } catch (e) {
      setMensaje('Error de conexión')
    } finally {
      setCargando(false)
    }
  }

  function formatearMoneda(v) {
    return `$${Number(v || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
  }

  const totalAPagar = datos ? datos.empleados.reduce((sum, e) => sum + Number(e.sueldo_a_pagar), 0) : 0

  return (
    <div className="p-4 sm:p-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Liquidación de Sueldos</h1>

      <div className="bg-white rounded-xl shadow p-4 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <select
            value={mes}
            onChange={(e) => setMes(Number(e.target.value))}
            className="border rounded-lg px-4 py-2 text-sm text-gray-800 bg-white"
          >
            {MESES.map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </select>
          <input
            type="number"
            value={anio}
            onChange={(e) => setAnio(Number(e.target.value))}
            className="border rounded-lg px-4 py-2 text-sm text-gray-800 bg-white w-28"
          />
          <button
            onClick={consultar}
            disabled={cargando}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:bg-gray-300"
          >
            {cargando ? 'Calculando...' : 'Calcular'}
          </button>
        </div>
      </div>

      {mensaje && <p className="mb-4 text-sm font-medium text-red-600">{mensaje}</p>}

      {datos && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="bg-white rounded-xl shadow p-4">
              <p className="text-xs text-gray-500">Días laborables</p>
              <p className="text-lg font-bold text-gray-800">{datos.dias_laborables}</p>
            </div>
            <div className="bg-white rounded-xl shadow p-4">
              <p className="text-xs text-gray-500">Horas esperadas/mes</p>
              <p className="text-lg font-bold text-gray-800">{datos.horas_esperadas_mes}</p>
            </div>
            <div className="bg-white rounded-xl shadow p-4">
              <p className="text-xs text-gray-500">Feriados en el mes</p>
              <p className="text-lg font-bold text-gray-800">{datos.feriados_del_mes.length}</p>
            </div>
            <div className="bg-white rounded-xl shadow p-4">
              <p className="text-xs text-gray-500">Total a pagar</p>
              <p className="text-lg font-bold text-green-600">{formatearMoneda(totalAPagar)}</p>
            </div>
          </div>

          <div className="overflow-x-auto bg-white rounded-xl shadow">
            <table className="w-full min-w-[860px] text-xs">
              <thead className="bg-gray-800 text-white">
                <tr>
                  <th className="text-left px-3 py-2 font-medium whitespace-nowrap">Empleado</th>
                  <th className="text-left px-3 py-2 font-medium whitespace-nowrap">Sueldo mensual</th>
                  <th className="text-left px-3 py-2 font-medium whitespace-nowrap">Valor hora</th>
                  <th className="text-left px-3 py-2 font-medium whitespace-nowrap">Hs normales</th>
                  <th className="text-left px-3 py-2 font-medium whitespace-nowrap">Hs feriado (x2)</th>
                  <th className="text-left px-3 py-2 font-medium whitespace-nowrap">Feriados no trab.</th>
                  <th className="text-left px-3 py-2 font-medium whitespace-nowrap">Hs pagables</th>
                  <th className="text-left px-3 py-2 font-medium whitespace-nowrap">A pagar</th>
                </tr>
              </thead>
              <tbody>
                {datos.empleados.map((e) => (
                  <tr key={e.empleado_id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-3 py-1.5 text-gray-800 whitespace-nowrap">{e.nombre} {e.apellido}</td>
                    <td className="px-3 py-1.5 text-gray-500 whitespace-nowrap">{formatearMoneda(e.sueldo_mensual)}</td>
                    <td className="px-3 py-1.5 text-gray-500 whitespace-nowrap">{formatearMoneda(e.valor_hora)}</td>
                    <td className="px-3 py-1.5 text-gray-700 whitespace-nowrap">{e.horas_normales.toFixed(1)}</td>
                    <td className="px-3 py-1.5 text-gray-700 whitespace-nowrap">{e.horas_feriados_trabajados.toFixed(1)}</td>
                    <td className="px-3 py-1.5 text-gray-700 whitespace-nowrap">{e.feriados_no_trabajados}</td>
                    <td className="px-3 py-1.5 text-gray-700 whitespace-nowrap">{e.horas_pagables.toFixed(1)}</td>
                    <td className="px-3 py-1.5 font-medium text-green-600 whitespace-nowrap">{formatearMoneda(e.sueldo_a_pagar)}</td>
                  </tr>
                ))}
                {datos.empleados.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-3 py-8 text-center text-gray-400">No hay empleados activos</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}