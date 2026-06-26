import pkg from 'pg'
const { Pool } = pkg

// Detecta si la conexión es a la base en la nube (Railway).
// La conexión pública de Railway requiere SSL; la local (localhost) y la
// interna de Railway, no.
const host = process.env.DB_HOST || ''
const necesitaSSL = host.includes('rlwy.net') || host.includes('railway')

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: necesitaSSL ? { rejectUnauthorized: false } : false,
})

export default pool