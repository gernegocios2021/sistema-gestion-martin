import pool from '../../db'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const negocioId = searchParams.get('negocio_id')

    if (!negocioId) {
      return Response.json({ error: 'Falta negocio_id' }, { status: 400 })
    }

    const result = await pool.query(
      'SELECT tipo_negocio FROM negocio WHERE id = $1',
      [negocioId]
    )

    if (result.rows.length === 0) {
      return Response.json({ tipo_negocio: 'taller' })
    }

    return Response.json({ tipo_negocio: result.rows[0].tipo_negocio })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}