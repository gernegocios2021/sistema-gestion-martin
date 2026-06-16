import pool from '../../db'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const empleado_id = searchParams.get('empleado_id')
    const resultado = await pool.query(
      'SELECT * FROM asistencia WHERE empleado_id = $1 ORDER BY fecha DESC',
      [empleado_id]
    )
    return Response.json(resultado.rows)
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const { empleado_id, fecha, hora_entrada, hora_salida } = await request.json()
    
    // Calcular horas trabajadas automáticamente
    const entrada = new Date(`2000-01-01T${hora_entrada}`)
    const salida = new Date(`2000-01-01T${hora_salida}`)
    const horas = (salida - entrada) / (1000 * 60 * 60)

    const resultado = await pool.query(
      'INSERT INTO asistencia (empleado_id, fecha, hora_entrada, hora_salida, horas_trabajadas) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [empleado_id, fecha, hora_entrada, hora_salida, horas]
    )
    return Response.json(resultado.rows[0], { status: 201 })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}