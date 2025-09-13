import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { trackSecurityEvent, isIPBlocked, getBlockInfo } from '@/lib/security-alerts';

// Patrones de inyección SQL comunes - más específicos para evitar falsos positivos
const SQL_INJECTION_PATTERNS = [
  /('\s*(or|and)\s*')/i,
  /(--\s*$)/i,
  /(;\s*(drop|delete|update|insert|create|alter)\s+)/i,
  /(union\s+select)/i,
  /(or\s+1\s*=\s*1)/i,
  /(and\s+1\s*=\s*1)/i,
  /(drop\s+table\s+\w+)/i,
  /(insert\s+into\s+\w+)/i,
  /(update\s+\w+\s+set)/i,
  /(delete\s+from\s+\w+)/i,
  /('\s*;\s*drop\s+table)/i,
  /('\s*union\s+select)/i
];

// Patrones de XSS comunes - más específicos para evitar falsos positivos
const XSS_PATTERNS = [
  /<script[^>]*>.*?<\/script>/gi,
  /<iframe[^>]*src\s*=/gi,
  /<object[^>]*data\s*=/gi,
  /<embed[^>]*src\s*=/gi,
  /<link[^>]*href\s*=\s*["']javascript:/gi,
  /javascript:\s*[^\s]/gi,
  /vbscript:\s*[^\s]/gi,
  /on(load|error|click|mouseover)\s*=\s*["'][^"']*["']/gi,
  /<img[^>]*onerror\s*=/gi,
  /<svg[^>]*onload\s*=/gi,
  /<[^>]*\s+on\w+\s*=\s*["'][^"']*alert\s*\(/gi
];

// Función para sanitizar strings
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    return String(input);
  }
  
  // Escapar caracteres HTML peligrosos en lugar de removerlos completamente
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/[\x00-\x1f\x7f-\x9f]/g, '') // Remover caracteres de control
    .trim()
    .substring(0, 1000); // Limitar longitud
}

// Función para detectar inyecciones SQL
export async function detectSQLInjection(
  input: string,
  endpoint?: string,
  userAgent?: string,
  ipAddress?: string
): Promise<boolean> {
  if (typeof input !== 'string') {
    return false;
  }
  
  const normalizedInput = input.toLowerCase().trim();
  const isDetected = SQL_INJECTION_PATTERNS.some(pattern => pattern.test(normalizedInput));
  
  if (isDetected && endpoint && ipAddress) {
    // Log SQL injection attempt y disparar alerta
    console.warn('🚨 SQL Injection detectada:', {
      input: input.substring(0, 100),
      endpoint,
      userAgent,
      ipAddress,
      timestamp: new Date()
    });
    
    // Registrar evento para sistema de alertas
    await trackSecurityEvent('SQL_INJECTION', ipAddress, {
      endpoint,
      userAgent,
      payload: input.substring(0, 100)
    });
  }
  
  return isDetected;
}

// Función para detectar XSS
export async function detectXSS(
  input: string,
  endpoint?: string,
  userAgent?: string,
  ipAddress?: string
): Promise<boolean> {
  if (typeof input !== 'string') {
    return false;
  }
  
  const isDetected = XSS_PATTERNS.some(pattern => pattern.test(input));
  
  if (isDetected && endpoint && ipAddress) {
    // Log XSS attempt y disparar alerta
    console.warn('🚨 XSS detectado:', {
      input: input.substring(0, 100),
      endpoint,
      userAgent,
      ipAddress,
      timestamp: new Date()
    });
    
    // Registrar evento para sistema de alertas
    await trackSecurityEvent('XSS', ipAddress, {
      endpoint,
      userAgent,
      payload: input.substring(0, 100)
    });
  }
  
  return isDetected;
}

// Función para validar y sanitizar objetos
export async function sanitizeObject(
  obj: unknown,
  endpoint?: string,
  userAgent?: string,
  ipAddress?: string
): Promise<unknown> {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'string') {
    const hasSQLInjection = await detectSQLInjection(obj, endpoint, userAgent, ipAddress);
    const hasXSS = await detectXSS(obj, endpoint, userAgent, ipAddress);
    
    // Sanitizar el contenido en lugar de lanzar error
    return sanitizeString(obj);
  }
  
  if (typeof obj === 'number' || typeof obj === 'boolean') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    const sanitizedArray = [];
    for (const item of obj) {
      sanitizedArray.push(await sanitizeObject(item, endpoint, userAgent, ipAddress));
    }
    return sanitizedArray;
  }
  
  if (typeof obj === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      // Sanitizar también las claves
      const sanitizedKey = sanitizeString(key);
      await detectSQLInjection(sanitizedKey, endpoint, userAgent, ipAddress);
      await detectXSS(sanitizedKey, endpoint, userAgent, ipAddress);
      
      // Continuar con la sanitización en lugar de lanzar error
      sanitized[sanitizedKey] = await sanitizeObject(value, endpoint, userAgent, ipAddress);
    }
    return sanitized;
  }
  
  return obj;
}

