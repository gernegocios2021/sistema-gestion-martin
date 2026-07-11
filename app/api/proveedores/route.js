import pool from '../../db'

export async function GET() {
  try {
    const resultado = await pool.query('SELECT * FROM configuracion_proveedores ORDER BY proveedor')
    return Response.json(resultado.rows)
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request) {
  try {
    const { proveedor, cotizacion_dolar, margen_porcentaje } = await request.json()
    if (!proveedor) {
      return Response.json({ error: 'Falta el proveedor' }, { status: 400 })
    }
    const resultado = await pool.query(
      `UPDATE configuracion_proveedores
       SET cotizacion_dolar = $1, margen_porcentaje = $2, actualizado_en = NOW()
       WHERE proveedor = $3 RETURNING *`,
      [Number(cotizacion_dolar) || 0, Number(margen_porcentaje) || 0, proveedor]
    )
    return Response.json(resultado.rows[0])
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}