// RUTA TEMPORAL - crea la tabla dispositivos. Se usa una sola vez y se borra.
import pool from '../../db'

export async function GET() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS dispositivos (
        id SERIAL PRIMARY KEY,
        empleado_id INTEGER NOT NULL REFERENCES empleados(id),
        device_id TEXT NOT NULL UNIQUE,
        vinculado_en TIMESTAMP DEFAULT NOW()
      )
    `)
    return Response.json({ ok: true, mensaje: 'Tabla dispositivos creada correctamente' })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}