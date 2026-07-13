import pool from '../../db'

export async function GET() {
  try {
    const ventas = await pool.query('SELECT * FROM ventas ORDER BY fecha DESC')

    // Para cada venta, traemos sus ítems con el nombre del producto
    const ventasConItems = await Promise.all(
      ventas.rows.map(async (venta) => {
        const items = await pool.query(
          `SELECT vi.cantidad, vi.precio_unitario, p.nombre, p.unidad
           FROM venta_items vi
           LEFT JOIN productos p ON p.id = vi.producto_id
           WHERE vi.venta_id = $1`,
          [venta.id]
        )
        return { ...venta, items: items.rows }
      })
    )

    return Response.json(ventasConItems)
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const { items, observaciones, instalacion } = await request.json()

    const instalacionNum = Number(instalacion) || 0

    // Calcular total: productos + instalación
    const totalProductos = items.reduce((sum, item) => sum + (item.cantidad * item.precio_unitario), 0)
    const total = totalProductos + instalacionNum

    // Insertar venta
    const venta = await pool.query(
      'INSERT INTO ventas (total, observaciones, instalacion) VALUES ($1, $2, $3) RETURNING *',
      [total, observaciones, instalacionNum]
    )
    const ventaId = venta.rows[0].id

    // Insertar items y descontar stock
    for (const item of items) {
      await pool.query(
        'INSERT INTO venta_items (venta_id, producto_id, cantidad, precio_unitario) VALUES ($1, $2, $3, $4)',
        [ventaId, item.producto_id, item.cantidad, item.precio_unitario]
      )
      // Descontar del stock automáticamente (la instalación NO descuenta stock)
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