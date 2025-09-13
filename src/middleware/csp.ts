import { NextRequest, NextResponse } from 'next/server';

// Configuración de Content Security Policy
const CSP_CONFIG = {
  // Fuentes permitidas para scripts
  'script-src': [
    "'self'",
    "'unsafe-inline'", // Necesario para Next.js en desarrollo
    "'unsafe-eval'", // Necesario para Next.js en desarrollo
    'https://www.googletagmanager.com',
    'https://www.google-analytics.com',
    'https://js.stripe.com',
    'https://checkout.stripe.com',
    'https://maps.googleapis.com'
  ],
  
  // Fuentes permitidas para estilos
  'style-src': [
    "'self'",
    "'unsafe-inline'", // Necesario para styled-components y CSS-in-JS
    'https://fonts.googleapis.com',
    'https://cdn.jsdelivr.net'
  ],
  
  // Fuentes permitidas para imágenes
  'img-src': [
    "'self'",
    'data:',
    'blob:',
    'https:',
    'https://firebasestorage.googleapis.com',
    'https://lh3.googleusercontent.com', // Google profile images
    'https://platform-lookaside.fbsbx.com' // Facebook profile images
  ],
  
  // Fuentes permitidas para fuentes
  'font-src': [
    "'self'",
    'https://fonts.gstatic.com',
    'https://cdn.jsdelivr.net'
  ],
  
  // Fuentes permitidas para conexiones
  'connect-src': [
    "'self'",
    'https://api.stripe.com',
    'https://firestore.googleapis.com',
    'https://firebase.googleapis.com',
    'https://identitytoolkit.googleapis.com',
    'https://securetoken.googleapis.com',
    'https://www.googleapis.com',
    'wss://ws.pusherapp.com', // Si usas Pusher para real-time
    'https://api.openai.com' // Si usas OpenAI
  ],
  
  // Fuentes permitidas para frames
  'frame-src': [
    "'self'",
    'https://js.stripe.com',
    'https://checkout.stripe.com',
    'https://www.google.com' // Para reCAPTCHA
  ],
  
  // Fuentes permitidas para objetos
  'object-src': ["'none'"],
  
  // Fuentes permitidas para media
  'media-src': [
    "'self'",
    'https://firebasestorage.googleapis.com'
  ],
  
  // Fuentes permitidas para workers
  'worker-src': [
    "'self'",
    'blob:'
  ],
  
  // Fuentes permitidas para manifests
  'manifest-src': ["'self'"],
  
  // Base URI
  'base-uri': ["'self'"],
  
  // Form action
  'form-action': ["'self'"],
  
  // Frame ancestors (para prevenir clickjacking)
  'frame-ancestors': ["'none'"],
  
  // Upgrade insecure requests en producción
  'upgrade-insecure-requests': process.env.NODE_ENV === 'production' ? [] : null
};

// Configuración específica para desarrollo
const DEV_CSP_ADDITIONS = {
  'script-src': [
    'http://localhost:3000',
    'http://localhost:3001',
    'ws://localhost:3000',
    'ws://localhost:3001'
  ],
  'connect-src': [
    'http://localhost:3000',
    'http://localhost:3001',
    'ws://localhost:3000',
    'ws://localhost:3001',
    'webpack://*' // Para hot reload
  ]
};

// Función para generar el header CSP
function generateCSPHeader(): string {
  const isDevelopment = process.env.NODE_ENV === 'development';
  let cspConfig = { ...CSP_CONFIG };
  
  // Agregar configuraciones de desarrollo si es necesario
  if (isDevelopment) {
    Object.keys(DEV_CSP_ADDITIONS).forEach(directive => {
      const key = directive as keyof typeof DEV_CSP_ADDITIONS;
      if (cspConfig[key as keyof typeof cspConfig]) {
        (cspConfig[key as keyof typeof cspConfig] as string[]).push(
          ...DEV_CSP_ADDITIONS[key]
        );
      }
    });
  }
  
  // Construir el string CSP
  const cspDirectives: string[] = [];
  
  Object.entries(cspConfig).forEach(([directive, sources]) => {
    if (sources && Array.isArray(sources) && sources.length > 0) {
      cspDirectives.push(`${directive} ${sources.join(' ')}`);
    } else if (sources === null) {
      // Para directivas sin valores como upgrade-insecure-requests
      cspDirectives.push(directive);
    }
  });
  
  return cspDirectives.join('; ');
}

