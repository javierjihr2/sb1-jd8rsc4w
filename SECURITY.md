# Guía de Seguridad - SquadGO

## ✅ Medidas de Seguridad Implementadas

### 🔐 Autenticación y Autorización
- **Firebase Authentication**: Sistema de autenticación robusto
- **Roles y Permisos**: Sistema de administradores con verificación de estado activo
- **Expiración de Sesiones**: Los super administradores tienen tokens con expiración
- **Credenciales Eliminadas**: Removidas todas las credenciales hardcodeadas

### 🛡️ Protección de Datos
- **Variables de Entorno**: Todas las claves sensibles migradas a variables de entorno
- **Sanitización de Entrada**: Validación y limpieza con DOMPurify
- **Rate Limiting**: Implementado para prevenir ataques de fuerza bruta
- **Firestore Rules**: Reglas de seguridad fortalecidas

### 🔒 Vulnerabilidades Resueltas
- ✅ API Keys expuestas eliminadas
- ✅ Credenciales de prueba removidas
- ✅ Email de administrador hardcodeado eliminado
- ✅ VAPID keys placeholder reemplazadas
- ✅ Sistema de validación implementado

## Configuración Requerida

### Variables de Entorno (.env)
```bash
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key_aqui
EXPO_PUBLIC_FIREBASE_API_KEY=tu_api_key_aqui
NEXT_PUBLIC_FIREBASE_VAPID_KEY=tu_vapid_key_aqui

# Seguridad
NEXTAUTH_SECRET=tu_secret_muy_seguro_aqui
JWT_SECRET=tu_jwt_secret_aqui
```

## Reporte de Vulnerabilidades

Si encuentras una vulnerabilidad:
1. **NO** la publiques públicamente
2. Envía un email a: security@squadgo.com
3. Incluye detalles técnicos y pasos para reproducir

**Estado Actual**: 🟢 Todas las vulnerabilidades críticas resueltas

Esta aplicación ha sido fortificada contra ataques comunes, especialmente **inyecciones SQL** como `' OR '1'='1` y otros vectores de ataque.

## 🔒 Protecciones Implementadas

### 1. Middleware de Seguridad

**Ubicación:** `src/middleware/security.ts`

- **Detección de Inyecciones SQL:** Patrones avanzados que detectan intentos como `' OR '1'='1`, `UNION SELECT`, etc.
- **Protección XSS:** Filtrado de scripts maliciosos y contenido HTML peligroso
- **Sanitización de Datos:** Limpieza automática de todas las entradas del usuario
- **Rate Limiting:** Límites de solicitudes por IP para prevenir ataques de fuerza bruta
- **Validación de User-Agent:** Verificación de agentes de usuario válidos

### 2. Sistema de Logging de Seguridad

**Ubicación:** `src/lib/security-logger.ts`

- **Registro de Eventos:** Todos los intentos de ataque se registran en Firestore
- **Alertas Automáticas:** Sistema de alertas cuando se detectan patrones sospechosos
- **Monitoreo en Tiempo Real:** Seguimiento de eventos de seguridad críticos
- **Análisis de Tendencias:** Identificación de patrones de ataque recurrentes

### 3. Reglas de Firestore Reforzadas

**Ubicación:** `firestore.rules`

- **Validación de Entrada:** Funciones que verifican contenido malicioso
- **Acceso Granular:** Permisos específicos por colección y documento
- **Sanitización a Nivel de Base de Datos:** Filtrado de contenido antes del almacenamiento
- **Límites de Tamaño:** Restricciones en el tamaño de campos y documentos

### 4. Validación en el Frontend

**Ubicación:** `src/app/(auth)/login/page.tsx`

- **Validación de Email:** Verificación de formato antes del envío
- **Contraseñas Seguras:** Requisitos mínimos de longitud y complejidad
- **Logging de Fallos:** Registro de intentos de autenticación fallidos
- **Feedback de Seguridad:** Mensajes informativos sin revelar información sensible

## 🚨 Tipos de Ataques Detectados

### Inyecciones SQL
```sql
' OR '1'='1
' UNION SELECT * FROM users--
'; DROP TABLE users;--
' OR 1=1#
```

### Ataques XSS
```html
<script>alert('XSS')</script>
<img src=x onerror=alert('XSS')>
javascript:alert('XSS')
```

### Otros Vectores
- **Rate Limiting:** Más de 100 solicitudes en 15 minutos
- **Payloads Grandes:** Más de 1MB de datos
- **User-Agents Inválidos:** Agentes sospechosos o malformados

## 📊 Monitoreo y Alertas

