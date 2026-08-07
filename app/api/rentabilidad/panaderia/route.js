import pool from '../../../db'

export async function GET(request) {
  const negocioId = request.headers.get('x-negocio-id')
  if (!negocioId) return Response.json({ error: 'No autorizado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const periodo = searchParams.get('periodo') || 'hoy' // hoy | semana | mes

  let filtroFecha = "DATE(v.fecha) = CURRENT_DATE"
  if (periodo === 'semana') {
    filtroFecha = "v.fecha >= CURRENT_DATE - INTERVAL '7 days'"
  } else if (periodo === 'mes') {
    filtroFecha = "v.fecha >= CURRENT_DATE - INTERVAL '30 days'"
  }

  try {
    const result = await pool.query(`
      SELECT 
        p.nombre,
        p.unidad,
        SUM(vi.cantidad) as cantidad_vendida,
        SUM(vi.cantidad * vi.precio_unitario) as total_ingresos,
        SUM(vi.cantidad * COALESCE(p.costo, 0)) as total_costo,
        SUM(vi.cantidad * vi.precio_unitario) - SUM(vi.cantidad * COALESCE(p.costo, 0)) as ganancia
      FROM venta_items vi
      JOIN ventas v ON vi.venta_id = v.id
      JOIN productos p ON vi.producto_id = p.id
      WHERE v.negocio_id = $1
        AND ${filtroFecha}
      GROUP BY p.id, p.nombre, p.unidad
      ORDER BY ganancia DESC
    `, [negocioId])

    return Response.json(result.rows)
  } catch (error) {
    console.error('Error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}