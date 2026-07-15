import pool from '../../../db'

// Tasas de IVA disponibles: 21% (id 5) es la habitual; 10.5% (id 4) aplica en ciertos
// casos de aberturas de aluminio para vivienda, según decida Martín al facturar.
const TASAS_IVA = {
  21: { id: 5, factor: 1.21 },
  10.5: { id: 4, factor: 1.105 }
}

// Determina el tipo de comprobante según la condición de IVA del cliente:
// Responsable Inscripto (4) -> Factura A (1). Cualquier otro -> Factura B (6).
function tipoComprobantePorClienteIVA(idTipoIVA) {
  return Number(idTipoIVA) === 4 ? 1 : 6
}

export async function POST(request) {
  try {
    const {
      venta_id,
      cliente_nombre,
      cliente_documento,
      cliente_tipo_documento,
      cliente_tipo_iva,
      es_produccion,
      tasa_iva
    } = await request.json()

    if (!venta_id) {
      return Response.json({ error: 'Falta el id de la venta' }, { status: 400 })
    }

    const tasaElegida = TASAS_IVA[Number(tasa_iva)] || TASAS_IVA[21]

    const ventaRes = await pool.query('SELECT * FROM ventas WHERE id = $1', [venta_id])
    if (ventaRes.rows.length === 0) {
      return Response.json({ error: 'Venta no encontrada' }, { status: 404 })
    }
    const venta = ventaRes.rows[0]

    if (venta.factura_cae) {
      return Response.json({ error: 'Esta venta ya tiene una factura emitida (CAE existente)' }, { status: 409 })
    }

    const itemsRes = await pool.query(
      `SELECT vi.cantidad, vi.precio_unitario, p.nombre, p.id as producto_id
       FROM venta_items vi
       LEFT JOIN productos p ON p.id = vi.producto_id
       WHERE vi.venta_id = $1`,
      [venta_id]
    )

    const productos = itemsRes.rows.map((item) => ({
      CodigoProducto: String(item.producto_id || 'SIN-COD'),
      DescripcionProducto: (item.nombre || 'Producto').slice(0, 500),
      Cantidad: Number(item.cantidad),
      PrecioVentaSinIVA: Number((Number(item.precio_unitario) / tasaElegida.factor).toFixed(2)),
      IdTasaIVA: tasaElegida.id,
      PorcentajeDescuento: 0
    }))

    const instalacion = Number(venta.instalacion) || 0
    if (instalacion > 0) {
      productos.push({
        CodigoProducto: 'INSTALACION',
        DescripcionProducto: 'Servicio de instalación',
        Cantidad: 1,
        PrecioVentaSinIVA: Number((instalacion / tasaElegida.factor).toFixed(2)),
        IdTasaIVA: tasaElegida.id,
        PorcentajeDescuento: 0
      })
    }

    const fechaVenta = new Date(venta.fecha).toISOString().split('T')[0]
    const idConcepto = instalacion > 0 ? 3 : 1 // 3 = Bienes y Servicios, 1 = Bienes

    const idTipoIVA = Number(cliente_tipo_iva) || 1 // 1 = Consumidor Final por defecto
    const esConsumidorFinalSinDatos = idTipoIVA === 1 && !cliente_documento

    const cliente = esConsumidorFinalSinDatos
      ? {
          IdTipoDocumento: 99, // Doc. (Otro), requerido por ARCA para consumidor final anónimo
          DocumentoCliente: '0',
          NombreCliente: '',
          IdTipoIVA: idTipoIVA
        }
      : {
          IdTipoDocumento: Number(cliente_tipo_documento) || 96,
          DocumentoCliente: cliente_documento,
          NombreCliente: cliente_nombre || '',
          IdTipoIVA: idTipoIVA
        }

    const esProduccion = Boolean(es_produccion)
    const apiToken = esProduccion ? process.env.HOLAFACTURA_API_TOKEN : process.env.HOLAFACTURA_API_TOKEN_TESTING

    const body = {
      ApiKey: process.env.HOLAFACTURA_API_KEY,
      ApiToken: apiToken,
      EsProduccion: esProduccion,
      EsBorrador: false,
      Comprobante: {
        Cliente: cliente,
        PuntoVenta: Number(process.env.HOLAFACTURA_PUNTO_VENTA),
        IdTipoComprobante: tipoComprobantePorClienteIVA(idTipoIVA),
        Fecha: fechaVenta,
        IdConcepto: idConcepto,
        ...(idConcepto !== 1
          ? { FechaDesdeServ: fechaVenta, FechaHastaServ: fechaVenta, FechaVtoPago: fechaVenta }
          : {}),
        IdCondicionVenta: 1, // Contado
        Moneda: 'PES',
        Cotizacion: 1,
        Productos: productos,
        Observaciones: venta.observaciones || ''
      }
    }

    const respuestaHF = await fetch('https://api.holafactura.com/v1/ComprobanteVenta/Autorizar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    const dataHF = await respuestaHF.json()

    if (dataHF.Errores && dataHF.Errores.length > 0) {
      return Response.json({ error: dataHF.Errores.map((e) => e.Mensaje).join(' | ') }, { status: 400 })
    }

    await pool.query(
      `UPDATE ventas SET
        cliente_nombre = $1, cliente_documento = $2, cliente_tipo_documento = $3, cliente_tipo_iva = $4,
        factura_cae = $5, factura_numero = $6, factura_vto_cae = $7, factura_tipo_comprobante = $8, factura_es_produccion = $9
       WHERE id = $10`,
      [
        cliente_nombre || null,
        cliente_documento || null,
        Number(cliente_tipo_documento) || 96,
        idTipoIVA,
        dataHF.CAE,
        dataHF.NumeroComprobante,
        dataHF.FechaVtoCAE,
        tipoComprobantePorClienteIVA(idTipoIVA),
        esProduccion,
        venta_id
      ]
    )

    return Response.json(dataHF, { status: 201 })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}