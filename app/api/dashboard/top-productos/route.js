import pool from '../../../db'

export async function GET(request) {
  const negocioId = request.headers.get('x-negocio-id')
  if (!negocioId) return Response.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const result = await pool.query(`
      SELECT 
        p.nombre,
        p.unidad,
        SUM(vi.cantidad) as cantidad_vendida,
        SUM(vi.cantidad * vi.precio_unitario) as total_ingresos
      FROM venta_items vi
      JOIN ventas v ON vi.venta_id = v.id
      JOIN productos p ON vi.producto_id = p.id
      WHERE v.negocio_id = $1
        AND DATE(v.fecha) = CURRENT_DATE
      GROUP BY p.id, p.nombre, p.unidad
      ORDER BY total_ingresos DESC
    `, [negocioId])

    return Response.json(result.rows)
  } catch (error) {
    console.error('Error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}