# 🚀 Guía de Deployment - SquadUp Battle

## 📋 Requisitos Previos

1. **Firebase CLI instalado**:
   ```bash
   npm install -g firebase-tools
   ```

2. **Autenticación con Firebase**:
   ```bash
   firebase login
   ```

3. **Verificar proyecto**:
   ```bash
   firebase projects:list
   ```

## 🔧 Configuración para Producción

### 1. Build de la Aplicación
```bash
npm run build:web
```

### 2. Deploy a Firebase Hosting
```bash
npm run deploy
```

### 3. Verificar Deployment
La aplicación estará disponible en:
- **URL por defecto**: https://squadup-battle.web.app
- **URL alternativa**: https://squadup-battle.firebaseapp.com

## 🌐 Configuración de Dominio Personalizado

### 1. Agregar Dominio Personalizado
```bash
firebase hosting:channel:deploy production --only hosting
```

### 2. Configurar Dominio en Firebase Console
1. Ve a [Firebase Console](https://console.firebase.google.com)
2. Selecciona tu proyecto `squadup-battle`
3. Ve a **Hosting** en el menú lateral
4. Haz clic en **Agregar dominio personalizado**
5. Ingresa tu dominio (ej: `tudominio.com`)
6. Sigue las instrucciones para verificar la propiedad del dominio

### 3. Configurar DNS
Agrega estos registros en tu proveedor de DNS:

**Para dominio raíz (tudominio.com):**
```
Tipo: A
Nombre: @
Valor: 151.101.1.195
Tipo: A
Nombre: @
Valor: 151.101.65.195
```

**Para subdominio (www.tudominio.com):**
```
Tipo: CNAME
Nombre: www
Valor: squadup-battle.web.app
```

## 🔍 Verificación y Testing

### 1. Verificar Funcionalidades
- ✅ Autenticación con Firebase
- ✅ Registro de nuevos usuarios
- ✅ Navegación entre páginas
- ✅ Conexión con Firestore
- ✅ Funcionalidades de perfil
- ✅ Sistema de notificaciones

### 2. Testing con Usuarios Reales
1. Comparte la URL con usuarios de prueba
2. Solicita que se registren con emails reales
3. Monitorea errores en Firebase Console
4. Revisa Analytics y Performance

## 🐛 Solución de Problemas Comunes

### Error de CORS
```bash
# Si hay problemas de CORS, configura las reglas en Firebase
firebase firestore:rules:deploy
```

### Error de Autenticación
1. Verifica que el dominio esté agregado en Firebase Auth
2. Ve a Authentication > Settings > Authorized domains
3. Agrega tu dominio personalizado

### Error de Firestore
1. Verifica las reglas de seguridad en `firestore.rules`
2. Asegúrate de que los usuarios autenticados tengan permisos

## 📊 Monitoreo

### Firebase Console
- **Authentication**: Monitorea nuevos registros
- **Firestore**: Revisa uso de base de datos
- **Hosting**: Verifica tráfico y performance
- **Analytics**: Analiza comportamiento de usuarios

### Logs de Errores
```bash
# Ver logs en tiempo real
firebase functions:log
```

## 🔄 Actualizaciones

Para actualizar la aplicación:
```bash
# 1. Hacer cambios en el código
# 2. Build y deploy
npm run deploy
```

## 📞 Soporte

Si encuentras problemas:
1. Revisa los logs en Firebase Console
2. Verifica la configuración de DNS
3. Confirma que todas las APIs estén habilitadas
4. Revisa las reglas de Firestore y Auth

---

**¡Tu aplicación SquadUp Battle está lista para usuarios reales! 🎉**