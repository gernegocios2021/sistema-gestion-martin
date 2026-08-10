  'use client'

  import { useState, useEffect } from 'react'

  export default function DashboardPanaderia() {
    const [datos, setDatos] = useState({
      ventas_dia: 0,
      empleados_presentes: 0
    })
    const [productosVendidos, setProductosVendidos] = useState([])

    useEffect(() => {
  fetch('/api/dashboard', {
    headers: { 'x-negocio-id': '2' }
  })
    .then(r => r.json())
    .then(data => setDatos(data))

  fetch('/api/dashboard/top-productos', {
    headers: { 'x-negocio-id': '2' }
  })
    .then(r => r.json())
    .then(data => setProductosVendidos(Array.isArray(data) ? data : []))
}, [])

    const ventasFormato = `$${parseFloat(datos.ventas_dia).toLocaleString('es-AR')}`

    return (
      <div className="p-8 bg-gradient-to-br from-orange-50 to-yellow-50 min-h-screen">
  <h1 className="text-3xl font-bold mb-8 inline-block px-3 py-1 rounded-lg" style={{ color: '#ffffff', backgroundColor: '#c2410c' }}>🥐 Panadería</h1>      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-8 border-l-4 border-orange-600">
  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Hoy vendiste</p>          <p className="text-5xl font-bold text-orange-700">{ventasFormato}</p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8 border-l-4 border-green-600">
  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Empleados presentes</p>          <p className="text-5xl font-bold text-green-700">{datos.empleados_presentes}</p>
          </div>
        </div>

        {/* Tabla productos vendidos hoy */}
        <div className="bg-white rounded-lg shadow-lg p-6">
  <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">📊 Vendido hoy por producto</h2>
          {productosVendidos.length === 0 ? (
            <p className="text-gray-400 text-center py-8">Todavía no hay ventas registradas hoy</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px]">
  <thead style={{ backgroundColor: '#fed7aa' }}>
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-bold" style={{ color: '#1f2937' }}>Producto</th>
                    <th className="text-left px-4 py-3 text-sm font-bold" style={{ color: '#1f2937' }}>Cantidad vendida</th>
                    <th className="text-left px-4 py-3 text-sm font-bold" style={{ color: '#1f2937' }}>Ingresos</th>
                  </tr>
                </thead>
                <tbody>
                  {productosVendidos.map((p, idx) => (
                    <tr key={idx} className="border-t hover:bg-orange-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-800">{p.nombre}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {parseFloat(p.cantidad_vendida).toLocaleString('es-AR')} {p.unidad}
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-orange-700">
                        ${parseFloat(p.total_ingresos).toLocaleString('es-AR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    )
  }