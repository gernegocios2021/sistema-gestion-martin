import pool from '../../../db'

export async function POST(request) {
  try {
    const { proveedor } = await request.json()
    if (!proveedor) {
      return Response.json({ error: 'Falta el proveedor' }, { status: 400 })
    }

    const config = await pool.query(
      'SELECT cotizacion_dolar, margen_porcentaje FROM configuracion_proveedores WHERE proveedor = $1',
      [proveedor]
    )
    if (config.rows.length === 0) {
      return Response.json({ error: 'No hay configuración para ese proveedor' }, { status: 404 })
    }

    const { cotizacion_dolar, margen_porcentaje } = config.rows[0]
    if (!cotizacion_dolar || Number(cotizacion_dolar) <= 0) {
      return Response.json({ error: 'Ingresá primero una cotización del dólar mayor a 0' }, { status: 400 })
    }

    const factor = Number(cotizacion_dolar) * (1 + Number(margen_porcentaje) / 100)

    const resultado = await pool.query(
      `UPDATE productos
       SET precio_sin_colocacion = ROUND((precio_usd * $1)::numeric, 2)
       WHERE proveedor = $2 AND precio_usd IS NOT NULL
       RETURNING id`,
      [factor, proveedor]
    )

    return Response.json({ ok: true, actualizados: resultado.rows.length })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}