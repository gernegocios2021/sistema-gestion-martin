import pool from '../../../db'

// GET: devuelve el panel de facturación de TODOS los negocios.
// - Congela automáticamente cualquier mes YA TERMINADO que aún no esté en el historial.
// - Calcula el mes EN CURSO en vivo.
// Cobro:
//   plan 'membresía'  -> paga precio_membresía fijo (no importa cuánto facture)
//   plan 'comisión'   -> paga el MAYOR entre piso_minimo y (ventas_del_mes * comision_porcentaje / 100)

export async function GET() {
  try {
    const negocios = await pool.query(
      `SELECT id, nombre, tipo_negocio, plan, precio_membresía,
              comision_porcentaje, piso_minimo, activo
       FROM negocio
       ORDER BY id`
    )

    const ahora = new Date()
    const añoActual = ahora.getFullYear()
    const mesActual = ahora.getMonth() + 1 // getMonth() es 0-11

    const resultado = []

    for (const neg of negocios.rows) {
      // --- 1. Ventas del MES EN CURSO (en vivo) ---
      const ventasMes = await pool.query(
        `SELECT COALESCE(SUM(total), 0) AS total
         FROM ventas
         WHERE negocio_id = $1
           AND EXTRACT(YEAR FROM fecha) = $2
           AND EXTRACT(MONTH FROM fecha) = $3`,
        [neg.id, añoActual, mesActual]
      )
      const facturadoMesActual = parseFloat(ventasMes.rows[0].total) || 0
      const cobroMesActual = calcularCobro(neg, facturadoMesActual)

      // --- 2. Auto-congelar meses YA TERMINADOS que falten en el historial ---
      // Buscamos el primer mes con ventas de este negocio, y recorremos hasta el mes pasado.
      const primeraVenta = await pool.query(
        `SELECT MIN(fecha) AS min_fecha FROM ventas WHERE negocio_id = $1`,
        [neg.id]
      )

      if (primeraVenta.rows[0].min_fecha) {
        const desde = new Date(primeraVenta.rows[0].min_fecha)
        let año = desde.getFullYear()
        let mes = desde.getMonth() + 1

        // Recorremos desde el primer mes con ventas hasta el mes ANTERIOR al actual
        while (año < añoActual || (año === añoActual && mes < mesActual)) {
          // ¿Ya está congelado?
          const existe = await pool.query(
            `SELECT id FROM facturacion_mensual
             WHERE negocio_id = $1 AND año = $2 AND mes = $3`,
            [neg.id, año, mes]
          )

          if (existe.rows.length === 0) {
            // Calcular total de ese mes terminado
            const ventasHist = await pool.query(
              `SELECT COALESCE(SUM(total), 0) AS total
               FROM ventas
               WHERE negocio_id = $1
                 AND EXTRACT(YEAR FROM fecha) = $2
                 AND EXTRACT(MONTH FROM fecha) = $3`,
              [neg.id, año, mes]
            )
            const totalHist = parseFloat(ventasHist.rows[0].total) || 0
            const cobroHist = calcularCobro(neg, totalHist)

            // Congelar en el historial
            await pool.query(
              `INSERT INTO facturacion_mensual
                 (negocio_id, año, mes, total_facturado, comision_calculada, estado)
               VALUES ($1, $2, $3, $4, $5, 'pendiente')
               ON CONFLICT (negocio_id, año, mes) DO NOTHING`,
              [neg.id, año, mes, totalHist, cobroHist]
            )
          }

          // Avanzar al mes siguiente
          mes++
          if (mes > 12) { mes = 1; año++ }
        }
      }

      // --- 3. Traer el historial ya congelado de este negocio ---
      const historial = await pool.query(
        `SELECT año, mes, total_facturado, comision_calculada, estado, fecha_pago
         FROM facturacion_mensual
         WHERE negocio_id = $1
         ORDER BY año DESC, mes DESC`,
        [neg.id]
      )

      resultado.push({
        id: neg.id,
        nombre: neg.nombre,
        tipo_negocio: neg.tipo_negocio,
        plan: neg.plan,
        activo: neg.activo,
        mes_actual: {
          año: añoActual,
          mes: mesActual,
          facturado: facturadoMesActual,
          a_cobrar: cobroMesActual
        },
        historial: historial.rows.map(h => ({
          año: h.año,
          mes: h.mes,
          total_facturado: parseFloat(h.total_facturado) || 0,
          a_cobrar: parseFloat(h.comision_calculada) || 0,
          estado: h.estado,
          fecha_pago: h.fecha_pago
        }))
      })
    }

    // --- 4. Total general esperado este mes ---
    const totalEsperadoMes = resultado
      .filter(n => n.activo)
      .reduce((sum, n) => sum + n.mes_actual.a_cobrar, 0)

    return Response.json({
      total_esperado_mes_actual: totalEsperadoMes,
      negocios: resultado
    })
  } catch (error) {
    console.error('[admin/facturacion] ERROR:', error.message)
    return Response.json({ error: error.message }, { status: 500 })
  }
}

// Lógica de cobro según el plan del negocio
function calcularCobro(negocio, facturado) {
  if (negocio.plan === 'membresía') {
    return parseFloat(negocio.precio_membresía) || 0
  }
  // plan comisión: el mayor entre piso y el %
  const piso = parseFloat(negocio.piso_minimo) || 0
  const porcentaje = parseFloat(negocio.comision_porcentaje) || 0
  const comision = facturado * (porcentaje / 100)
  return Math.max(piso, comision)
}