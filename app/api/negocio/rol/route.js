import { jwtVerify } from 'jose'

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'sistema_martin_qr_2026')

export async function GET(request) {
  try {
    const token = request.cookies.get('sesion')?.value
    if (!token) {
      return Response.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { payload } = await jwtVerify(token, secret)
    return Response.json({ rol: payload.rol || 'admin' })
  } catch (error) {
    console.error('Error:', error)
    return Response.json({ rol: 'admin' })
  }
}