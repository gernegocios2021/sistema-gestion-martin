export async function POST() {
  // Borra la cookie de sesión (la vence inmediatamente)
  const res = Response.json({ ok: true })
  res.headers.set(
    'Set-Cookie',
    'sesion=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax'
  )
  return res
}