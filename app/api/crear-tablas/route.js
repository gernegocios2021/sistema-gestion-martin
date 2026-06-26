// RUTA TEMPORAL - crea todas las tablas. Borrar después de usarla.
import pool from '../../db'

export async function GET() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS empleados (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        apellido VARCHAR(100) NOT NULL,
        dni VARCHAR(20),
        cargo VARCHAR(100),
        fecha_ingreso DATE,
        activo BOOLEAN DEFAULT true
      );

      CREATE TABLE IF NOT EXISTS asistencia (
        id SERIAL PRIMARY KEY,
        empleado_id INTEGER NOT NULL REFERENCES empleados(id),
        fecha DATE NOT NULL,
        hora_entrada TIME,
        hora_salida TIME,
        horas_trabajadas NUMERIC
      );

      CREATE TABLE IF NOT EXISTS dispositivos (
        id SERIAL PRIMARY KEY,
        empleado_id INTEGER NOT NULL REFERENCES empleados(id),
        device_id TEXT NOT NULL UNIQUE,
        vinculado_en TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS productos (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(200) NOT NULL,
        unidad VARCHAR(50),
        stock_actual INTEGER DEFAULT 0,
        stock_minimo INTEGER DEFAULT 0,
        categoria VARCHAR(50) DEFAULT 'materia_prima'
      );

      CREATE TABLE IF NOT EXISTS ventas (
        id SERIAL PRIMARY KEY,
        total NUMERIC NOT NULL DEFAULT 0,
        observaciones TEXT,
        fecha TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS venta_items (
        id SERIAL PRIMARY KEY,
        venta_id INTEGER NOT NULL REFERENCES ventas(id),
        producto_id INTEGER REFERENCES productos(id),
        cantidad INTEGER NOT NULL,
        precio_unitario NUMERIC NOT NULL
      );

      CREATE TABLE IF NOT EXISTS gastos (
        id SERIAL PRIMARY KEY,
        categoria VARCHAR(100),
        descripcion TEXT,
        monto NUMERIC NOT NULL,
        responsable VARCHAR(100),
        fecha TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS presupuestos (
        id SERIAL PRIMARY KEY,
        cliente VARCHAR(200),
        descripcion TEXT,
        monto NUMERIC NOT NULL,
        observaciones TEXT,
        estado VARCHAR(50) DEFAULT 'enviado',
        fecha TIMESTAMP DEFAULT NOW()
      );
    `)
    return Response.json({ ok: true, mensaje: 'Todas las tablas creadas (o ya existían)' })
  } catch (error) {
    return Response.json({ error: error.message, detalle: String(error) }, { status: 500 })
  }
}