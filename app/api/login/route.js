import pool from '../../db'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const SECRET = process.env.JWT_SECRET || 'sistema_martin_qr_2026'

export async function POST(request) {
  try {
    const { usuario, password } = await request.json()

    if (!usuario || !password) {
      return Response.json({ error: 'Faltan datos' }, { status: 400 })
    }

    const r = await pool.query(
      'SELECT * FROM usuarios WHERE usuario = $1',
      [usuario.toLowerCase()]
    )
    if (r.rows.length === 0) {
      return Response.json({ error: 'Usuario o contraseña incorrectos' }, { status: 401 })
    }

    const u = r.rows[0]

    const passwordOk = await bcrypt.compare(password, u.password_hash)
    if (!passwordOk) {
      return Response.json({ error: 'Usuario o contraseña incorrectos' }, { status: 401 })
    }

    const token = jwt.sign(
      { 
        id: u.id, 
        usuario: u.usuario, 
        nombre: u.nombre,
        negocio_id: u.negocio_id,
        rol: u.rol || 'admin'
      },
      SECRET,
      { expiresIn: '8h' }
    )

    const res = Response.json({ ok: true, nombre: u.nombre })
    res.headers.set(
      'Set-Cookie',
      `sesion=${token}; HttpOnly; Path=/; Max-Age=28800; SameSite=Lax`
    )
    return res
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}