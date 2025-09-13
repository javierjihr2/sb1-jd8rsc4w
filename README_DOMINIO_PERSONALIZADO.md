# 🌐 Configuración de Dominio Personalizado - SquadGO

## 🚀 Configuración Rápida

### Opción 1: Script Automatizado (Recomendado)
```bash
# Ejecutar el configurador automático
npm run setup-domain tu-dominio.com

# Ejemplo:
npm run setup-domain squadup.miempresa.com
```

### Opción 2: Configuración Manual
Sigue la guía detallada en: [`DOMINIO_PERSONALIZADO_GUIA.md`](./DOMINIO_PERSONALIZADO_GUIA.md)

## 📋 Información Actual

- **Proyecto Firebase**: `squadup-battle`
- **URL Actual**: https://squadup-battle.web.app
- **URL Local**: http://localhost:3000
- **Estado**: ✅ Listo para dominio personalizado

## 🔧 Scripts Disponibles

```bash
# Configurar dominio personalizado
npm run setup-domain <tu-dominio.com>

# Deploy con dominio personalizado
npm run deploy:custom-domain

# Verificar configuración DNS
npm run verify-domain

# Desarrollo local
npm run dev:local
```

## 📝 Checklist Rápido

### Antes de Empezar
- [ ] Tienes un dominio registrado
- [ ] Acceso al panel DNS de tu proveedor
- [ ] Permisos de administrador en Firebase

### Configuración DNS
- [ ] Registro TXT de verificación
- [ ] Registros A para dominio principal
- [ ] Registro CNAME para www
- [ ] Propagación DNS completada (24-48h)

### Firebase Console
- [ ] Dominio agregado en Hosting
- [ ] Dominio verificado
- [ ] Dominios autorizados en Authentication
- [ ] SSL certificado activo

### Testing
- [ ] https://tu-dominio.com funciona
- [ ] https://www.tu-dominio.com funciona
- [ ] Login/registro funcionando
- [ ] Todas las funcionalidades operativas

## 🌍 Ejemplos de Configuración DNS

### Para `miapp.com`:
```dns
# Verificación
TXT @ firebase-domain-verification=XXXXX

# Dominio principal
A @ 151.101.1.195
A @ 151.101.65.195

# Subdominio www
CNAME www squadup-battle.web.app
```

### Para `app.miempresa.com`:
```dns
# Verificación
TXT app firebase-domain-verification=XXXXX

# Subdominio app
CNAME app squadup-battle.web.app
```

## 🔍 Verificación Rápida

```bash
# Verificar DNS
nslookup tu-dominio.com
nslookup www.tu-dominio.com

# Verificar SSL
curl -I https://tu-dominio.com

# Verificar respuesta
curl https://tu-dominio.com
```

## 🚨 Problemas Comunes

| Problema | Solución |
|----------|----------|
| Domain verification failed | Verificar registro TXT, esperar propagación |
| SSL pending | Esperar 24-48h, verificar registros DNS |
| 404 errors | Verificar firebase.json, hacer redeploy |
| Auth errors | Agregar dominio en Firebase Auth |
| CORS errors | Verificar headers en firebase.json |

## 📞 Enlaces Útiles

- **Firebase Console**: https://console.firebase.google.com/project/squadup-battle
- **Hosting**: https://console.firebase.google.com/project/squadup-battle/hosting/main
- **Authentication**: https://console.firebase.google.com/project/squadup-battle/authentication/settings
- **DNS Checker**: https://dnschecker.org/
- **SSL Test**: https://www.ssllabs.com/ssltest/

## 🎯 Próximos Pasos

1. **Ejecutar**: `npm run setup-domain tu-dominio.com`
2. **Configurar DNS** según las instrucciones generadas
3. **Verificar** en Firebase Console
4. **Esperar** propagación DNS (24-48h)
5. **Probar** funcionalidad completa
6. **Deploy final**: `npm run deploy:custom-domain`

---

**¿Necesitas ayuda?** Consulta la guía completa en [`DOMINIO_PERSONALIZADO_GUIA.md`](./DOMINIO_PERSONALIZADO_GUIA.md)

**¿Todo listo?** ¡Tu aplicación SquadGO estará disponible en tu dominio personalizado! 🎉