// Schema para validar datos de entrada comunes
export const CommonInputSchema = z.object({
  email: z.string().email().max(255).optional(),
  password: z.string().min(6).max(128).optional(),
  name: z.string().max(100).optional(),
  message: z.string().max(1000).optional(),
  id: z.string().max(50).optional(),
});

// Middleware de seguridad para APIs
export async function securityMiddleware(
  request: NextRequest,
  maxRequests: number = 100,
  windowMs: number = 15 * 60 * 1000
): Promise<NextResponse> {
  try {
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const ipAddress = getClientIP(request);
    const endpoint = request.nextUrl.pathname;
    
    // Verificar si la IP está bloqueada
    if (isIPBlocked(ipAddress)) {
      const blockInfo = getBlockInfo(ipAddress);
      console.warn(`🔒 Acceso bloqueado para IP ${ipAddress}:`, blockInfo);
      return NextResponse.json(
        { 
          error: 'Acceso temporalmente bloqueado por actividad sospechosa',
          blockedUntil: blockInfo?.expiresAt
        },
        { status: 403 }
      );
    }
    
    // Rate limiting
    const rateLimitPassed = await rateLimit(ipAddress, maxRequests, windowMs, endpoint, userAgent);
    if (!rateLimitPassed) {
      return NextResponse.json(
        { error: 'Rate limit excedido' },
        { status: 429 }
      );
    }
    
    // Verificar Content-Type para requests POST/PUT
    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
      const contentType = request.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        logSecurityEvent({
          type: 'INVALID_INPUT',
          ip: ipAddress,
          userAgent,
          payload: { contentType, endpoint },
          timestamp: new Date()
        });
        return NextResponse.json(
          { error: 'Content-Type debe ser application/json' },
          { status: 400 }
        );
      }
    }
    
    // Verificar tamaño del payload
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 1024 * 1024) { // 1MB límite
      logSecurityEvent({
        type: 'INVALID_INPUT',
        ip: ipAddress,
        userAgent,
        payload: { contentLength, endpoint },
        timestamp: new Date()
      });
      return NextResponse.json(
        { error: 'Payload demasiado grande' },
        { status: 413 }
      );
    }
    
    // Verificar User-Agent
    if (!userAgent || userAgent.length < 10) {
      logSecurityEvent({
        type: 'INVALID_INPUT',
        ip: ipAddress,
        userAgent,
        payload: { endpoint },
        timestamp: new Date()
      });
      return NextResponse.json(
        { error: 'User-Agent inválido' },
        { status: 400 }
      );
    }
    
    // Si hay body, validarlo
    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
      try {
        const body = await request.json();
        
        // Sanitizar el body completo
        const sanitizedBody = await sanitizeObject(body, endpoint, userAgent, ipAddress);
        
        // Crear un nuevo request con el body sanitizado
        const sanitizedRequest = new NextRequest(request.url, {
          method: request.method,
          headers: request.headers,
          body: JSON.stringify(sanitizedBody),
        });
        
        // Almacenar el body sanitizado en headers personalizados para acceso posterior
        const response = NextResponse.next();
        response.headers.set('x-sanitized-body', JSON.stringify(sanitizedBody));
        return response;
      } catch (error) {
        logSecurityEvent({
          type: 'INVALID_INPUT',
          ip: ipAddress,
          userAgent,
          payload: { error: error instanceof Error ? error.message : 'Unknown error', endpoint },
          timestamp: new Date()
        });
        return NextResponse.json(
          { error: 'JSON inválido o contenido malicioso detectado' },
          { status: 400 }
        );
      }
    }
    
    // Si no hay body, continuar normalmente
    return NextResponse.next();
  } catch (error) {
    console.error('Error en middleware de seguridad:', error);
    logSecurityEvent({
      type: 'INVALID_INPUT',
      ip: getClientIP(request),
      userAgent: request.headers.get('user-agent') || 'unknown',
      payload: { error: error instanceof Error ? error.message : 'Unknown error', endpoint: request.nextUrl.pathname },
      timestamp: new Date()
    });
    return NextResponse.json(
      { error: 'Error de validación de seguridad' },
      { status: 400 }
    );
  }
}

