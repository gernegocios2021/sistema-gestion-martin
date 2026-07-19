import pool from '../../db'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

// Función para obtener fecha y hora en zona horaria de Argentina
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

export async function POST(request) {
  try {
    const { device_id } = await request.json()

    if (!device_id) {
      return Response.json({ error: 'device_id requerido' }, { status: 400 })
    }

    // Obtener el empleado vinculado
    const disp = await pool.query(
      'SELECT empleado_id FROM dispositivos WHERE device_id = $1',
      [device_id]
    )
    if (disp.rows.length === 0) {
      return Response.json({ error: 'Celular no vinculado' }, { status: 403 })
    }
    const empleado_id = disp.rows[0].empleado_id

    // Obtener fecha hoy
    const { fecha: hoy } = fechaYHoraArgentina()

    // Buscar registro de hoy con salida ya marcada
    const registro = await pool.query(
      'SELECT * FROM asistencia WHERE empleado_id = $1 AND fecha = $2 AND hora_salida IS NOT NULL',
      [empleado_id, hoy]
    )

    if (registro.rows.length === 0) {
      return Response.json(
        { error: 'No hay salida registrada para hoy' },
        { status: 400 }
      )
    }

    const asistencia = registro.rows[0]

    // Validar que no haya tocado comida ya
    if (asistencia.comida_marcada) {
      return Response.json(
        { error: 'Ya marcaste comida hoy' },
        { status: 400 }
      )
    }

    // Sumar 0.5 horas
    const nuevasHoras = parseFloat(asistencia.horas_trabajadas) + 0.5

    // Actualizar: suma 0.5h y marca comida_marcada = TRUE
    await pool.query(
      'UPDATE asistencia SET horas_trabajadas = $1, comida_marcada = TRUE WHERE id = $2',
      [nuevasHoras, asistencia.id]
    )

    // Obtener datos del empleado para el email
    const emp = await pool.query(
      'SELECT nombre, apellido FROM empleados WHERE id = $1',
      [empleado_id]
    )
    const nombreEmpleado = emp.rows.length > 0 
      ? `${emp.rows[0].nombre} ${emp.rows[0].apellido}`
      : `Empleado ${empleado_id}`

    // Enviar email a Germán
    try {
      await resend.emails.send({
        from: 'GestiónPro <onboarding@resend.dev>',
        to: process.env.EMAIL_ALERTAS, // Tu email
        subject: `🍴 ${nombreEmpleado} marcó comida`,
        html: `
          <h2>Botón Comida Activado</h2>
          <p><strong>${nombreEmpleado}</strong> tocó el botón de comida.</p>
          <p>
            <strong>+0.5 horas agregadas</strong><br>
            Total hoy: ${nuevasHoras.toFixed(1)}h
          </p>
          <p style="color: #666; font-size: 12px;">
            Verifica en GestiónPro si esto es correcto.
          </p>
        `,
      })
    } catch (emailError) {
      console.error('Error enviando email:', emailError)
      // No bloqueamos si el email falla, la marca de comida ya se guardó
    }

    return Response.json({
      success: true,
      mensaje: `✓ Comida marcada! +0.5h (Total: ${nuevasHoras.toFixed(1)}h)`,
      horas_totales: nuevasHoras.toFixed(1),
    })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}