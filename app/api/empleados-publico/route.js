import pool from '../../db'
import jwt from 'jsonwebtoken'

const SECRET = process.env.JWT_SECRET || 'sistema_martin_qr_2026'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return Response.json({ error: 'Falta token' }, { status: 400 })
    }

    let payload
    try {
      payload = jwt.verify(token, SECRET)
    } catch (e) {
      return Response.json({ error: 'Token inválido o vencido' }, { status: 401 })
    }

    const negocioId = payload.negocio_id
    if (!negocioId) {
      return Response.json({ error: 'Token sin negocio' }, { status: 400 })
    }

    const resultado = await pool.query(
      'SELECT * FROM empleados WHERE negocio_id = $1 AND activo = TRUE ORDER BY apellido',
      [negocioId]
    )
    return Response.json(resultado.rows)
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}