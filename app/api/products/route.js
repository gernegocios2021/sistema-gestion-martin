import pool from '../../db'

export async function GET(request) {
  try {
    // Obtener negocio_id del header (pasado por middleware)
    const negocioId = request.headers.get('x-negocio-id')
    
    if (!negocioId) {
      return Response.json({ error: 'No autorizado' }, { status: 401 })
    }

    const resultado = await pool.query(
      'SELECT * FROM productos WHERE negocio_id = $1 ORDER BY id',
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

    const { nombre, unidad, stock_actual, stock_minimo, categoria, precio_sin_colocacion, precio_con_colocacion, grupo, tipo_medida } = await request.json()
    const stockActualNum = Number(stock_actual) || 0
    const stockMinimoNum = Number(stock_minimo) || 0
    const precioSinColocacionNum = precio_sin_colocacion !== undefined && precio_sin_colocacion !== '' ? Number(precio_sin_colocacion) : null
    const precioConColocacionNum = precio_con_colocacion !== undefined && precio_con_colocacion !== '' ? Number(precio_con_colocacion) : null

    const resultado = await pool.query(
      'INSERT INTO productos (nombre, unidad, stock_actual, stock_minimo, categoria, precio_sin_colocacion, precio_con_colocacion, grupo, negocio_id, tipo_medida) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
      [nombre, unidad, stockActualNum, stockMinimoNum, categoria || 'materia_prima', precioSinColocacionNum, precioConColocacionNum, grupo || null, negocioId, tipo_medida || 'unidad']
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

    const body = await request.json()
    const { id } = body
    
    if (!id) {
      return Response.json({ error: 'Falta el id' }, { status: 400 })
    }

    // Verificar que el producto pertenece a este negocio
    const verificacion = await pool.query(
      'SELECT id FROM productos WHERE id = $1 AND negocio_id = $2',
      [id, negocioId]
    )
    
    if (verificacion.rows.length === 0) {
      return Response.json({ error: 'Producto no encontrado o no autorizado' }, { status: 404 })
    }

    // Sumar/restar cantidad al stock existente
    if (body.cantidad !== undefined) {
      const resultado = await pool.query(
        'UPDATE productos SET stock_actual = COALESCE(stock_actual, 0) + $1 WHERE id = $2 AND negocio_id = $3 RETURNING *',
        [Number(body.cantidad) || 0, id, negocioId]
      )
      return Response.json(resultado.rows[0])
    }

    // Editar stock
    if (body.set_stock !== undefined) {
      const resultado = await pool.query(
        'UPDATE productos SET stock_actual = $1 WHERE id = $2 AND negocio_id = $3 RETURNING *',
        [Number(body.set_stock) || 0, id, negocioId]
      )
      return Response.json(resultado.rows[0])
    }

    // Editar stock mínimo
    if (body.set_stock_minimo !== undefined) {
      const resultado = await pool.query(
        'UPDATE productos SET stock_minimo = $1 WHERE id = $2 AND negocio_id = $3 RETURNING *',
        [Number(body.set_stock_minimo) || 0, id, negocioId]
      )
      return Response.json(resultado.rows[0])
    }
    // Editar precio
    if (body.precio_sin_colocacion !== undefined && body.nombre === undefined) {
      const resultado = await pool.query(
        'UPDATE productos SET precio_sin_colocacion = $1, precio_con_colocacion = $2 WHERE id = $3 AND negocio_id = $4 RETURNING *',
        [Number(body.precio_sin_colocacion) || 0, Number(body.precio_con_colocacion) || 0, id, negocioId]
      )
      return Response.json(resultado.rows[0])
    }
    // Editar nombre/unidad/tipo_medida (edición rápida desde panadería)
    if (body.set_nombre !== undefined) {
      const resultado = await pool.query(
        'UPDATE productos SET nombre = $1, unidad = $2, tipo_medida = $3 WHERE id = $4 AND negocio_id = $5 RETURNING *',
        [body.set_nombre, body.set_unidad, body.set_tipo_medida, id, negocioId]
      )
      return Response.json(resultado.rows[0])
    }

    // Update completo
    const { nombre, unidad, stock_actual, stock_minimo, categoria, precio_sin_colocacion, precio_con_colocacion, grupo } = body
    const precioSinColocacionNum = precio_sin_colocacion !== undefined && precio_sin_colocacion !== '' ? Number(precio_sin_colocacion) : null
    const precioConColocacionNum = precio_con_colocacion !== undefined && precio_con_colocacion !== '' ? Number(precio_con_colocacion) : null

    const resultado = await pool.query(
      `UPDATE productos
       SET nombre = $1, unidad = $2, stock_actual = $3, stock_minimo = $4, categoria = $5, precio_sin_colocacion = $6, precio_con_colocacion = $7, grupo = $8
       WHERE id = $9 AND negocio_id = $10 RETURNING *`,
      [nombre, unidad, Number(stock_actual) || 0, Number(stock_minimo) || 0, categoria || 'materia_prima', precioSinColocacionNum, precioConColocacionNum, grupo || null, id, negocioId]
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
    if (!id) {
      return Response.json({ error: 'Falta el id' }, { status: 400 })
    }

    await pool.query('DELETE FROM productos WHERE id = $1 AND negocio_id = $2', [id, negocioId])
    return Response.json({ ok: true })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}