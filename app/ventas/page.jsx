'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import VentasTaller from '@/app/modules/ventas/taller/page-taller'
import VentasBar from '@/app/modules/ventas/bar/page-bar'
import VentasPanaderia from '@/app/modules/ventas/panaderia/page-panaderia'

export default function VentasRouter() {
  const router = useRouter()
  const [tipoNegocio, setTipoNegocio] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const fetchTipo = async () => {
      try {
        const res = await fetch('/api/negocio/tipo')
        const data = await res.json()
        setTipoNegocio(data.tipo_negocio)
      } catch (error) {
        console.error('Error fetching negocio type:', error)
        setTipoNegocio('taller')
      } finally {
        setCargando(false)
      }
    }

    fetchTipo()
  }, [router])

  if (cargando) {
    return <div className="p-8 text-center text-gray-500">Cargando...</div>
  }

  if (tipoNegocio === 'bar') return <VentasBar />
  if (tipoNegocio === 'panaderia') return <VentasPanaderia />
  return <VentasTaller />
}