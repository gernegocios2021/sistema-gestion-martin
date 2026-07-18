import { ReactNode } from 'react'
import { Geist } from 'next/font/google'
import Sidebar from './components/Sidebar'
import ThemeToggle from './components/ThemeToggle'
import './globals.css'

const geist = Geist({ subsets: ['latin'] })

export const metadata = {
  title: 'GestiónPro',
  description: 'Sistema de gestión integral',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body className={geist.className}>
        <div className="md:flex min-h-screen bg-gray-100">
          <Sidebar />
          <main className="flex-1 min-w-0">
            {/* Header con ThemeToggle */}
            <div className="bg-white dark-theme:bg-slate-900 shadow p-4 flex justify-end">
              <ThemeToggle />
            </div>
            {/* Contenido principal */}
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}