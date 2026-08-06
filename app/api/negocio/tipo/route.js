import pool from '../../../db'
import { jwtVerify } from 'jose'

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'sistema_martin_qr_2026')

export async function GET(request) {
  try {
    const token = request.cookies.get('sesion')?.value
    if (!token) {
      return Response.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { payload } = await jwtVerify(token, secret)
    const negocioId = payload.negocio_id

    const result = await pool.query('SELECT tipo_negocio FROM negocio WHERE id = $1', [negocioId])

    if (result.rows.length === 0) {
      return Response.json({ tipo_negocio: 'taller' })
    }

    return Response.json({ tipo_negocio: result.rows[0].tipo_negocio })
  } catch (error) {
    console.error('Error:', error)
    return Response.json({ tipo_negocio: 'taller' })
  }
}