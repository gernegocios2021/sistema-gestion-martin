import pool from '../../../db'

// Recalcula precio_sin_colocacion y precio_con_colocacion de todos los productos
// de un proveedor, usando:
//   precio_sin_colocacion = precio_usd * cotizacion_dolar * (1 + margen/100)
//   precio_con_colocacion = precio_sin_colocacion * multiplicador_colocacion
export async function POST(request) {
  try {
    const { proveedor } = await request.json()
    if (!proveedor) {
      return Response.json({ error: 'Falta el proveedor' }, { status: 400 })
    }

    const config = await pool.query(
      'SELECT cotizacion_dolar, margen_porcentaje, multiplicador_colocacion FROM configuracion_proveedores WHERE proveedor = $1',
      [proveedor]
    )
    if (config.rows.length === 0) {
      return Response.json({ error: 'No hay configuración para ese proveedor' }, { status: 404 })
    }

    const { cotizacion_dolar, margen_porcentaje, multiplicador_colocacion } = config.rows[0]
    if (!cotizacion_dolar || Number(cotizacion_dolar) <= 0) {
      return Response.json({ error: 'Ingresá primero una cotización del dólar mayor a 0' }, { status: 400 })
    }

    const factor = Number(cotizacion_dolar) * (1 + Number(margen_porcentaje) / 100)
    const multiplicador = Number(multiplicador_colocacion) || 1

    const resultado = await pool.query(
      `UPDATE productos
       SET precio_sin_colocacion = ROUND((precio_usd * $1)::numeric, 2),
           precio_con_colocacion = ROUND((precio_usd * $1 * $2)::numeric, 2)
       WHERE proveedor = $3 AND precio_usd IS NOT NULL
       RETURNING id`,
      [factor, multiplicador, proveedor]
    )

    return Response.json({ ok: true, actualizados: resultado.rows.length })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}