'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'

// Páginas donde NO se muestra el menú lateral (pantallas limpias).
const RUTAS_SIN_MENU = ['/marcar', '/confirmar', '/login', '/liquidacion/recibo']

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [abierto, setAbierto] = useState(false)

  // En pantallas de marcación y login no se dibuja el menú.
  if (RUTAS_SIN_MENU.includes(pathname)) {
    return null
  }

  const links = [
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

  async function cerrarSesion() {
    await fetch('/api/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      {/* Barra superior solo en celular: título + botón hamburguesa */}
      <div className="md:hidden flex items-center justify-between bg-gray-800 text-white px-4 py-3">
        <h2 className="text-lg font-bold">GestionPro</h2>
        <button
          onClick={() => setAbierto(true)}
          className="text-2xl leading-none"
          aria-label="Abrir menú"
        >
          ☰
        </button>
      </div>

      {/* Fondo oscuro detrás del menú abierto (solo celular) */}
      {abierto && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setAbierto(false)}
        />
      )}

      {/* El menú lateral. */}
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
          <h2 className="text-lg font-bold">GestionPro</h2>
          {/* Botón cerrar, solo en celular */}
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

        {/* Botón de cerrar sesión, al pie del menú */}
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