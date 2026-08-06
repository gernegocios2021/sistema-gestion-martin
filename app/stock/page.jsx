'use client'

import { useEffect, useState } from 'react'
import StockPanaderiaComponent from '@/app/modules/stock/panaderia/page-panaderia-stock.jsx'

export default function StockRouter() {
  const [tipoNegocio, setTipoNegocio] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const fetchTipo = async () => {
      try {
        const res = await fetch('/api/negocio/tipo')
        const data = await res.json()
        setTipoNegocio(data.tipo_negocio)
      } catch (error) {
        console.error('Error:', error)
        setTipoNegocio('taller')
      } finally {
        setCargando(false)
      }
    }
    fetchTipo()
  }, [])

  if (cargando) return <div className="p-8 text-center">Cargando...</div>

  if (tipoNegocio === 'panaderia') {
    return <StockPanaderiaComponent />
  }

  return <div className="p-8 text-center text-gray-600">Stock Taller (por implementar)</div>
}