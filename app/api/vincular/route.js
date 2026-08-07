import pool from '../../db'

export async function POST(request) {
  try {
    const { device_id, empleado_id, clave_admin } = await request.json()
    if (!device_id || !empleado_id) {
      return Response.json({ error: 'Faltan datos' }, { status: 400 })
    }

    // Buscar el negocio_id del empleado
    const empleadoRes = await pool.query(
      'SELECT negocio_id FROM empleados WHERE id = $1',
      [empleado_id]
    )
    if (empleadoRes.rows.length === 0) {
      return Response.json({ error: 'Empleado no encontrado' }, { status: 404 })
    }
    const negocioId = empleadoRes.rows[0].negocio_id

    // Buscar la clave de admin de ese negocio
    const negocioRes = await pool.query(
      'SELECT clave_admin_vinculacion FROM negocio WHERE id = $1',
      [negocioId]
    )
    const claveEsperada = negocioRes.rows[0]?.clave_admin_vinculacion || process.env.CLAVE_ADMIN

    if (clave_admin !== claveEsperada) {
      return Response.json({ error: 'Clave de administrador incorrecta' }, { status: 401 })
    }

    const existe = await pool.query(
      'SELECT empleado_id FROM dispositivos WHERE device_id = $1',
      [device_id]
    )
    if (existe.rows.length > 0) {
      return Response.json({ error: 'Este celular ya está vinculado' }, { status: 409 })
    }

    await pool.query(
      'INSERT INTO dispositivos (empleado_id, device_id) VALUES ($1, $2)',
      [empleado_id, device_id]
    )
    return Response.json({ ok: true })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}