### Eventos Registrados
- `sql_injection`: Intentos de inyección SQL (Severidad: CRÍTICA)
- `xss_attempt`: Intentos de XSS (Severidad: ALTA)
- `rate_limit_exceeded`: Exceso de solicitudes (Severidad: MEDIA)
- `auth_failure`: Fallos de autenticación (Severidad: MEDIA)
- `invalid_input`: Entradas inválidas (Severidad: BAJA)
- `suspicious_activity`: Actividad sospechosa (Severidad: VARIABLE)

### Umbrales de Alerta
- **SQL Injection:** 1 intento = Alerta inmediata
- **XSS:** 3 intentos en 1 hora = Alerta
- **Rate Limit:** 10 excesos en 1 hora = Alerta
- **Auth Failures:** 5 fallos en 1 hora = Alerta

## 🔧 Configuración de Seguridad

### Variables de Entorno Recomendadas
```env
# Configuración de Rate Limiting
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000  # 15 minutos

# Configuración de Logging
SECURITY_LOG_LEVEL=warn
SECURITY_ALERTS_ENABLED=true

# Configuración de Firebase
FIREBASE_PROJECT_ID=squadup-battle
FIREBASE_AUTH_DOMAIN=squadup-battle.firebaseapp.com
```

### Configuración de APIs

Cada ruta de API debe implementar el middleware de seguridad:

```typescript
import { securityMiddleware } from '@/middleware/security';

export async function POST(request: NextRequest) {
  // Aplicar middleware de seguridad
  const securityCheck = await securityMiddleware(request, 20, 60000); // 20 req/min
  
  if (!securityCheck.success) {
    return NextResponse.json(
      { error: securityCheck.error },
      { status: securityCheck.error === 'Rate limit exceeded' ? 429 : 400 }
    );
  }

  // Usar el body sanitizado
  const sanitizedBody = securityCheck.sanitizedBody;
  
  // ... resto de la lógica
}
```

## 🛠️ Mantenimiento de Seguridad

### Revisiones Regulares
1. **Semanalmente:** Revisar logs de seguridad en Firestore
2. **Mensualmente:** Actualizar patrones de detección
3. **Trimestralmente:** Auditoría completa de seguridad

### Actualizaciones de Dependencias
```bash
# Verificar vulnerabilidades
npm audit

# Actualizar dependencias de seguridad
npm audit fix

# Actualizar Firebase SDK
npm update firebase
```

### Monitoreo de Logs

Para revisar eventos de seguridad recientes:

```typescript
import { securityLogger } from '@/lib/security-logger';

// Obtener eventos de las últimas 24 horas
const events = await securityLogger.getRecentSecurityEvents(24);

// Obtener alertas activas
const alerts = await securityLogger.getActiveAlerts();
```

## 🚀 Mejores Prácticas

### Para Desarrolladores
1. **Nunca confíes en datos del cliente:** Siempre valida y sanitiza
2. **Usa el middleware:** Aplica `securityMiddleware` en todas las APIs
3. **Registra eventos:** Usa `securityLogger` para eventos importantes
4. **Valida en múltiples capas:** Frontend, middleware y Firestore rules

### Para Administradores
1. **Monitorea alertas:** Revisa regularmente las alertas de seguridad
2. **Actualiza reglas:** Mantén las reglas de Firestore actualizadas
3. **Configura notificaciones:** Implementa alertas por email/Slack
4. **Realiza backups:** Mantén copias de seguridad de la configuración

## 📞 Respuesta a Incidentes

### En caso de ataque detectado:

1. **Inmediato:**
   - Revisar logs en `security_logs` collection
   - Identificar IP y patrones del atacante
   - Verificar si el ataque fue exitoso

2. **Corto plazo:**
   - Bloquear IPs maliciosas si es necesario
   - Revisar y fortalecer reglas de Firestore
   - Notificar al equipo de desarrollo

3. **Largo plazo:**
   - Analizar patrones de ataque
   - Actualizar sistemas de detección
   - Documentar lecciones aprendidas

## 🔍 Testing de Seguridad

### Pruebas Recomendadas

```bash
# Prueba de inyección SQL (debe ser bloqueada)
curl -X POST http://localhost:3000/api/test \
  -H "Content-Type: application/json" \
  -d '{"query": "\' OR \'1\'=\'1"}'

# Prueba de XSS (debe ser sanitizada)
curl -X POST http://localhost:3000/api/test \
  -H "Content-Type: application/json" \
  -d '{"content": "<script>alert(\'XSS\')</script>"}'

# Prueba de rate limiting
for i in {1..150}; do
  curl -X POST http://localhost:3000/api/test &
done
```

---

**⚠️ Importante:** Esta documentación debe mantenerse actualizada con cada cambio en las medidas de seguridad. La seguridad es un proceso continuo, no un estado final.

**📧 Contacto:** Para reportar vulnerabilidades de seguridad, contacta al equipo de desarrollo inmediatamente.