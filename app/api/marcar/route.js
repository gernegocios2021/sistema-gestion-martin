import pool from '../../db'
import jwt from 'jsonwebtoken'

const SECRET = 'sistema_martin_qr_2026'

export async function GET() {
  // Genera un token válido por 30 segundos
  const token = jwt.sign({ ts: Date.now() }, SECRET, { expiresIn: '30s' })
  return Response.json({ token })
}

export async function POST(request) {
  try {
    const { empleado_id, token } = await request.json()

    // Verificar que el token sea válido
    try {
      jwt.verify(token, SECRET)
    } catch (e) {
      return Response.json({ error: 'QR vencido, escaneá de nuevo' }, { status: 401 })
    }

    const hoy = new Date().toISOString().split('T')[0]
    const horaActual = new Date().toTimeString().split(' ')[0].slice(0, 5)

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