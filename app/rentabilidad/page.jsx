'use client'

import { useEffect, useState } from 'react'
import RentabilidadTallerComponent from '@/app/modules/rentabilidad/taller/page-taller-rentabilidad.jsx'
import RentabilidadPanaderiaComponent from '@/app/modules/rentabilidad/panaderia/page-panaderia-rentabilidad.jsx'

export default function RentabilidadRouter() {
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
    return <RentabilidadPanaderiaComponent />
  }

  return <RentabilidadTallerComponent />
}