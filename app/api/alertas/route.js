import pool from '../../db'
import { Resend } from 'resend'

export async function POST() {
  try {
    if (!process.env.RESEND_API_KEY) {
      return Response.json({
        ok: false,
        mensaje: 'API key de Resend no configurada'
      }, { status: 500 })
    }

    const resend = new Resend(process.env.RESEND_API_KEY)

    // Buscar productos con stock bajo o igual al mínimo
    const resultado = await pool.query(`
      SELECT nombre, stock_actual, stock_minimo, unidad
      FROM productos
      WHERE stock_actual <= stock_minimo
      ORDER BY nombre
    `)

    const productosConStockBajo = resultado.rows

    if (productosConStockBajo.length === 0) {
      return Response.json({ mensaje: 'No hay productos con stock bajo' })
    }

    const listaProductos = productosConStockBajo
      .map(p => `• ${p.nombre}: ${p.stock_actual} ${p.unidad} (mínimo: ${p.stock_minimo})`)
      .join('\n')

    await resend.emails.send({
      from: 'GestiónPro <onboarding@resend.dev>',
      to: 'gernegocios2021@gmail.com',
      subject: `⚠️ Alerta de stock bajo — ${productosConStockBajo.length} producto(s)`,
      html: `
        <h2>⚠️ Alerta de stock bajo</h2>
        <p>Los siguientes productos están en o por debajo del stock mínimo:</p>
        <pre style="background:#f5f5f5;padding:16px;border-radius:8px;font-size:14px;">${listaProductos}</pre>
        <p style="color:#666;font-size:12px;">GestiónPro</p>
      `
    })

    return Response.json({
      ok: true,
      mensaje: `Alerta enviada — ${productosConStockBajo.length} producto(s) con stock bajo`,
      productos: productosConStockBajo
    })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}