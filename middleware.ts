import { NextRequest, NextResponse } from 'next/server';
import { securityHeadersMiddleware } from './src/middleware/csp';

/**
 * Next.js Middleware - Ejecuta en todas las rutas
 * Aplica headers de seguridad incluyendo CSP
 */
export function middleware(request: NextRequest) {
  // Aplicar headers de seguridad y CSP
  const secureResponse = securityHeadersMiddleware(request);
  
  return secureResponse;
}

/**
 * Configuración del matcher - define en qué rutas se ejecuta el middleware
 * Excluye archivos estáticos y APIs internas de Next.js
 */
export const config = {
  matcher: [
    /*
     * Coincide con todas las rutas de solicitud excepto las que comienzan con:
     * - api (rutas API)
     * - _next/static (archivos estáticos)
     * - _next/image (optimización de imágenes)
     * - favicon.ico (favicon)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};