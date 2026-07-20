import pool from '../../db'

export async function GET() {
  try {
    const [ventas, stockBajo, presupuestos, gastos, empleadosPresentes] = await Promise.all([
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
      pool.query(`
        SELECT COUNT(*) as cantidad
        FROM presupuestos
        WHERE estado = 'enviado'
      `),
      pool.query(`
        SELECT COALESCE(SUM(monto), 0) as total_dia
        FROM gastos
        WHERE DATE(fecha) = CURRENT_DATE
      `),
      pool.query(`
        SELECT COUNT(*) as cantidad
        FROM asistencia
        WHERE DATE(fecha) = CURRENT_DATE
        AND hora_entrada IS NOT NULL
        AND hora_salida IS NULL
      `)
    ])

    return Response.json({
      ventas_dia: ventas.rows[0].total_dia,
      stock_bajo: stockBajo.rows[0].cantidad,
      presupuestos_pendientes: presupuestos.rows[0].cantidad,
      gastos_dia: gastos.rows[0].total_dia,
      empleados_presentes: empleadosPresentes.rows[0].cantidad
    })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}