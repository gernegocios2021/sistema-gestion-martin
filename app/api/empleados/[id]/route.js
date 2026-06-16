import pool from '../../../db'

export async function GET(request, { params }) {
  try {
    const { id } = await params
    const resultado = await pool.query('SELECT * FROM empleados WHERE id = $1', [id])
    return Response.json(resultado.rows[0])
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}