// Middleware para aplicar headers de seguridad
export function securityHeadersMiddleware(request: NextRequest): NextResponse {
  const response = NextResponse.next();
  
  // Content Security Policy
  const cspHeader = generateCSPHeader();
  response.headers.set('Content-Security-Policy', cspHeader);
  
  // Otros headers de seguridad importantes
  
  // X-Frame-Options (previene clickjacking)
  response.headers.set('X-Frame-Options', 'DENY');
  
  // X-Content-Type-Options (previene MIME sniffing)
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  // Referrer Policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // X-XSS-Protection (para navegadores antiguos)
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // Permissions Policy (antes Feature Policy)
  const permissionsPolicy = [
    'camera=()',
    'microphone=()',
    'geolocation=(self)',
    'payment=(self)',
    'usb=()',
    'magnetometer=()',
    'accelerometer=()',
    'gyroscope=()'
  ].join(', ');
  response.headers.set('Permissions-Policy', permissionsPolicy);
  
  // Strict Transport Security (solo en HTTPS)
  if (request.nextUrl.protocol === 'https:' || process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }
  
  // Cross-Origin Embedder Policy
  response.headers.set('Cross-Origin-Embedder-Policy', 'credentialless');
  
  // Cross-Origin Opener Policy
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  
  // Cross-Origin Resource Policy
  response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');
  
  return response;
}

// Función para validar y reportar violaciones CSP
export function handleCSPViolation(request: NextRequest): NextResponse {
  // En producción, aquí podrías enviar reportes de violaciones CSP
  // a un servicio de monitoreo como Sentry, LogRocket, etc.
  
  console.warn('🚨 CSP Violation reported:', {
    userAgent: request.headers.get('user-agent'),
    ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
    timestamp: new Date().toISOString()
  });
  
  return NextResponse.json({ status: 'violation reported' }, { status: 204 });
}

// Configuración CSP específica para diferentes rutas
export const ROUTE_SPECIFIC_CSP = {
  '/payment': {
    'script-src': [
      "'self'",
      'https://js.stripe.com',
      'https://checkout.stripe.com'
    ],
    'frame-src': [
      "'self'",
      'https://js.stripe.com',
      'https://checkout.stripe.com'
    ]
  },
  '/admin': {
    'script-src': ["'self'"],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'data:'],
    'connect-src': ["'self'"]
  }
};

// Función para aplicar CSP específico por ruta
export function applyRouteSpecificCSP(
  request: NextRequest,
  response: NextResponse
): NextResponse {
  const pathname = request.nextUrl.pathname;
  
  // Buscar configuración específica para la ruta
  const routeConfig = Object.entries(ROUTE_SPECIFIC_CSP).find(([route]) => 
    pathname.startsWith(route)
  );
  
  if (routeConfig) {
    const [, config] = routeConfig;
    const cspDirectives: string[] = [];
    
    Object.entries(config).forEach(([directive, sources]) => {
      if (sources && sources.length > 0) {
        cspDirectives.push(`${directive} ${sources.join(' ')}`);
      }
    });
    
    if (cspDirectives.length > 0) {
      response.headers.set('Content-Security-Policy', cspDirectives.join('; '));
    }
  }
  
  return response;
}

// Función para generar nonce para scripts inline seguros
export function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Buffer.from(array).toString('base64');
}

// Hook para usar nonce en componentes React
export function useCSPNonce(): string {
  // En una implementación real, esto vendría del contexto de la request
  // Por ahora retornamos un nonce estático para desarrollo
  return process.env.NODE_ENV === 'development' 
    ? 'dev-nonce-123' 
    : generateNonce();
}