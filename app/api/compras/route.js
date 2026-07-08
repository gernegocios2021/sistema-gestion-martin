import pool from '../../db'

// GET: lista todas las compras con el resumen de sus productos
export async function GET() {
  try {
    const compras = await pool.query('SELECT * FROM compras ORDER BY fecha DESC')

    // Para cada compra, traemos sus ítems con el nombre del producto
    const comprasConItems = await Promise.all(
      compras.rows.map(async (compra) => {
        const items = await pool.query(
          `SELECT ci.cantidad, ci.precio_unitario, p.nombre, p.unidad
           FROM compra_items ci
           LEFT JOIN productos p ON p.id = ci.producto_id
           WHERE ci.compra_id = $1`,
          [compra.id]
        )
        return { ...compra, items: items.rows }
      })
    )

    return Response.json(comprasConItems)
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}

// POST: registra una compra completa
export async function POST(request) {
  try {
    const { proveedor, tipo, observaciones, items } = await request.json()

    if (!items || items.length === 0) {
      return Response.json({ error: 'La compra no tiene ítems' }, { status: 400 })
    }

    // Calcular el total de la compra
    const total = items.reduce(
      (sum, item) => sum + (Number(item.cantidad) * Number(item.precio_unitario) || 0),
      0
    )

    // 1. Crear la compra
    const compra = await pool.query(
      'INSERT INTO compras (proveedor, tipo, total, observaciones) VALUES ($1, $2, $3, $4) RETURNING *',
      [proveedor || 'Sin proveedor', tipo || 'factura', total, observaciones || '']
    )
    const compraId = compra.rows[0].id

    // 2. Procesar cada ítem
    for (const item of items) {
      let productoId = item.producto_id

      // Si el producto es nuevo (no tiene id), lo creamos primero
      if (!productoId && item.nuevo_producto) {
        const np = item.nuevo_producto
        const creado = await pool.query(
          'INSERT INTO productos (nombre, unidad, stock_actual, stock_minimo, categoria) VALUES ($1, $2, $3, $4, $5) RETURNING id',
          [np.nombre, np.unidad || 'Unidad', 0, Number(np.stock_minimo) || 0, np.categoria || 'materia_prima']
        )
        productoId = creado.rows[0].id
      }

      if (!productoId) continue // por seguridad, si no hay producto, salteamos

      // Guardar el ítem de la compra (con su precio, para el historial)
      await pool.query(
        'INSERT INTO compra_items (compra_id, producto_id, cantidad, precio_unitario) VALUES ($1, $2, $3, $4)',
        [compraId, productoId, Number(item.cantidad) || 0, Number(item.precio_unitario) || 0]
      )

      // Sumar la cantidad comprada al stock del producto
      await pool.query(
        'UPDATE productos SET stock_actual = COALESCE(stock_actual, 0) + $1 WHERE id = $2',
        [Number(item.cantidad) || 0, productoId]
      )
    }

    return Response.json(compra.rows[0], { status: 201 })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}