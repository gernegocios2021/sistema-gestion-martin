import pool from '../../db'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const empleado_id = searchParams.get('empleado_id')

    if (!empleado_id) {
      return Response.json({ error: 'Falta empleado_id' }, { status: 400 })
    }

    const resultado = await pool.query(
      `SELECT COUNT(*) as cantidad
       FROM asistencia
       WHERE empleado_id = $1
       AND DATE(fecha) = CURRENT_DATE
       AND hora_entrada IS NOT NULL
       AND hora_salida IS NULL`,
      [empleado_id]
    )

    const ya_ingreso = resultado.rows[0].cantidad > 0

    return Response.json({ ya_ingreso })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}