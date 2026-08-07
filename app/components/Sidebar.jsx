'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

const RUTAS_SIN_MENU = ['/marcar', '/confirmar', '/login', '/liquidacion/recibo']

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [abierto, setAbierto] = useState(false)
  const [tipoNegocio, setTipoNegocio] = useState(null)
  const [rol, setRol] = useState(null)
  const [nombreNegocio, setNombreNegocio] = useState('GestionPro')

  useEffect(() => {
    const fetchNegocio = async () => {
      try {
        const res = await fetch('/api/negocio/tipo')
        const data = await res.json()
        setTipoNegocio(data.tipo_negocio)
        
        if (data.tipo_negocio === 'panaderia') {
          setNombreNegocio('🥐 Panadería')
        } else if (data.tipo_negocio === 'taller') {
          setNombreNegocio('Taller')
        } else {
          setNombreNegocio('GestionPro')
        }
      } catch (error) {
        console.error('Error fetching negocio:', error)
      }
    }

    const fetchRol = async () => {
      try {
        const res = await fetch('/api/negocio/rol')
        const data = await res.json()
        setRol(data.rol)
      } catch (error) {
        console.error('Error fetching rol:', error)
        setRol('admin')
      }
    }

    fetchNegocio()
    fetchRol()
  }, [])

  if (RUTAS_SIN_MENU.includes(pathname)) {
    return null
  }

  // Links para PANADERÍA - ADMIN (ve todo)
  const linksPanaderiaAdmin = [
    { href: '/', label: 'Dashboard' },
    { href: '/ventas', label: 'Ventas' },
    { href: '/stock', label: 'Stock' },
    { href: '/empleados', label: 'Empleados' },
    { href: '/rentabilidad', label: 'Rentabilidad' },
    { href: '/marcar', label: '📷 Marcar asistencia' },
  ]

  // Links para PANADERÍA - EMPLEADO (solo ventas)
  const linksPanaderiaEmpleado = [
    { href: '/ventas', label: 'Ventas' },
    { href: '/marcar', label: '📷 Marcar asistencia' },
  ]

  // Links para TALLER (todos, por ahora sin distinción de rol)
  const linksTaller = [
    { href: '/', label: 'Dashboard' },
    { href: '/ventas', label: 'Ventas' },
    { href: '/stock', label: 'Stock' },
    { href: '/precios', label: 'Lista de Precios' },
    { href: '/compras', label: 'Compras' },
    { href: '/gastos', label: 'Gastos' },
    { href: '/rentabilidad', label: 'Rentabilidad' },
    { href: '/presupuestos', label: 'Presupuestos' },
    { href: '/lista-materiales', label: 'Materiales por obra' },
    { href: '/empleados', label: 'Empleados' },
    { href: '/liquidacion', label: 'Liquidación de Sueldos' },
    { href: '/feriados', label: 'Feriados' },
    { href: '/marcar', label: '📷 Marcar asistencia' },
  ]

  // Seleccionar links según tipo + rol
  let links = linksTaller
  if (tipoNegocio === 'panaderia') {
    links = rol === 'empleado' ? linksPanaderiaEmpleado : linksPanaderiaAdmin
  }

  async function cerrarSesion() {
    await fetch('/api/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      <div className="md:hidden flex items-center justify-between bg-gray-800 text-white px-4 py-3">
        <div className="flex items-center gap-2">
          <img src="/logo-icon.png" alt="GestionPro" className="w-7 h-7 rounded-lg" />
          <h2 className="text-lg font-bold">{nombreNegocio}</h2>
        </div>
        <button
          onClick={() => setAbierto(true)}
          className="text-2xl leading-none"
          aria-label="Abrir menú"
        >
          ☰
        </button>
      </div>

      {abierto && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setAbierto(false)}
        />
      )}

      <aside
        className={`
          bg-gray-800 text-white p-6 w-56 min-h-screen
          fixed top-0 left-0 z-50 transform transition-transform duration-200
          flex flex-col
          ${abierto ? 'translate-x-0' : '-translate-x-full'}
          md:static md:translate-x-0 md:z-auto
        `}
      >
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <img src="/logo-icon.png" alt="GestionPro" className="w-7 h-7 rounded-lg" />
            <h2 className="text-lg font-bold">{nombreNegocio}</h2>
          </div>
          <button
            onClick={() => setAbierto(false)}
            className="md:hidden text-2xl leading-none"
            aria-label="Cerrar menú"
          >
            ✕
          </button>
        </div>

        <nav className="flex flex-col gap-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setAbierto(false)}
              className={`rounded-lg px-4 py-2 text-sm transition-colors ${
                pathname === link.href
                  ? 'bg-blue-600 text-white font-medium'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <button
          onClick={cerrarSesion}
          className="mt-auto rounded-lg px-4 py-2 text-sm text-left text-gray-300 hover:bg-gray-700 transition-colors"
        >
          🚪 Cerrar sesión
        </button>
      </aside>
    </>
  )
}