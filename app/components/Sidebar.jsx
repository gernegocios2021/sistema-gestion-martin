import Link from 'next/link'

export default function Sidebar() {
  return (
    <aside className="w-56 min-h-screen bg-gray-800 text-white p-6">
      <h2 className="text-lg font-bold mb-8">Sistema Martín</h2>
      <nav className="flex flex-col gap-2">
        <Link href="/" className="bg-gray-700 rounded-lg px-4 py-2 text-sm font-medium">Dashboard</Link>
        <Link href="/ventas" className="hover:bg-gray-700 rounded-lg px-4 py-2 text-sm text-gray-300">Ventas</Link>
        <Link href="/stock" className="hover:bg-gray-700 rounded-lg px-4 py-2 text-sm text-gray-300">Stock</Link>
        <Link href="/empleados" className="hover:bg-gray-700 rounded-lg px-4 py-2 text-sm text-gray-300">Empleados</Link>
        <Link href="/presupuestos" className="hover:bg-gray-700 rounded-lg px-4 py-2 text-sm text-gray-300">Presupuestos</Link>
        <Link href="/facturacion" className="hover:bg-gray-700 rounded-lg px-4 py-2 text-sm text-gray-300">Facturación</Link>
        <Link href="/gastos" className="hover:bg-gray-700 rounded-lg px-4 py-2 text-sm text-gray-300">Gastos</Link>
      </nav>
    </aside>
  )
}