import pool from '../../../db'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const ventaId = searchParams.get('venta_id')

    if (!ventaId) {
      return Response.json({ error: 'Falta venta_id' }, { status: 400 })
    }

    const ventaRes = await pool.query(
      'SELECT factura_id_comprobante, factura_es_produccion FROM ventas WHERE id = $1',
      [ventaId]
    )
    if (ventaRes.rows.length === 0 || !ventaRes.rows[0].factura_id_comprobante) {
      return Response.json({ error: 'Esta venta no tiene una factura emitida' }, { status: 404 })
    }

    const { factura_id_comprobante, factura_es_produccion } = ventaRes.rows[0]
    const apiToken = factura_es_produccion ? process.env.HOLAFACTURA_API_TOKEN : process.env.HOLAFACTURA_API_TOKEN_TESTING

    const respuestaHF = await fetch('https://api.holafactura.com/v1/ComprobanteVenta/PDF', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ApiKey: process.env.HOLAFACTURA_API_KEY,
        ApiToken: apiToken,
        EsProduccion: Boolean(factura_es_produccion),
        Comprobante: {
          IdComprobante: Number(factura_id_comprobante),
          PuntoVenta: '',
          IdTipoComprobante: '',
          NumeroComprobante: ''
        }
      })
    })

    const contentType = respuestaHF.headers.get('content-type') || ''

    if (contentType.includes('application/json')) {
      const dataError = await respuestaHF.json()
      return Response.json({ error: dataError.Errores ? dataError.Errores.map(e => e.Mensaje).join(' | ') : 'Error al obtener el PDF' }, { status: 400 })
    }

    const pdfBuffer = await respuestaHF.arrayBuffer()
    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="factura-venta-${ventaId}.pdf"`
      }
    })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}