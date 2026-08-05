import pool from '../../db'

export async function GET(request) {
  try {
    const negocioId = request.headers.get('x-negocio-id')
    if (!negocioId) {
      return Response.json({ error: 'No autorizado' }, { status: 401 })
    }

    const resultado = await pool.query(
      'SELECT * FROM empleados WHERE negocio_id = $1 AND activo = TRUE ORDER BY apellido',
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

    const { nombre, apellido, dni, cargo, fecha_ingreso, sueldo_mensual } = await request.json()
    const resultado = await pool.query(
      'INSERT INTO empleados (nombre, apellido, dni, cargo, fecha_ingreso, sueldo_mensual, negocio_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [nombre, apellido, dni, cargo, fecha_ingreso, Number(sueldo_mensual) || 0, negocioId]
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

    const { id, nombre, apellido, dni, cargo, fecha_ingreso, sueldo_mensual } = await request.json()
    const resultado = await pool.query(
      'UPDATE empleados SET nombre=$1, apellido=$2, dni=$3, cargo=$4, fecha_ingreso=$5, sueldo_mensual=$6 WHERE id=$7 AND negocio_id=$8 RETURNING *',
      [nombre, apellido, dni, cargo, fecha_ingreso, Number(sueldo_mensual) || 0, id, negocioId]
    )
    return Response.json(resultado.rows[0])
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const negocioId = request.headers.get('x-negocio-id')
    if (!negocioId) {
      return Response.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await request.json()
    await pool.query('UPDATE empleados SET activo = FALSE WHERE id = $1 AND negocio_id = $2', [id, negocioId])
    return Response.json({ ok: true })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}