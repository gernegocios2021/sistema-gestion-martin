// TEMPORAL - solo para verificar. Borrar después.
export async function GET() {
  return Response.json({
    clave_cargada: process.env.CLAVE_ADMIN || 'NO HAY NADA CARGADO',
    largo: (process.env.CLAVE_ADMIN || '').length
  })
}