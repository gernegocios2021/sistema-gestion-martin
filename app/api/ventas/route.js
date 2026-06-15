import pool from '../../db'

export async function GET() {
  try {
    const resultado = await pool.query('SELECT * FROM ventas ORDER BY fecha DESC')
    return Response.json(resultado.rows)
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const { items, observaciones } = await request.json()
    
    // Calcular total
    const total = items.reduce((sum, item) => sum + (item.cantidad * item.precio_unitario), 0)
    
    // Insertar venta
    const venta = await pool.query(
      'INSERT INTO ventas (total, observaciones) VALUES ($1, $2) RETURNING *',
      [total, observaciones]
    )
    const ventaId = venta.rows[0].id

    // Insertar items y descontar stock
    for (const item of items) {
      await pool.query(
        'INSERT INTO venta_items (venta_id, producto_id, cantidad, precio_unitario) VALUES ($1, $2, $3, $4)',
        [ventaId, item.producto_id, item.cantidad, item.precio_unitario]
      )
      // Descontar del stock automáticamente
      await pool.query(
        'UPDATE productos SET stock_actual = stock_actual - $1 WHERE id = $2',
        [item.cantidad, item.producto_id]
      )
    }

    return Response.json(venta.rows[0], { status: 201 })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}