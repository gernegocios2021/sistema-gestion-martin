import pool from '../../db'

export async function POST(request) {
  try {
    const { device_id } = await request.json()
    if (!device_id) {
      return Response.json({ vinculado: false })
    }

    const r = await pool.query(
      `SELECT d.empleado_id, e.nombre, e.apellido, n.tipo_negocio
       FROM dispositivos d
       JOIN empleados e ON e.id = d.empleado_id
       JOIN negocio n ON n.id = e.negocio_id
       WHERE d.device_id = $1`,
      [device_id]
    )

    if (r.rows.length === 0) {
      return Response.json({ vinculado: false })
    }

    const emp = r.rows[0]
    return Response.json({
      vinculado: true,
      empleado: { id: emp.empleado_id, nombre: emp.nombre, apellido: emp.apellido },
      tipo_negocio: emp.tipo_negocio,
    })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}