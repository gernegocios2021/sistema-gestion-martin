import pool from '../../db'

export async function GET(request) {
  try {
    const negocioId = request.headers.get('x-negocio-id')
    if (!negocioId) {
      return Response.json({ error: 'No autorizado' }, { status: 401 })
    }

    const ventas = await pool.query(
      'SELECT * FROM ventas WHERE negocio_id = $1 ORDER BY fecha DESC',
      [negocioId]
    )

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
    const negocioId = request.headers.get('x-negocio-id')
    if (!negocioId) {
      return Response.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { items, observaciones, instalacion } = await request.json()

    const instalacionNum = Number(instalacion) || 0

    // Calcular total: productos + instalación
    const totalProductos = items.reduce((sum, item) => sum + (item.cantidad * item.precio_unitario), 0)
    const total = totalProductos + instalacionNum

    // Insertar venta
    const venta = await pool.query(
      'INSERT INTO ventas (total, observaciones, instalacion, negocio_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [total, observaciones, instalacionNum, negocioId]
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
        'UPDATE productos SET stock_actual = stock_actual - $1 WHERE id = $2 AND negocio_id = $3',
        [item.cantidad, item.producto_id, negocioId]
      )
    }

    return Response.json(venta.rows[0], { status: 201 })
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

    const ventaRes = await pool.query(
      'SELECT factura_cae FROM ventas WHERE id = $1 AND negocio_id = $2',
      [id, negocioId]
    )
    if (ventaRes.rows.length === 0) {
      return Response.json({ error: 'Venta no encontrada o no autorizada' }, { status: 404 })
    }
    if (ventaRes.rows[0].factura_cae) {
      return Response.json({ error: 'No se puede eliminar: esta venta ya tiene una factura emitida' }, { status: 409 })
    }

    // Devolver el stock de cada producto vendido
    const items = await pool.query('SELECT producto_id, cantidad FROM venta_items WHERE venta_id = $1', [id])
    for (const item of items.rows) {
      await pool.query(
        'UPDATE productos SET stock_actual = stock_actual + $1 WHERE id = $2 AND negocio_id = $3',
        [item.cantidad, item.producto_id, negocioId]
      )
    }

    await pool.query('DELETE FROM venta_items WHERE venta_id = $1', [id])
    await pool.query('DELETE FROM ventas WHERE id = $1 AND negocio_id = $2', [id, negocioId])

    return Response.json({ ok: true })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}