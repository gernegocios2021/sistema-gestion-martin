import pool from '../../db'

export async function GET() {
  try {
    const resultado = await pool.query('SELECT * FROM presupuestos ORDER BY fecha DESC')
    return Response.json(resultado.rows)
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const { cliente, descripcion, monto, observaciones } = await request.json()
    const resultado = await pool.query(
      'INSERT INTO presupuestos (cliente, descripcion, monto, observaciones) VALUES ($1, $2, $3, $4) RETURNING *',
      [cliente, descripcion, monto, observaciones]
    )
    return Response.json(resultado.rows[0], { status: 201 })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request) {
  try {
    const { id, estado, observaciones } = await request.json()
    const resultado = await pool.query(
      'UPDATE presupuestos SET estado=$1, observaciones=$2 WHERE id=$3 RETURNING *',
      [estado, observaciones, id]
    )
    return Response.json(resultado.rows[0])
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}