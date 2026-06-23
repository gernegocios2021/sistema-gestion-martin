'use client'
// Force rebuild
import { useState, useEffect } from 'react'

import { useState, useEffect } from 'react'
import TarjetaResumen from './components/TarjetaResumen'

export default function Home() {
  const [datos, setDatos] = useState({
    ventas_dia: 0,
    stock_bajo: 0,
    presupuestos_pendientes: 0,
    empleados_presentes: 0
  })

  useEffect(() => {
    fetch('http://localhost:3000/api/dashboard')
      .then(r => r.json())
      .then(data => setDatos(data))
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 gap-4">
        <TarjetaResumen titulo="Ventas del día" valor={`$${parseFloat(datos.ventas_dia).toLocaleString('es-AR')}`} color="text-blue-600" />
        <TarjetaResumen titulo="Productos con stock bajo" valor={`${datos.stock_bajo}`} color="text-red-500" />
        <TarjetaResumen titulo="Presupuestos pendientes" valor={`${datos.presupuestos_pendientes}`} color="text-yellow-500" />
        <TarjetaResumen titulo="Empleados presentes hoy" valor={`${datos.empleados_presentes}`} color="text-green-600" />
      </div>
    </div>
  )
}