'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import TarjetaResumen from './components/TarjetaResumen'

export default function Home() {
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
        <TarjetaResumen titulo="Ventas del día" valor={`$${parseFloat(datos.ventas_dia).toLocaleString('es-AR')}`} color="text-blue-600" />

        <Link href="/stock?filtro=bajo" className="block transition hover:scale-[1.02]">
          <TarjetaResumen titulo="Productos con stock bajo" valor={`${datos.stock_bajo}`} color="text-red-500" />
        </Link>

        <TarjetaResumen titulo="Presupuestos pendientes" valor={`${datos.presupuestos_pendientes}`} color="text-yellow-500" />
        <TarjetaResumen titulo="Empleados presentes hoy" valor={`${datos.empleados_presentes}`} color="text-green-600" />
      </div>
    </div>
  )
}