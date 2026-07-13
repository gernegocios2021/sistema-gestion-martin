import pool from '../../db'

// GET: devuelve cada venta con su costo de materiales calculado (según el precio
// de la última compra registrada de cada producto ANTES o EN la fecha de la venta),
// más la mano de obra y la rentabilidad resultante.
export async function GET() {
  try {
    const ventas = await pool.query('SELECT * FROM ventas ORDER BY fecha DESC')

    const resultado = await Promise.all(
      ventas.rows.map(async (venta) => {
        const items = await pool.query(
          `SELECT vi.producto_id, vi.cantidad, p.nombre
           FROM venta_items vi
           LEFT JOIN productos p ON p.id = vi.producto_id
           WHERE vi.venta_id = $1`,
          [venta.id]
        )

        let costoMateriales = 0
        let itemsSinCosto = 0

        for (const item of items.rows) {
          const costo = await pool.query(
            `SELECT ci.precio_unitario
             FROM compra_items ci
             JOIN compras c ON c.id = ci.compra_id
             WHERE ci.producto_id = $1 AND c.fecha <= $2
             ORDER BY c.fecha DESC
             LIMIT 1`,
            [item.producto_id, venta.fecha]
          )

          if (costo.rows.length > 0) {
            costoMateriales += Number(item.cantidad) * Number(costo.rows[0].precio_unitario)
          } else {
            itemsSinCosto += 1
          }
        }

        const total = Number(venta.total) || 0
        const manoObra = Number(venta.mano_obra) || 0
        const rentabilidad = total - costoMateriales - manoObra
        const margen = total > 0 ? (rentabilidad / total) * 100 : 0

        return {
          ...venta,
          costo_materiales: costoMateriales,
          rentabilidad,
          margen,
          items_sin_costo: itemsSinCosto
        }
      })
    )

    return Response.json(resultado)
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}

// PATCH: actualiza la mano de obra ingresada manualmente para una venta.
export async function PATCH(request) {
  try {
    const { id, mano_obra } = await request.json()
    if (!id) {
      return Response.json({ error: 'Falta el id' }, { status: 400 })
    }
    const resultado = await pool.query(
      'UPDATE ventas SET mano_obra = $1 WHERE id = $2 RETURNING *',
      [Number(mano_obra) || 0, id]
    )
    return Response.json(resultado.rows[0])
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}