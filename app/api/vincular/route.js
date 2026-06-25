import pool from '../../db'

// Vincula un device_id a un empleado, solo si la clave de admin es correcta.
export async function POST(request) {
  try {
    const { device_id, empleado_id, clave_admin } = await request.json()

    if (!device_id || !empleado_id) {
      return Response.json({ error: 'Faltan datos' }, { status: 400 })
    }

    // Validar la clave de administrador
    if (clave_admin !== process.env.CLAVE_ADMIN) {
      return Response.json({ error: 'Clave de administrador incorrecta' }, { status: 401 })
    }

    // ¿Este celular ya está vinculado a alguien?
    const existe = await pool.query(
      'SELECT empleado_id FROM dispositivos WHERE device_id = $1',
      [device_id]
    )
    if (existe.rows.length > 0) {
      return Response.json({ error: 'Este celular ya está vinculado' }, { status: 409 })
    }

    // Guardar la vinculación
    await pool.query(
      'INSERT INTO dispositivos (empleado_id, device_id) VALUES ($1, $2)',
      [empleado_id, device_id]
    )

    return Response.json({ ok: true })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}