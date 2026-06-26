import { Geist } from 'next/font/google'
import { ReactNode } from 'react'
import Sidebar from './components/Sidebar'
import './globals.css'

const geist = Geist({ subsets: ['latin'] })

export const metadata = {
  title: 'Sistema Martín',
  description: 'Sistema de gestión integral',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body className={geist.className}>
        <div className="md:flex min-h-screen bg-gray-100">
          <Sidebar />
          <main className="flex-1 min-w-0">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}