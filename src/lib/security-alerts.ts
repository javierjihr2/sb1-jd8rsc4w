import { logSecurityEvent } from '@/middleware/security';

// Configuración de alertas
const ALERT_THRESHOLDS = {
  SQL_INJECTION: {
    maxAttempts: 3,
    timeWindow: 5 * 60 * 1000, // 5 minutos
    severity: 'HIGH' as const
  },
  XSS: {
    maxAttempts: 3,
    timeWindow: 5 * 60 * 1000, // 5 minutos
    severity: 'HIGH' as const
  },
  RATE_LIMIT: {
    maxAttempts: 10,
    timeWindow: 10 * 60 * 1000, // 10 minutos
    severity: 'MEDIUM' as const
  },
  INVALID_INPUT: {
    maxAttempts: 5,
    timeWindow: 5 * 60 * 1000, // 5 minutos
    severity: 'LOW' as const
  }
};

// Almacén de intentos de ataque por IP
const attackAttempts = new Map<string, {
  type: keyof typeof ALERT_THRESHOLDS;
  count: number;
  firstAttempt: number;
  lastAttempt: number;
}>;

// Función para registrar y evaluar intentos de ataque
export async function trackSecurityEvent(
  type: keyof typeof ALERT_THRESHOLDS,
  ip: string,
  details: {
    endpoint?: string;
    userAgent?: string;
    payload?: unknown;
  }
): Promise<void> {
  const now = Date.now();
  const threshold = ALERT_THRESHOLDS[type];
  const key = `${ip}:${type}`;
  
  // Obtener o crear registro de intentos
  let attempts = attackAttempts.get(key);
  
  if (!attempts || (now - attempts.firstAttempt) > threshold.timeWindow) {
    // Nuevo período de tiempo o primer intento
    attempts = {
      type,
      count: 1,
      firstAttempt: now,
      lastAttempt: now
    };
    attackAttempts.set(key, attempts);
  } else {
    // Incrementar contador
    attempts.count++;
    attempts.lastAttempt = now;
  }
  
  // Verificar si se debe disparar una alerta
  if (attempts.count >= threshold.maxAttempts) {
    await triggerSecurityAlert({
      type,
      ip,
      severity: threshold.severity,
      attemptCount: attempts.count,
      timeWindow: threshold.timeWindow,
      details
    });
    
    // Resetear contador después de la alerta
    attackAttempts.delete(key);
  }
  
  // Log del evento individual
  logSecurityEvent({
    type,
    ip,
    userAgent: details.userAgent,
    payload: details.payload,
    timestamp: new Date()
  });
}

// Función para disparar alertas de seguridad
export async function triggerSecurityAlert(alert: {
  type: keyof typeof ALERT_THRESHOLDS;
  ip: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  attemptCount: number;
  timeWindow: number;
  details: {
    endpoint?: string;
    userAgent?: string;
    payload?: unknown;
  };
}): Promise<void> {
  const alertMessage = {
    timestamp: new Date().toISOString(),
    severity: alert.severity,
    type: alert.type,
    ip: alert.ip,
    message: `🚨 ALERTA DE SEGURIDAD: ${alert.attemptCount} intentos de ${alert.type} desde IP ${alert.ip} en ${alert.timeWindow / 1000} segundos`,
    details: {
      endpoint: alert.details.endpoint,
      userAgent: alert.details.userAgent,
      attemptCount: alert.attemptCount,
      timeWindow: alert.timeWindow
    }
  };
  
  // Log crítico en consola
  console.error('🚨 ALERTA DE SEGURIDAD CRÍTICA:', alertMessage);
  
  // En producción, aquí se podrían enviar notificaciones a:
  // - Slack/Discord webhooks
  // - Email alerts
  // - SMS notifications
  // - Security monitoring systems (Datadog, New Relic, etc.)
  
  // Ejemplo de webhook (comentado para desarrollo)
  /*
  try {
    await fetch(process.env.SECURITY_WEBHOOK_URL!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(alertMessage)
    });
  } catch (error) {
    console.error('Error enviando alerta de seguridad:', error);
  }
  */
  
  // Bloquear IP temporalmente en casos críticos
  if (alert.severity === 'HIGH') {
    await temporaryIPBlock(alert.ip, alert.type);
  }
}

// Función para bloqueo temporal de IP
const blockedIPs = new Map<string, {
  reason: string;
  blockedAt: number;
  expiresAt: number;
}>();

export async function temporaryIPBlock(
  ip: string,
  reason: string,
  durationMs: number = 30 * 60 * 1000 // 30 minutos por defecto
): Promise<void> {
  const now = Date.now();
  
  blockedIPs.set(ip, {
    reason,
    blockedAt: now,
    expiresAt: now + durationMs
  });
  
  console.warn(`🔒 IP ${ip} bloqueada temporalmente por ${reason} durante ${durationMs / 1000} segundos`);
  
  // Limpiar bloqueos expirados después de un tiempo
  setTimeout(() => {
    const block = blockedIPs.get(ip);
    if (block && Date.now() >= block.expiresAt) {
      blockedIPs.delete(ip);
      console.info(`🔓 IP ${ip} desbloqueada automáticamente`);
    }
  }, durationMs);
}

// Función para verificar si una IP está bloqueada
export function isIPBlocked(ip: string): boolean {
  const block = blockedIPs.get(ip);
  
  if (!block) {
    return false;
  }
  
  // Verificar si el bloqueo ha expirado
  if (Date.now() >= block.expiresAt) {
    blockedIPs.delete(ip);
    return false;
  }
  
  return true;
}

// Función para obtener información del bloqueo
export function getBlockInfo(ip: string): {
  reason: string;
  blockedAt: Date;
  expiresAt: Date;
} | null {
  const block = blockedIPs.get(ip);
  
  if (!block || Date.now() >= block.expiresAt) {
    return null;
  }
  
  return {
    reason: block.reason,
    blockedAt: new Date(block.blockedAt),
    expiresAt: new Date(block.expiresAt)
  };
}

// Función para limpiar registros antiguos (ejecutar periódicamente)
export function cleanupOldRecords(): void {
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 horas
  
  // Limpiar intentos de ataque antiguos
  for (const [key, attempts] of attackAttempts.entries()) {
    if ((now - attempts.lastAttempt) > maxAge) {
      attackAttempts.delete(key);
    }
  }
  
  // Limpiar bloqueos expirados
  for (const [ip, block] of blockedIPs.entries()) {
    if (now >= block.expiresAt) {
      blockedIPs.delete(ip);
    }
  }
}

// Ejecutar limpieza cada hora
setInterval(cleanupOldRecords, 60 * 60 * 1000);