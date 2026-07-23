import pool from '../../db'

// Fecha y hora actual en zona horaria de Argentina (igual que en /api/marcar)
function fechaYHoraArgentina() {
  const ahora = new Date()
  const fecha = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Argentina/Cordoba',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(ahora) // YYYY-MM-DD

  const hora = new Intl.DateTimeFormat('es-AR', {
    timeZone: 'America/Argentina/Cordoba',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(ahora) // HH:MM

  return { fecha, hora }
}

export async function GET() {
  try {
    const { fecha: hoy, hora: horaActual } = fechaYHoraArgentina()

    const resultado = await pool.query(
      `SELECT a.id, a.empleado_id, a.hora_entrada, e.nombre, e.apellido, e.cargo
       FROM asistencia a
       JOIN empleados e ON e.id = a.empleado_id
       WHERE a.fecha = $1
         AND a.hora_entrada IS NOT NULL
         AND a.hora_salida IS NULL
       ORDER BY a.hora_entrada`,
      [hoy]
    )

    // Calcular cuánto lleva trabajando cada uno hasta este momento
    const presentes = resultado.rows.map((r) => {
      const entrada = new Date(`2000-01-01T${r.hora_entrada}`)
      const ahora = new Date(`2000-01-01T${horaActual}`)
      const horas = (ahora - entrada) / (1000 * 60 * 60)
      return {
        ...r,
        hora_entrada: String(r.hora_entrada).slice(0, 5), // HH:MM
        horas_hasta_ahora: horas > 0 ? horas.toFixed(1) : '0.0'
      }
    })

    return Response.json({ hora_consulta: horaActual, presentes })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}