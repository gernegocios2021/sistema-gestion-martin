// RUTA TEMPORAL - solo para ver la estructura de las tablas.
// La borramos después de usarla.
import pool from '../../db'

export async function GET() {
  try {
    const r = await pool.query(`
      SELECT table_name, column_name, data_type
      FROM information_schema.columns
      WHERE table_name IN ('empleados', 'asistencia')
      ORDER BY table_name, ordinal_position
    `)
    return Response.json(r.rows)
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}