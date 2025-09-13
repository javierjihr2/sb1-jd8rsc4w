/**
 * Secure Logger - Reemplaza console.log para evitar exposición de datos sensibles
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
}

class SecureLogger {
  private static instance: SecureLogger;
  private isDevelopment: boolean;
  private sensitiveFields = [
    'password', 'token', 'secret', 'key', 'apiKey', 'privateKey',
    'email', 'phone', 'address', 'creditCard', 'ssn', 'userId'
  ];

  private constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  static getInstance(): SecureLogger {
    if (!SecureLogger.instance) {
      SecureLogger.instance = new SecureLogger();
    }
    return SecureLogger.instance;
  }

  private sanitizeData(data: any): any {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeData(item));
    }

    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();
      const isSensitive = this.sensitiveFields.some(field => 
        lowerKey.includes(field.toLowerCase())
      );

      if (isSensitive) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object') {
        sanitized[key] = this.sanitizeData(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  private createLogEntry(level: LogLevel, message: string, context?: any): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: context ? this.sanitizeData(context) : undefined
    };
  }

  private writeLog(entry: LogEntry): void {
    if (this.isDevelopment) {
      const logMessage = `[${entry.timestamp}] ${entry.level.toUpperCase()}: ${entry.message}`;
      
      switch (entry.level) {
        case 'error':
          console.error(logMessage, entry.context || '');
          break;
        case 'warn':
          console.warn(logMessage, entry.context || '');
          break;
        case 'info':
          console.info(logMessage, entry.context || '');
          break;
        case 'debug':
          console.log(logMessage, entry.context || '');
          break;
      }
    } else {
      // En producción, enviar a servicio de logging externo
      // como Sentry, LogRocket, CloudWatch, etc.
      this.sendToExternalLogger(entry);
    }
  }

  private sendToExternalLogger(entry: LogEntry): void {
    // Implementar envío a servicio de logging externo
    // Por ahora, solo almacenar en memoria o enviar a API
    try {
      // Ejemplo: enviar a endpoint de logging
      if (typeof window === 'undefined') {
        // Server-side logging
        // fetch('/api/logs', { method: 'POST', body: JSON.stringify(entry) });
      }
    } catch (error) {
      // Fallback silencioso
    }
  }

  debug(message: string, context?: any): void {
    const entry = this.createLogEntry('debug', message, context);
    this.writeLog(entry);
  }

  info(message: string, context?: any): void {
    const entry = this.createLogEntry('info', message, context);
    this.writeLog(entry);
  }

  warn(message: string, context?: any): void {
    const entry = this.createLogEntry('warn', message, context);
    this.writeLog(entry);
  }

  error(message: string, context?: any): void {
    const entry = this.createLogEntry('error', message, context);
    this.writeLog(entry);
  }

  // Método especial para logging de seguridad
  security(message: string, context?: any): void {
    const entry = this.createLogEntry('warn', `[SECURITY] ${message}`, context);
    this.writeLog(entry);
    
    // En producción, también enviar alerta inmediata
    if (!this.isDevelopment) {
      this.sendSecurityAlert(entry);
    }
  }

  private sendSecurityAlert(entry: LogEntry): void {
    // Enviar alerta de seguridad inmediata
    try {
      // Implementar notificación urgente (email, Slack, etc.)
    } catch (error) {
      // Fallback silencioso
    }
  }
}

// Instancia singleton
export const secureLogger = SecureLogger.getInstance();

// Funciones de conveniencia
export const log = {
  debug: (message: string, context?: any) => secureLogger.debug(message, context),
  info: (message: string, context?: any) => secureLogger.info(message, context),
  warn: (message: string, context?: any) => secureLogger.warn(message, context),
  error: (message: string, context?: any) => secureLogger.error(message, context),
  security: (message: string, context?: any) => secureLogger.security(message, context)
};

// Reemplazar console.log en producción
if (process.env.NODE_ENV === 'production') {
  console.log = (...args: any[]) => {
    secureLogger.info('Console log intercepted', { args });
  };
  
  console.warn = (...args: any[]) => {
    secureLogger.warn('Console warn intercepted', { args });
  };
  
  console.error = (...args: any[]) => {
    secureLogger.error('Console error intercepted', { args });
  };
}