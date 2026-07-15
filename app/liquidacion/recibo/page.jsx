'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

function ReciboContenido() {
  const searchParams = useSearchParams()
  const empleadoId = searchParams.get('empleado_id')
  const anio = searchParams.get('anio')
  const mes = searchParams.get('mes')

  const [datos, setDatos] = useState(null)
  const [empleado, setEmpleado] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    cargar()
  }, [])

  async function cargar() {
    try {
      const [resLiq, resEmp] = await Promise.all([
        fetch(`/api/liquidacion?anio=${anio}&mes=${mes}`),
        fetch('/api/empleados')
      ])
      const liq = await resLiq.json()
      const empleados = await resEmp.json()

      const emp = empleados.find((e) => String(e.id) === String(empleadoId))
      const datosLiq = liq.empleados?.find((e) => String(e.empleado_id) === String(empleadoId))

      if (!emp || !datosLiq) {
        setError('No se encontraron los datos de este empleado para ese mes.')
      } else {
        setEmpleado(emp)
        setDatos({ ...datosLiq, dias_laborables: liq.dias_laborables, horas_esperadas_mes: liq.horas_esperadas_mes })
      }
    } catch (e) {
      setError('Error al cargar el recibo.')
    } finally {
      setCargando(false)
    }
  }

  function formatearMoneda(v) {
    return `$${Number(v || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
  }

  if (cargando) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400">Cargando recibo...</div>
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 print:bg-white print:py-0">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow p-8 print:shadow-none print:rounded-none">

        <div className="flex justify-between items-start mb-6 no-print">
          <div />
          <button
            onClick={() => window.print()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
          >
            🖨 Imprimir / Guardar PDF
          </button>
        </div>

        <div className="text-center border-b border-gray-200 pb-4 mb-6">
          <h1 className="text-xl font-bold text-gray-800">Recibo de Sueldo</h1>
          <p className="text-sm text-gray-500">Marjavi Vidrios y Aluminios</p>
          <p className="text-sm text-gray-500">{MESES[mes - 1]} {anio}</p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm text-gray-700 mb-6">
          <p><span className="text-gray-500">Empleado:</span> {empleado.nombre} {empleado.apellido}</p>
          <p><span className="text-gray-500">DNI:</span> {empleado.dni || '-'}</p>
          <p><span className="text-gray-500">Cargo:</span> {empleado.cargo || '-'}</p>
          <p><span className="text-gray-500">Fecha de ingreso:</span> {empleado.fecha_ingreso ? new Date(empleado.fecha_ingreso).toLocaleDateString('es-AR') : '-'}</p>
        </div>

        <table className="w-full text-sm mb-6">
          <thead>
            <tr className="border-b border-gray-300 text-left text-gray-500">
              <th className="py-2">Concepto</th>
              <th className="py-2 text-right">Detalle</th>
              <th className="py-2 text-right">Monto</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-100">
              <td className="py-2">Sueldo mensual base</td>
              <td className="py-2 text-right text-gray-500">{datos.horas_esperadas_mes} hs esperadas</td>
              <td className="py-2 text-right">{formatearMoneda(datos.sueldo_mensual)}</td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="py-2">Valor hora</td>
              <td className="py-2 text-right text-gray-500">-</td>
              <td className="py-2 text-right">{formatearMoneda(datos.valor_hora)}</td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="py-2">Horas normales trabajadas</td>
              <td className="py-2 text-right text-gray-500">{datos.horas_normales.toFixed(1)} hs</td>
              <td className="py-2 text-right">{formatearMoneda(datos.horas_normales * datos.valor_hora)}</td>
            </tr>
            {datos.horas_feriados_trabajados > 0 && (
              <tr className="border-b border-gray-100">
                <td className="py-2">Horas en feriado (pagadas doble)</td>
                <td className="py-2 text-right text-gray-500">{datos.horas_feriados_trabajados.toFixed(1)} hs x2</td>
                <td className="py-2 text-right">{formatearMoneda(datos.horas_feriados_trabajados * 2 * datos.valor_hora)}</td>
              </tr>
            )}
            {datos.feriados_no_trabajados > 0 && (
              <tr className="border-b border-gray-100">
                <td className="py-2">Feriados no trabajados (pagados igual)</td>
                <td className="py-2 text-right text-gray-500">{datos.feriados_no_trabajados} día(s)</td>
                <td className="py-2 text-right">{formatearMoneda((datos.horas_pagables - datos.horas_normales - datos.horas_feriados_trabajados * 2) * datos.valor_hora)}</td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="flex justify-between items-center border-t-2 border-gray-800 pt-4">
          <p className="text-lg font-bold text-gray-800">Total a pagar</p>
          <p className="text-2xl font-bold text-green-600">{formatearMoneda(datos.sueldo_a_pagar)}</p>
        </div>

        <div className="mt-12 pt-6 border-t border-gray-200 grid grid-cols-2 gap-8 text-center text-xs text-gray-500">
          <div>
            <div className="border-t border-gray-400 pt-2 mt-8">Firma del empleador</div>
          </div>
          <div>
            <div className="border-t border-gray-400 pt-2 mt-8">Firma del empleado</div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
        }
      `}</style>
    </div>
  )
}

export default function Recibo() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-400">Cargando...</div>}>
      <ReciboContenido />
    </Suspense>
  )
}