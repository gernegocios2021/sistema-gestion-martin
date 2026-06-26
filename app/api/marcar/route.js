import pool from '../../db'
import jwt from 'jsonwebtoken'

const SECRET = process.env.JWT_SECRET || 'sistema_martin_qr_2026'

// Devuelve la fecha y hora actual en la zona horaria de Argentina (Córdoba),
// sin importar dónde esté el servidor (Railway está en EE.UU. / UTC).
function fechaYHoraArgentina() {
  const ahora = new Date()
  // Formateamos la hora directamente en la zona de Argentina
  const fecha = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Argentina/Cordoba',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(ahora) // formato YYYY-MM-DD

  const hora = new Intl.DateTimeFormat('es-AR', {
    timeZone: 'America/Argentina/Cordoba',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(ahora) // formato HH:MM

  return { fecha, hora }
}

export async function GET() {
  // Genera un token válido por 60 segundos
  const token = jwt.sign({ ts: Date.now() }, SECRET, { expiresIn: '60s' })
  return Response.json({ token })
}

export async function POST(request) {
  try {
    const { device_id, token } = await request.json()

    // Verificar que el token del QR sea válido (que esté presente en la fábrica)
    try {
      jwt.verify(token, SECRET)
    } catch (e) {
      return Response.json({ error: 'QR vencido, escaneá de nuevo' }, { status: 401 })
    }

    // El servidor decide de quién es este celular (no lo elige el usuario)
    const disp = await pool.query(
      'SELECT empleado_id FROM dispositivos WHERE device_id = $1',
      [device_id]
    )
    if (disp.rows.length === 0) {
      return Response.json({ error: 'Este celular no está vinculado' }, { status: 403 })
    }
    const empleado_id = disp.rows[0].empleado_id

    // Fecha y hora en zona horaria de Argentina
    const { fecha: hoy, hora: horaActual } = fechaYHoraArgentina()

    const registro = await pool.query(
      'SELECT * FROM asistencia WHERE empleado_id = $1 AND fecha = $2',
      [empleado_id, hoy]
    )

    if (registro.rows.length === 0) {
      await pool.query(
        'INSERT INTO asistencia (empleado_id, fecha, hora_entrada) VALUES ($1, $2, $3)',
        [empleado_id, hoy, horaActual]
      )
      return Response.json({ accion: 'entrada', hora: horaActual })
    } else if (!registro.rows[0].hora_salida) {
      const entrada = new Date(`2000-01-01T${registro.rows[0].hora_entrada}`)
      const salida = new Date(`2000-01-01T${horaActual}`)
      const horas = (salida - entrada) / (1000 * 60 * 60)

      await pool.query(
        'UPDATE asistencia SET hora_salida = $1, horas_trabajadas = $2 WHERE empleado_id = $3 AND fecha = $4',
        [horaActual, horas, empleado_id, hoy]
      )
      return Response.json({ accion: 'salida', hora: horaActual, horas_trabajadas: horas.toFixed(1) })
    } else {
      return Response.json({ accion: 'ya_registrado', mensaje: 'Ya tenés entrada y salida registradas hoy' })
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}