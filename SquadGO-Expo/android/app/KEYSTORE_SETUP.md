# Configuración de Keystore para Producción

## Pasos para generar el keystore de producción:

### 1. Instalar Java Development Kit (JDK)
Si no tienes Java instalado, descarga e instala OpenJDK desde: https://adoptium.net/

### 2. Generar el keystore
Ejecuta el siguiente comando en la terminal (reemplaza los valores según sea necesario):

```bash
keytool -genkeypair -v -storetype PKCS12 -keystore squadgo-release-key.keystore -alias squadgo-key-alias -keyalg RSA -keysize 2048 -validity 10000 -storepass TU_PASSWORD_SEGURO -keypass TU_PASSWORD_SEGURO -dname "CN=SquadGO, OU=Mobile Development, O=SquadGO Team, L=Tu_Ciudad, ST=Tu_Estado, C=ES"
```

### 3. Configurar gradle.properties
Crea o actualiza el archivo `android/gradle.properties` con:

```properties
SQUADGO_UPLOAD_STORE_FILE=squadgo-release-key.keystore
SQUADGO_UPLOAD_KEY_ALIAS=squadgo-key-alias
SQUADGO_UPLOAD_STORE_PASSWORD=TU_PASSWORD_SEGURO
SQUADGO_UPLOAD_KEY_PASSWORD=TU_PASSWORD_SEGURO
```

### 4. Actualizar build.gradle
El archivo build.gradle ya está configurado para usar estas variables.

### IMPORTANTE:
- Guarda el keystore en un lugar seguro
- Nunca subas el keystore al repositorio
- Anota las contraseñas en un lugar seguro
- Haz copias de seguridad del keystore

### Notas de Seguridad:
- Cambia 'TU_PASSWORD_SEGURO' por una contraseña fuerte
- El keystore es necesario para todas las actualizaciones futuras de la app
- Si pierdes el keystore, no podrás actualizar la app en Play Store