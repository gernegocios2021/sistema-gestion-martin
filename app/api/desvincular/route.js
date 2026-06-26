import pool from '../../db'

// Borra la vinculación de un empleado (su celular).
// Se usa cuando el empleado cambia de teléfono, renuncia, o se vinculó mal.
export async function POST(request) {
  try {
    const { empleado_id } = await request.json()
    if (!empleado_id) {
      return Response.json({ error: 'Falta el empleado' }, { status: 400 })
    }

    const r = await pool.query(
      'DELETE FROM dispositivos WHERE empleado_id = $1 RETURNING *',
      [empleado_id]
    )

    return Response.json({ ok: true, borrados: r.rows.length })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}