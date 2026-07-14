import pool from '../../db'

export async function GET() {
  try {
    const resultado = await pool.query('SELECT * FROM feriados ORDER BY fecha')
    return Response.json(resultado.rows)
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const { fecha, descripcion } = await request.json()
    if (!fecha) {
      return Response.json({ error: 'Falta la fecha' }, { status: 400 })
    }
    const resultado = await pool.query(
      'INSERT INTO feriados (fecha, descripcion) VALUES ($1, $2) ON CONFLICT (fecha) DO UPDATE SET descripcion = $2 RETURNING *',
      [fecha, descripcion || '']
    )
    return Response.json(resultado.rows[0], { status: 201 })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const { fecha } = await request.json()
    await pool.query('DELETE FROM feriados WHERE fecha = $1', [fecha])
    return Response.json({ ok: true })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}