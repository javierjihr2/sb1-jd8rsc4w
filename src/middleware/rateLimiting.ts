import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '../lib/validation';

// Configuraciones de rate limiting por ruta
const RATE_LIMIT_CONFIG = {
  '/api/auth/login': { maxAttempts: 5, windowMs: 15 * 60 * 1000 }, // 5 intentos por 15 minutos
  '/api/auth/register': { maxAttempts: 3, windowMs: 60 * 60 * 1000 }, // 3 intentos por hora
  '/api/posts': { maxAttempts: 10, windowMs: 60 * 1000 }, // 10 posts por minuto
  '/api/messages': { maxAttempts: 30, windowMs: 60 * 1000 }, // 30 mensajes por minuto
  '/api/tournaments': { maxAttempts: 5, windowMs: 60 * 1000 }, // 5 torneos por minuto
  default: { maxAttempts: 100, windowMs: 60 * 1000 } // Límite general
};

// Obtener identificador único del cliente
function getClientIdentifier(request: NextRequest): string {
  // Usar IP + User-Agent como identificador
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  return `${ip}-${userAgent.slice(0, 50)}`;
}

// Middleware de rate limiting
export function rateLimitMiddleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const clientId = getClientIdentifier(request);
  
  // Buscar configuración específica para la ruta
  let config = RATE_LIMIT_CONFIG.default;
  for (const [route, routeConfig] of Object.entries(RATE_LIMIT_CONFIG)) {
    if (route !== 'default' && pathname.startsWith(route)) {
      config = routeConfig;
      break;
    }
  }
  
  // Verificar rate limit
  const isAllowed = checkRateLimit(
    `${pathname}-${clientId}`,
    config.maxAttempts,
    config.windowMs
  );
  
  if (!isAllowed) {
    return NextResponse.json(
      { 
        error: 'Demasiadas solicitudes. Intenta de nuevo más tarde.',
        retryAfter: Math.ceil(config.windowMs / 1000)
      },
      { 
        status: 429,
        headers: {
          'Retry-After': Math.ceil(config.windowMs / 1000).toString(),
          'X-RateLimit-Limit': config.maxAttempts.toString(),
          'X-RateLimit-Remaining': '0'
        }
      }
    );
  }
  
  return NextResponse.next();
}

// Hook para usar en API routes
export function withRateLimit(handler: Function, maxAttempts: number = 10, windowMs: number = 60 * 1000) {
  return async (request: NextRequest, ...args: any[]) => {
    const clientId = getClientIdentifier(request);
    const pathname = request.nextUrl.pathname;
    
    const isAllowed = checkRateLimit(
      `${pathname}-${clientId}`,
      maxAttempts,
      windowMs
    );
    
    if (!isAllowed) {
      return NextResponse.json(
        { 
          error: 'Demasiadas solicitudes. Intenta de nuevo más tarde.',
          retryAfter: Math.ceil(windowMs / 1000)
        },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil(windowMs / 1000).toString(),
            'X-RateLimit-Limit': maxAttempts.toString(),
            'X-RateLimit-Remaining': '0'
          }
        }
      );
    }
    
    return handler(request, ...args);
  };
}