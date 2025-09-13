# 🌐 Guía Completa: Configurar Dominio Personalizado para SquadGO

## 📋 Requisitos Previos

- ✅ Aplicación desplegada en Firebase: `https://squadgo-app.web.app`
- ✅ Dominio propio registrado (ej: `midominio.com`)
- ✅ Acceso al panel de control DNS de tu proveedor
- ✅ Cuenta de Firebase con permisos de administrador

## 🚀 Proceso Paso a Paso

### Paso 1: Configurar Dominio en Firebase Console

1. **Accede a Firebase Console**
   ```
   URL: https://console.firebase.google.com/project/squadup-battle/hosting/main
   ```

2. **Agregar Dominio Personalizado**
   - Haz clic en "Agregar dominio personalizado"
   - Ingresa tu dominio: `tudominio.com`
   - Selecciona "Continuar"

3. **Verificar Propiedad del Dominio**
   Firebase te proporcionará un registro TXT para verificación:
   ```
   Tipo: TXT
   Nombre: @
   Valor: firebase-domain-verification=XXXXXXXXXXXXXXX
   ```

### Paso 2: Configuración DNS

#### Para Dominio Principal (tudominio.com)
```dns
# Registros A para el dominio principal
Tipo: A
Nombre: @
Valor: 151.101.1.195
TTL: 3600

Tipo: A
Nombre: @
Valor: 151.101.65.195
TTL: 3600
```

#### Para Subdominio WWW (www.tudominio.com)
```dns
# Registro CNAME para www
Tipo: CNAME
Nombre: www
Valor: squadup-battle.web.app
TTL: 3600
```

#### Para Subdominio Personalizado (app.tudominio.com)
```dns
# Registro CNAME para subdominio
Tipo: CNAME
Nombre: app
Valor: squadgo-app.web.app
TTL: 3600
```

### Paso 3: Configurar Dominios Autorizados en Firebase Auth

1. Ve a **Authentication > Settings > Authorized domains**
2. Agrega tus dominios:
   - `tudominio.com`
   - `www.tudominio.com`
   - `app.tudominio.com`

### Paso 4: Actualizar Configuración de la Aplicación

#### Actualizar variables de entorno
```env
# .env.production
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tudominio.com
NEXT_PUBLIC_APP_URL=https://tudominio.com
```

#### Actualizar firebase.json (opcional)
```json
{
  "hosting": {
    "public": "out",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**",
        "headers": [
          {
            "key": "X-Frame-Options",
            "value": "DENY"
          },
          {
            "key": "X-Content-Type-Options",
            "value": "nosniff"
          }
        ]
      }
    ]
  }
}
```

## 🕐 Tiempos de Propagación

- **Verificación TXT**: 5-30 minutos
- **Registros A/CNAME**: 1-4 horas
- **Propagación global**: 24-48 horas

## 🧪 Verificación y Testing

### Comandos de Verificación
```bash
# Verificar propagación DNS
nslookup tudominio.com

# Verificar registros específicos
nslookup -type=A tudominio.com
nslookup -type=CNAME www.tudominio.com
nslookup -type=TXT tudominio.com

# Verificar SSL
curl -I https://tudominio.com
```

### Herramientas Online
- [DNS Checker](https://dnschecker.org/)
- [What's My DNS](https://www.whatsmydns.net/)
- [SSL Labs](https://www.ssllabs.com/ssltest/)

### URLs para Probar
- ✅ `https://tudominio.com`
- ✅ `https://www.tudominio.com`
- ✅ `https://app.tudominio.com` (si configuraste subdominio)

## 🔧 Configuraciones Avanzadas

### Redirecciones Automáticas
```javascript
// next.config.ts
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/old-path',
        destination: '/new-path',
        permanent: true,
      },
    ]
  },
}
```

### Headers de Seguridad
```json
// firebase.json - headers adicionales
{
  "key": "Strict-Transport-Security",
  "value": "max-age=31536000; includeSubDomains"
},
{
  "key": "Content-Security-Policy",
  "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'"
}
```

## 🚨 Solución de Problemas Comunes

### Error: "Domain verification failed"
**Solución:**
1. Verificar que el registro TXT esté correctamente configurado
2. Esperar 15-30 minutos para propagación
3. Usar herramientas DNS para verificar

### Error: "SSL certificate pending"
**Solución:**
1. Firebase genera automáticamente certificados SSL
2. Puede tomar 24-48 horas
3. Verificar que los registros DNS sean correctos

### Error: "Domain not authorized"
**Solución:**
1. Agregar dominio en Firebase Auth > Authorized domains
2. Incluir todas las variantes (con y sin www)

### Error: "CORS policy"
**Solución:**
1. Verificar configuración en firebase.json
2. Agregar headers CORS si es necesario

## 📊 Monitoreo Post-Configuración

### Métricas a Monitorear
- **Tráfico**: Visitas desde el nuevo dominio
- **Performance**: Tiempo de carga
- **Errores**: 404s, SSL issues
- **SEO**: Indexación en buscadores

### Comandos de Deploy
```bash
# Build y deploy con nuevo dominio
npm run build
firebase deploy --only hosting

# Verificar deploy
firebase hosting:channel:list
```

## 📈 Optimizaciones Recomendadas

### SEO
```html
<!-- Meta tags para el nuevo dominio -->
<meta property="og:url" content="https://tudominio.com" />
<link rel="canonical" href="https://tudominio.com" />
```

### Analytics
```javascript
// Actualizar Google Analytics
gtag('config', 'GA_MEASUREMENT_ID', {
  page_title: 'SquadUp',
  page_location: 'https://tudominio.com'
});
```

## ✅ Checklist Final

- [ ] Dominio verificado en Firebase Console
- [ ] Registros DNS configurados correctamente
- [ ] Dominios autorizados en Firebase Auth
- [ ] SSL certificado activo
- [ ] Redirecciones funcionando
- [ ] Variables de entorno actualizadas
- [ ] Testing completo realizado
- [ ] Monitoreo configurado

---

**🎉 ¡Tu aplicación SquadUp ahora está disponible en tu dominio personalizado!**

**Próximos pasos:**
1. Actualizar enlaces en redes sociales
2. Notificar a usuarios existentes
3. Configurar redirects desde el dominio anterior
4. Monitorear métricas y performance