import pool from '../../../db'

export async function POST(request) {
  const negocioId = request.headers.get('x-negocio-id')
  if (!negocioId) return Response.json({ error: 'No autorizado' }, { status: 401 })

  const { porcentaje } = await request.json()
  
  try {
    await pool.query(
      `UPDATE productos 
       SET precio_sin_colocacion = ROUND(precio_sin_colocacion * (1 + $1 / 100), 2),
           precio_con_colocacion = ROUND(precio_con_colocacion * (1 + $1 / 100), 2)
       WHERE negocio_id = $2`,
      [porcentaje, negocioId]
    )
    return Response.json({ ok: true })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}