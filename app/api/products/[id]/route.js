import pool from '../../../db'

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
    const { nombre, unidad, stock_actual, stock_minimo, categoria } = await request.json()

    const stockActualNum = Number(stock_actual) || 0
    const stockMinimoNum = Number(stock_minimo) || 0

    const resultado = await pool.query(
      'INSERT INTO productos (nombre, unidad, stock_actual, stock_minimo, categoria) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [nombre, unidad, stockActualNum, stockMinimoNum, categoria || 'materia_prima']
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

    // Si viene "cantidad", es una REPOSICIÓN (suma al stock)
    if (body.cantidad !== undefined) {
      const resultado = await pool.query(
        'UPDATE productos SET stock_actual = COALESCE(stock_actual, 0) + $1 WHERE id = $2 RETURNING *',
        [Number(body.cantidad) || 0, id]
      )
      return Response.json(resultado.rows[0])
    }

    // Si no, es una EDICIÓN de los datos del producto
    const { nombre, unidad, stock_actual, stock_minimo, categoria } = body
    const resultado = await pool.query(
      `UPDATE productos
       SET nombre = $1, unidad = $2, stock_actual = $3, stock_minimo = $4, categoria = $5
       WHERE id = $6 RETURNING *`,
      [nombre, unidad, Number(stock_actual) || 0, Number(stock_minimo) || 0, categoria || 'materia_prima', id]
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