import pool from '../../db'
import jwt from 'jsonwebtoken'

const SECRET = process.env.JWT_SECRET || 'sistema_martin_qr_2026'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    console.log('[empleados-publico] token recibido:', token ? token.slice(0, 20) + '...' : 'NINGUNO')

    if (!token) {
      console.log('[empleados-publico] ERROR: falta token')
      return Response.json({ error: 'Falta token' }, { status: 400 })
    }

    let payload
    try {
      payload = jwt.verify(token, SECRET)
      console.log('[empleados-publico] token verificado OK, negocio_id:', payload.negocio_id)
    } catch (e) {
      console.log('[empleados-publico] ERROR verificando token:', e.message)
      return Response.json({ error: 'Token inválido o vencido' }, { status: 401 })
    }

    const negocioId = payload.negocio_id
    if (!negocioId) {
      console.log('[empleados-publico] ERROR: token sin negocio_id')
      return Response.json({ error: 'Token sin negocio' }, { status: 400 })
    }

    const resultado = await pool.query(
      'SELECT * FROM empleados WHERE negocio_id = $1 AND activo = TRUE ORDER BY apellido',
      [negocioId]
    )
    console.log('[empleados-publico] empleados encontrados:', resultado.rows.length)
    return Response.json(resultado.rows)
  } catch (error) {
    console.log('[empleados-publico] ERROR GENERAL:', error.message)
    return Response.json({ error: error.message }, { status: 500 })
  }
}