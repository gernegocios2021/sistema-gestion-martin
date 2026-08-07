import pool from '../../db'
import jwt from 'jsonwebtoken'
import { revalidatePath } from 'next/cache'

const SECRET = process.env.JWT_SECRET || 'sistema_martin_qr_2026'

function fechaYHoraArgentina() {
  const ahora = new Date()
  const fecha = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Argentina/Cordoba',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(ahora)

  const hora = new Intl.DateTimeFormat('es-AR', {
    timeZone: 'America/Argentina/Cordoba',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(ahora)

  return { fecha, hora }
}

export async function GET(request) {
  const negocioId = request.headers.get('x-negocio-id') || null
  const token = jwt.sign({ ts: Date.now(), negocio_id: negocioId }, SECRET, { expiresIn: '60s' })
  return Response.json({ token })
}

export async function POST(request) {
  try {
    const { device_id, token } = await request.json()

    try {
      jwt.verify(token, SECRET)
    } catch (e) {
      return Response.json({ error: 'QR vencido, escaneá de nuevo' }, { status: 401 })
    }

    const disp = await pool.query(
      'SELECT empleado_id FROM dispositivos WHERE device_id = $1',
      [device_id]
    )
    if (disp.rows.length === 0) {
      return Response.json({ error: 'Este celular no está vinculado' }, { status: 403 })
    }
    const empleado_id = disp.rows[0].empleado_id

    // Traer el negocio_id del empleado
    const empRes = await pool.query(
      'SELECT negocio_id FROM empleados WHERE id = $1',
      [empleado_id]
    )
    const negocio_id = empRes.rows[0]?.negocio_id || 1

    const { fecha: hoy, hora: horaActual } = fechaYHoraArgentina()

    const registro = await pool.query(
      'SELECT * FROM asistencia WHERE empleado_id = $1 AND fecha = $2',
      [empleado_id, hoy]
    )

    if (registro.rows.length === 0) {
      await pool.query(
        'INSERT INTO asistencia (empleado_id, fecha, hora_entrada, negocio_id) VALUES ($1, $2, $3, $4)',
        [empleado_id, hoy, horaActual, negocio_id]
      )
      revalidatePath('/')
      return Response.json({ accion: 'entrada', hora: horaActual })
    } else if (!registro.rows[0].hora_salida) {
      const entrada = new Date(`2000-01-01T${registro.rows[0].hora_entrada}`)
      const salida = new Date(`2000-01-01T${horaActual}`)
      const horas = (salida - entrada) / (1000 * 60 * 60)

      await pool.query(
        'UPDATE asistencia SET hora_salida = $1, horas_trabajadas = $2 WHERE empleado_id = $3 AND fecha = $4',
        [horaActual, horas, empleado_id, hoy]
      )

      revalidatePath('/')

      return Response.json({ accion: 'salida', hora: horaActual, horas_trabajadas: horas.toFixed(1) })
    } else {
      return Response.json({ accion: 'ya_registrado', mensaje: 'Ya tenés entrada y salida registradas hoy' })
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}