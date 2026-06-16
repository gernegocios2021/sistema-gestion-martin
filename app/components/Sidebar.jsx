'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Sidebar() {
  const pathname = usePathname()

  const links = [
    { href: '/', label: 'Dashboard' },
    { href: '/ventas', label: 'Ventas' },
    { href: '/stock', label: 'Stock' },
    { href: '/gastos', label: 'Gastos' },
    { href: '/empleados', label: 'Empleados' },
    { href: '/presupuestos', label: 'Presupuestos' },
    { href: '/facturacion', label: 'Facturación' },
    { href: '/marcar', label: '📷 Marcar asistencia' },
    
  ]

  return (
    <aside className="w-56 min-h-screen bg-gray-800 text-white p-6">
      <h2 className="text-lg font-bold mb-8">Sistema Martín</h2>
      <nav className="flex flex-col gap-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
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
    </aside>
  )
}