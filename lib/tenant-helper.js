import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'sistema_martin_qr_2026');

/**
 * Extrae negocio_id del token JWT desde la cookie
 * Se usa en APIs para filtrar datos por tenant
 */
export async function getTenantIdFromRequest(request) {
  try {
    // Obtener cookie del request
    const cookieHeader = request.headers.get('cookie');
    if (!cookieHeader) {
      throw new Error('No hay cookie de sesión');
    }

    // Parsear cookie 'sesion'
    const cookies = Object.fromEntries(
      cookieHeader.split('; ').map(c => c.split('='))
    );
    const token = cookies.sesion;

    if (!token) {
      throw new Error('Token no encontrado');
    }

    // Verificar y decodificar JWT
    const { payload } = await jwtVerify(token, secret);
    
    return payload.negocio_id;
  } catch (error) {
    console.error('Error extrayendo tenant ID:', error.message);
    return null;
  }
}

/**
 * Valida que el usuario tenga acceso al negocio
 */
export async function validateTenantAccess(request, requiredTenantId) {
  const tenantId = await getTenantIdFromRequest(request);
  
  if (!tenantId || tenantId !== requiredTenantId) {
    return false;
  }
  
  return true;
}