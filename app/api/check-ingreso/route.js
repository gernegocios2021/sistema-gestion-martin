import pool from '../../db'

// Fecha de hoy en zona horaria de Argentina (igual que en /api/marcar)
function fechaArgentina() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Argentina/Cordoba',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date()) // YYYY-MM-DD
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const empleado_id = searchParams.get('empleado_id')

    if (!empleado_id) {
      return Response.json({ error: 'Falta empleado_id' }, { status: 400 })
    }

    const hoy = fechaArgentina()

    const resultado = await pool.query(
      `SELECT COUNT(*) AS cantidad
       FROM asistencia
       WHERE empleado_id = $1
         AND fecha = $2
         AND hora_entrada IS NOT NULL
         AND hora_salida IS NULL`,
      [empleado_id, hoy]
    )

    const ya_ingreso = Number(resultado.rows[0].cantidad) > 0

    return Response.json({ ya_ingreso })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}