import pool from '../../../db'

// Aplica un aumento porcentual a los precios de un grupo, o a todo el catálogo si no se especifica grupo.
export async function PATCH(request) {
  try {
    const { grupo, porcentaje } = await request.json()
    const pct = Number(porcentaje)

    if (!pct || pct === 0) {
      return Response.json({ error: 'Porcentaje inválido' }, { status: 400 })
    }

    const factor = 1 + pct / 100

    let resultado
    if (grupo) {
      resultado = await pool.query(
        `UPDATE productos SET
           precio_sin_colocacion = CASE WHEN precio_sin_colocacion IS NOT NULL THEN ROUND((precio_sin_colocacion * $1)::numeric, 2) ELSE NULL END,
           precio_con_colocacion = CASE WHEN precio_con_colocacion IS NOT NULL THEN ROUND((precio_con_colocacion * $1)::numeric, 2) ELSE NULL END
         WHERE grupo = $2
         RETURNING id`,
        [factor, grupo]
      )
    } else {
      resultado = await pool.query(
        `UPDATE productos SET
           precio_sin_colocacion = CASE WHEN precio_sin_colocacion IS NOT NULL THEN ROUND((precio_sin_colocacion * $1)::numeric, 2) ELSE NULL END,
           precio_con_colocacion = CASE WHEN precio_con_colocacion IS NOT NULL THEN ROUND((precio_con_colocacion * $1)::numeric, 2) ELSE NULL END
         RETURNING id`,
        [factor]
      )
    }

    return Response.json({ ok: true, actualizados: resultado.rows.length })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}