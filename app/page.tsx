'use client'

import { useState, useEffect } from 'react'
import DashboardPanaderia from '@/app/modules/dashboard/panaderia/page-panaderia-dashboard'

// Importar el componente original (lo mantenemos inline por ahora)
function DashboardTaller() {
  const [datos, setDatos] = useState({
    ventas_dia: 0,
    stock_bajo: 0,
    presupuestos_pendientes: 0,
    empleados_presentes: 0
  })

  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(data => setDatos(data))
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* ... resto del código original ... */}
        <div className="bg-white rounded-lg p-6 shadow">
          <p className="text-sm text-gray-500">Ventas del día</p>
          <p className="text-2xl font-bold text-blue-600">${parseFloat(datos.ventas_dia).toLocaleString('es-AR')}</p>
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const [tipoNegocio, setTipoNegocio] = useState(null)

  useEffect(() => {
    fetch('/api/negocio/tipo')
      .then(r => r.json())
      .then(data => setTipoNegocio(data.tipo_negocio))
  }, [])

  if (!tipoNegocio) return <div className="p-8">Cargando...</div>

  return tipoNegocio === 'panaderia' ? <DashboardPanaderia /> : <DashboardTaller />
}