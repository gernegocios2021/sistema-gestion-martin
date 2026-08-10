import { Suspense } from 'react'
import ConfirmarContenido from './confirmar-contenido'

export default function ConfirmarPage() {
  return (
    <Suspense fallback={
      <div className="gp-marcar min-h-screen flex items-center justify-center p-8">
        <p className="gp-sub">Cargando...</p>
      </div>
    }>
      <ConfirmarContenido />
    </Suspense>
  )
}