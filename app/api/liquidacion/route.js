import pool from '../../db'

const HORAS_POR_DIA = 8

// Cuenta cuántos días de Lunes a Sábado hay en un mes dado (año, mes 1-12).
function diasLaborablesDelMes(anio, mes) {
  const diasEnElMes = new Date(anio, mes, 0).getDate()
  let contador = 0
  for (let d = 1; d <= diasEnElMes; d++) {
    const fecha = new Date(anio, mes - 1, d)
    const diaSemana = fecha.getDay() // 0 = domingo, 1 = lunes, ..., 6 = sábado
    if (diaSemana !== 0) contador++ // cuenta todo menos domingo
  }
  return contador
}

// GET /api/liquidacion?anio=2026&mes=7
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const anio = Number(searchParams.get('anio'))
    const mes = Number(searchParams.get('mes')) // 1-12

    if (!anio || !mes) {
      return Response.json({ error: 'Faltan año y mes' }, { status: 400 })
    }

    const primerDia = `${anio}-${String(mes).padStart(2, '0')}-01`
    const ultimoDiaNum = new Date(anio, mes, 0).getDate()
    const ultimoDia = `${anio}-${String(mes).padStart(2, '0')}-${String(ultimoDiaNum).padStart(2, '0')}`

    const empleados = await pool.query('SELECT * FROM empleados WHERE activo = TRUE ORDER BY apellido')

    const feriados = await pool.query(
      'SELECT fecha FROM feriados WHERE fecha >= $1 AND fecha <= $2',
      [primerDia, ultimoDia]
    )
    const feriadosDelMes = feriados.rows.map((f) => f.fecha.toISOString().split('T')[0])

    const diasLaborables = diasLaborablesDelMes(anio, mes)
    const horasEsperadasMes = diasLaborables * HORAS_POR_DIA

    const resultado = await Promise.all(
      empleados.rows.map(async (emp) => {
        const asistencia = await pool.query(
          'SELECT fecha, horas_trabajadas FROM asistencia WHERE empleado_id = $1 AND fecha >= $2 AND fecha <= $3 AND horas_trabajadas IS NOT NULL',
          [emp.id, primerDia, ultimoDia]
        )

        const diasAsistidos = new Set()
        let horasNormales = 0
        let horasFeriadosTrabajados = 0

        for (const registro of asistencia.rows) {
          const fechaStr = registro.fecha.toISOString().split('T')[0]
          diasAsistidos.add(fechaStr)
          const horas = Number(registro.horas_trabajadas) || 0

          if (feriadosDelMes.includes(fechaStr)) {
            horasFeriadosTrabajados += horas
          } else {
            horasNormales += horas
          }
        }

        // Feriados NO trabajados: se pagan igual, como un día normal
        const feriadosNoTrabajados = feriadosDelMes.filter((f) => !diasAsistidos.has(f))
        const horasFeriadosNoTrabajados = feriadosNoTrabajados.length * HORAS_POR_DIA

        const horasPagables = horasNormales + (horasFeriadosTrabajados * 2) + horasFeriadosNoTrabajados

        const sueldoMensual = Number(emp.sueldo_mensual) || 0
        const valorHora = horasEsperadasMes > 0 ? sueldoMensual / horasEsperadasMes : 0
        const sueldoAPagar = valorHora * horasPagables

        return {
          empleado_id: emp.id,
          nombre: emp.nombre,
          apellido: emp.apellido,
          sueldo_mensual: sueldoMensual,
          valor_hora: valorHora,
          horas_normales: horasNormales,
          horas_feriados_trabajados: horasFeriadosTrabajados,
          feriados_no_trabajados: feriadosNoTrabajados.length,
          horas_pagables: horasPagables,
          sueldo_a_pagar: sueldoAPagar
        }
      })
    )

    return Response.json({
      anio,
      mes,
      dias_laborables: diasLaborables,
      horas_esperadas_mes: horasEsperadasMes,
      feriados_del_mes: feriadosDelMes,
      empleados: resultado
    })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}