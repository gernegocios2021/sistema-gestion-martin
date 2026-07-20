import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const SECRET = process.env.JWT_SECRET || 'sistema_martin_qr_2026'

// Rutas que NO requieren login (públicas)
const RUTAS_PUBLICAS = [
  '/login',
  '/marcar',
  '/confirmar',
]

// Prefijos de API que NO requieren login
const API_PUBLICAS = [
  '/api/login',
  '/api/marcar',
  '/api/marcar-comida',
  '/api/check-ingreso',
  '/api/dispositivo',
  '/api/vincular',
  '/api/empleados', // necesaria para que /confirmar liste empleados al vincular
]

export async function middleware(request) {
  const { pathname } = request.nextUrl

  // Dejar pasar archivos estáticos y recursos internos de Next
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Dejar pasar las rutas públicas
  const esPublica =
    RUTAS_PUBLICAS.some((r) => pathname === r || pathname.startsWith(r + '/')) ||
    API_PUBLICAS.some((r) => pathname === r || pathname.startsWith(r + '/'))

  if (esPublica) {
    return NextResponse.next()
  }

  // Para el resto: verificar la cookie de sesión
  const token = request.cookies.get('sesion')?.value

  if (!token) {
    // No hay sesión: al login (si es una página) o 401 (si es API)
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    // Verificar que el token sea válido y no haya expirado
    await jwtVerify(token, new TextEncoder().encode(SECRET))
    return NextResponse.next()
  } catch (e) {
    // Token inválido o vencido: al login
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Sesión vencida' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

export const config = {
  // El middleware corre en todas las rutas excepto las que filtramos arriba
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}