// Rate limiting granular en memoria (para producción usar Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Configuración de límites por endpoint
const ENDPOINT_LIMITS = {
  '/api/generate-icebreaker': { maxRequests: 10, windowMs: 60 * 1000 }, // 10 por minuto
  '/api/create-payment-intent': { maxRequests: 5, windowMs: 60 * 1000 }, // 5 por minuto
  '/api/confirm-payment': { maxRequests: 3, windowMs: 60 * 1000 }, // 3 por minuto
  '/api/compare-players': { maxRequests: 20, windowMs: 60 * 1000 }, // 20 por minuto
  default: { maxRequests: 100, windowMs: 15 * 60 * 1000 } // 100 por 15 minutos
};

export async function rateLimit(
  ip: string,
  maxRequests: number = 100,
  windowMs: number = 15 * 60 * 1000,
  endpoint?: string,
  userAgent?: string
): Promise<boolean> {
  // Usar límites específicos del endpoint si están disponibles
  if (endpoint && ENDPOINT_LIMITS[endpoint as keyof typeof ENDPOINT_LIMITS]) {
    const limits = ENDPOINT_LIMITS[endpoint as keyof typeof ENDPOINT_LIMITS];
    maxRequests = limits.maxRequests;
    windowMs = limits.windowMs;
  }
  
  // Crear clave única por IP y endpoint para rate limiting granular
  const key = endpoint ? `${ip}:${endpoint}` : ip;
  const now = Date.now();
  const record = rateLimitMap.get(key);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (record.count >= maxRequests) {
    // Log rate limit exceeded y registrar para alertas
    if (endpoint) {
      console.warn('🚨 Rate limit excedido:', {
        ip,
        endpoint,
        userAgent,
        attempts: record.count,
        maxAllowed: maxRequests,
        windowMs,
        timestamp: new Date()
      });
      
      // Registrar evento para sistema de alertas
      await trackSecurityEvent('RATE_LIMIT', ip, {
        endpoint,
        userAgent,
        payload: { attempts: record.count, maxAllowed: maxRequests }
      });
    }
    return false;
  }
  
  record.count++;
  return true;
}

// Función para obtener IP del cliente
export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return 'unknown';
}

// Logging de seguridad
export function logSecurityEvent(event: {
  type: 'SQL_INJECTION' | 'XSS' | 'RATE_LIMIT' | 'INVALID_INPUT';
  ip: string;
  userAgent?: string;
  payload?: unknown;
  timestamp?: Date;
}) {
  const logEntry = {
    ...event,
    timestamp: event.timestamp || new Date(),
  };
  
  console.warn('🚨 EVENTO DE SEGURIDAD:', JSON.stringify(logEntry, null, 2));
  
  // En producción, enviar a un servicio de logging como Sentry, LogRocket, etc.
}