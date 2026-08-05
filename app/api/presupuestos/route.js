import pool from '../../db'

export async function GET(request) {
  try {
    const negocioId = request.headers.get('x-negocio-id')
    if (!negocioId) {
      return Response.json({ error: 'No autorizado' }, { status: 401 })
    }

    const resultado = await pool.query(
      'SELECT * FROM presupuestos WHERE negocio_id = $1 ORDER BY fecha DESC',
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

    const { cliente, descripcion, monto, observaciones } = await request.json()
    const resultado = await pool.query(
      'INSERT INTO presupuestos (cliente, descripcion, monto, observaciones, negocio_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [cliente, descripcion, monto, observaciones, negocioId]
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

    const { id, estado, observaciones } = await request.json()
    const resultado = await pool.query(
      'UPDATE presupuestos SET estado=$1, observaciones=$2 WHERE id=$3 AND negocio_id=$4 RETURNING *',
      [estado, observaciones, id, negocioId]
    )
    return Response.json(resultado.rows[0])
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}