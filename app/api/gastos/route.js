import pool from '../../db'

export async function GET(request) {
  try {
    const negocioId = request.headers.get('x-negocio-id')
    if (!negocioId) {
      return Response.json({ error: 'No autorizado' }, { status: 401 })
    }

    const resultado = await pool.query(
      'SELECT * FROM gastos WHERE negocio_id = $1 ORDER BY fecha DESC',
      [negocioId]
    )
    return Response.json(resultado.rows)
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const negocioId = request.headers.get('x-negocio-id')
    if (!negocioId) {
      return Response.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { categoria, descripcion, monto, responsable } = await request.json()
    const resultado = await pool.query(
      'INSERT INTO gastos (categoria, descripcion, monto, responsable, negocio_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [categoria, descripcion, monto, responsable, negocioId]
    )
    return Response.json(resultado.rows[0], { status: 201 })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request) {
  try {
    const negocioId = request.headers.get('x-negocio-id')
    if (!negocioId) {
      return Response.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id, categoria, descripcion, monto, responsable } = await request.json()
    const resultado = await pool.query(
      'UPDATE gastos SET categoria=$1, descripcion=$2, monto=$3, responsable=$4 WHERE id=$5 AND negocio_id=$6 RETURNING *',
      [categoria, descripcion, monto, responsable, id, negocioId]
    )
    return Response.json(resultado.rows[0])
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}