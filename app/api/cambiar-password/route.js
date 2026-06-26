import pool from '../../db'
import bcrypt from 'bcryptjs'
import { jwtVerify } from 'jose'

const SECRET = process.env.JWT_SECRET || 'sistema_martin_qr_2026'

export async function POST(request) {
  try {
    // Identificar quién es por la cookie de sesión
    const token = request.cookies.get('sesion')?.value
    if (!token) {
      return Response.json({ error: 'No autorizado' }, { status: 401 })
    }

    let sesion
    try {
      const { payload } = await jwtVerify(token, new TextEncoder().encode(SECRET))
      sesion = payload
    } catch {
      return Response.json({ error: 'Sesión vencida' }, { status: 401 })
    }

    const { password_actual, password_nueva } = await request.json()
    if (!password_actual || !password_nueva) {
      return Response.json({ error: 'Completá ambos campos' }, { status: 400 })
    }
    if (password_nueva.length < 4) {
      return Response.json({ error: 'La nueva contraseña es muy corta' }, { status: 400 })
    }

    // Traer el usuario logueado
    const r = await pool.query('SELECT * FROM usuarios WHERE id = $1', [sesion.id])
    if (r.rows.length === 0) {
      return Response.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }
    const u = r.rows[0]

    // Verificar que la contraseña actual sea correcta
    const ok = await bcrypt.compare(password_actual, u.password_hash)
    if (!ok) {
      return Response.json({ error: 'La contraseña actual es incorrecta' }, { status: 401 })
    }

    // Guardar la nueva (encriptada)
    const nuevoHash = await bcrypt.hash(password_nueva, 10)
    await pool.query(
      'UPDATE usuarios SET password_hash = $1 WHERE id = $2',
      [nuevoHash, u.id]
    )

    return Response.json({ ok: true })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}