import pool from '../../db'

export async function GET() {
  try {
    const resultado = await pool.query('SELECT * FROM gastos ORDER BY fecha DESC')
    return Response.json(resultado.rows)
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const { categoria, descripcion, monto, responsable } = await request.json()
    const resultado = await pool.query(
      'INSERT INTO gastos (categoria, descripcion, monto, responsable) VALUES ($1, $2, $3, $4) RETURNING *',
      [categoria, descripcion, monto, responsable]
    )
    return Response.json(resultado.rows[0], { status: 201 })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}