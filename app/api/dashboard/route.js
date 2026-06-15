import pool from '../../db'

export async function GET() {
  try {
    const [ventas, stockBajo, presupuestos] = await Promise.all([
      pool.query(`
        SELECT COALESCE(SUM(total), 0) as total_dia
        FROM ventas
        WHERE DATE(fecha) = CURRENT_DATE
      `),
      pool.query(`
        SELECT COUNT(*) as cantidad
        FROM productos
        WHERE stock_actual < stock_minimo
      `),
      pool.query(`SELECT 0 as cantidad`)
    ])

    return Response.json({
      ventas_dia: ventas.rows[0].total_dia,
      stock_bajo: stockBajo.rows[0].cantidad,
      presupuestos_pendientes: 0,
      empleados_presentes: 0
    })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}