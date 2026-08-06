'use client'

import { useState, useEffect } from 'react'

export default function DashboardPanaderia() {
  const [datos, setDatos] = useState({
    ventas_dia: 0,
    empleados_presentes: 0
  })

  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(data => setDatos(data))
  }, [])

  const ventasFormato = `$${parseFloat(datos.ventas_dia).toLocaleString('es-AR')}`

  return (
    <div className="p-8 bg-gradient-to-br from-orange-50 to-yellow-50 min-h-screen">
<h1 className="text-3xl font-bold text-orange-900 dark:text-white mb-8">🥐 Panadería</h1>      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Ventas del día - BIG */}
        <div className="bg-white rounded-lg shadow-lg p-8 border-l-4 border-orange-600">
          <p className="text-sm text-gray-600 mb-2">Hoy vendiste</p>
          <p className="text-5xl font-bold text-orange-700">{ventasFormato}</p>
        </div>

        {/* Empleados presentes */}
        <div className="bg-white rounded-lg shadow-lg p-8 border-l-4 border-green-600">
          <p className="text-sm text-gray-600 mb-2">Empleados presentes</p>
          <p className="text-5xl font-bold text-green-700">{datos.empleados_presentes}</p>
        </div>
      </div>
    </div>
  )
}