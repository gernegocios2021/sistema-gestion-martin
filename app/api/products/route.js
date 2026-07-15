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
    const { nombre, unidad, stock_actual, stock_minimo, categoria, precio_sin_colocacion, precio_con_colocacion, grupo } = await request.json()
    const stockActualNum = Number(stock_actual) || 0
    const stockMinimoNum = Number(stock_minimo) || 0
    const precioSinColocacionNum = precio_sin_colocacion !== undefined && precio_sin_colocacion !== '' ? Number(precio_sin_colocacion) : null
    const precioConColocacionNum = precio_con_colocacion !== undefined && precio_con_colocacion !== '' ? Number(precio_con_colocacion) : null

    const resultado = await pool.query(
      'INSERT INTO productos (nombre, unidad, stock_actual, stock_minimo, categoria, precio_sin_colocacion, precio_con_colocacion, grupo) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [nombre, unidad, stockActualNum, stockMinimoNum, categoria || 'materia_prima', precioSinColocacionNum, precioConColocacionNum, grupo || null]
    )
    return Response.json(resultado.rows[0], { status: 201 })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json()

    const { id } = body
    if (!id) {
      return Response.json({ error: 'Falta el id' }, { status: 400 })
    }

    // Sumar/restar cantidad al stock existente (usado por "Reponer")
    if (body.cantidad !== undefined) {
      const resultado = await pool.query(
        'UPDATE productos SET stock_actual = COALESCE(stock_actual, 0) + $1 WHERE id = $2 RETURNING *',
        [Number(body.cantidad) || 0, id]
      )
      return Response.json(resultado.rows[0])
    }

    // Editar directamente el número de stock, sin tocar el resto de los campos
    // (usado para la carga rápida de stock real desde la tabla)
    if (body.set_stock !== undefined) {
      const resultado = await pool.query(
        'UPDATE productos SET stock_actual = $1 WHERE id = $2 RETURNING *',
        [Number(body.set_stock) || 0, id]
      )
      return Response.json(resultado.rows[0])
    }

    // Editar directamente el stock mínimo, sin tocar el resto de los campos
    if (body.set_stock_minimo !== undefined) {
      const resultado = await pool.query(
        'UPDATE productos SET stock_minimo = $1 WHERE id = $2 RETURNING *',
        [Number(body.set_stock_minimo) || 0, id]
      )
      return Response.json(resultado.rows[0])
    }

    const { nombre, unidad, stock_actual, stock_minimo, categoria, precio_sin_colocacion, precio_con_colocacion, grupo } = body
    const precioSinColocacionNum = precio_sin_colocacion !== undefined && precio_sin_colocacion !== '' ? Number(precio_sin_colocacion) : null
    const precioConColocacionNum = precio_con_colocacion !== undefined && precio_con_colocacion !== '' ? Number(precio_con_colocacion) : null

    const resultado = await pool.query(
      `UPDATE productos
       SET nombre = $1, unidad = $2, stock_actual = $3, stock_minimo = $4, categoria = $5, precio_sin_colocacion = $6, precio_con_colocacion = $7, grupo = $8
       WHERE id = $9 RETURNING *`,
      [nombre, unidad, Number(stock_actual) || 0, Number(stock_minimo) || 0, categoria || 'materia_prima', precioSinColocacionNum, precioConColocacionNum, grupo || null, id]
    )
        return Response.json(resultado.rows[0])
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const { id } = await request.json()
    if (!id) {
      return Response.json({ error: 'Falta el id' }, { status: 400 })
    }
    await pool.query('DELETE FROM productos WHERE id = $1', [id])
    return Response.json({ ok: true })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}