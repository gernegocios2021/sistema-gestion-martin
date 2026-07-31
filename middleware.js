import { jwtVerify } from "jose";
import { NextResponse } from "next/server";

const secret = new TextEncoder().encode(process.env.JWT_SECRET || "sistema_martin_qr_2026");

// APIs que NO necesitan autenticación (QR, login)
const API_PUBLICAS = [
  "/api/login",
  "/api/confirmar",
  "/api/marcar",
  "/api/marcar-comida",
  "/api/dispositivo/vincular",
];

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Rutas públicas
  if (API_PUBLICAS.some((ruta) => pathname.startsWith(ruta))) {
    return NextResponse.next();
  }

  // Rutas de login page
  if (pathname.startsWith("/login")) {
    return NextResponse.next();
  }

  // Para el resto, validar JWT
  const token = request.cookies.get("sesion")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const { payload } = await jwtVerify(token, secret);

    // NUEVO: Pasar datos del token a los headers
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-id", String(payload.id));
    requestHeaders.set("x-negocio-id", String(payload.negocio_id)); // ← MULTI-TENANT
    requestHeaders.set("x-usuario", String(payload.usuario));

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    console.error("JWT verification failed:", error);
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: ["/modules/:path*", "/api/:path*"],
};