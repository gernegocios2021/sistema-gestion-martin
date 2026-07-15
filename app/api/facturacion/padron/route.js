export async function POST(request) {
  try {
    const { documento } = await request.json()
    if (!documento) {
      return Response.json({ error: 'Falta el documento' }, { status: 400 })
    }

    const respuestaHF = await fetch('https://api.holafactura.com/v1/consultas/consultarpadron', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ApiKey: process.env.HOLAFACTURA_API_KEY,
        ApiToken: process.env.HOLAFACTURA_API_TOKEN,
        EsProduccion: true,
        Documento: Number(documento)
      })
    })

    const data = await respuestaHF.json()

    if (data.Errores && data.Errores.length > 0) {
      return Response.json({ error: data.Errores.map((e) => e.Mensaje).join(' | ') }, { status: 400 })
    }
    if (!data.nombre && !data.razonSocial) {
      return Response.json({ error: 'No se encontraron datos para ese documento' }, { status: 404 })
    }

    const nombreCompleto = data.razonSocial || `${data.nombre || ''} ${data.apellido || ''}`.trim()
    const domicilio = data.domicilio && data.domicilio[0] ? data.domicilio[0] : null

    return Response.json({
      nombre: nombreCompleto,
      tipoPersona: data.tipoPersona,
      direccion: domicilio ? `${domicilio.direccion || ''}, ${domicilio.localidad || ''} ${domicilio.descripcionProvincia || ''}`.trim() : ''
    })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}