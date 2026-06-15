import pool from '../../db'

export async function GET() {
  try {
    const resultado = await pool.query('SELECT * FROM productos ORDER BY id')
    return Response.json(resultado.rows)
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const { nombre, unidad, stock_actual, stock_minimo } = await request.json()
    const resultado = await pool.query(
      'INSERT INTO productos (nombre, unidad, stock_actual, stock_minimo) VALUES ($1, $2, $3, $4) RETURNING *',
      [nombre, unidad, stock_actual, stock_minimo]
    )
    return Response.json(resultado.rows[0], { status: 201 })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}
export async function PATCH(request) {
  try {
    const { id, cantidad } = await request.json()
    const resultado = await pool.query(
      'UPDATE productos SET stock_actual = stock_actual + $1 WHERE id = $2 RETURNING *',
      [cantidad, id]
    )
    return Response.json(resultado.rows[0])
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}