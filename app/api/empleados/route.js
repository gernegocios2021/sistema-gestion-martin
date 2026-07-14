import pool from '../../db'

export async function GET() {
  try {
    const resultado = await pool.query('SELECT * FROM empleados WHERE activo = TRUE ORDER BY apellido')
    return Response.json(resultado.rows)
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const { nombre, apellido, dni, cargo, fecha_ingreso, sueldo_mensual } = await request.json()
    const resultado = await pool.query(
      'INSERT INTO empleados (nombre, apellido, dni, cargo, fecha_ingreso, sueldo_mensual) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [nombre, apellido, dni, cargo, fecha_ingreso, Number(sueldo_mensual) || 0]
    )
    return Response.json(resultado.rows[0], { status: 201 })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request) {
  try {
    const { id, nombre, apellido, dni, cargo, fecha_ingreso, sueldo_mensual } = await request.json()
    const resultado = await pool.query(
      'UPDATE empleados SET nombre=$1, apellido=$2, dni=$3, cargo=$4, fecha_ingreso=$5, sueldo_mensual=$6 WHERE id=$7 RETURNING *',
      [nombre, apellido, dni, cargo, fecha_ingreso, Number(sueldo_mensual) || 0, id]
    )
    return Response.json(resultado.rows[0])
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const { id } = await request.json()
    await pool.query('UPDATE empleados SET activo = FALSE WHERE id = $1', [id])
    return Response.json({ ok: true })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}