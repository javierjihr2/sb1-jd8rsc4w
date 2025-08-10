# SquadUp: Mobile Battles

¡Felicidades por completar tu aplicación en Firebase Studio! Este archivo es tu guía para llevar tu proyecto al siguiente nivel.

## 1. Stack Tecnológico

Tu aplicación está construida con tecnologías modernas, robustas y muy populares en la industria:

- **Next.js:** Un framework de React que permite crear aplicaciones rápidas y eficientes.
- **React:** La biblioteca para construir interfaces de usuario interactivas.
- **TypeScript:** Un lenguaje que añade tipos a JavaScript para hacer el código más seguro.
- **Tailwind CSS & ShadCN UI:** Para un diseño estilizado, moderno y responsivo.
- **Genkit (Firebase):** Para todas las funcionalidades de Inteligencia Artificial.

## 2. Cómo Ejecutar tu App Localmente

Para trabajar en tu aplicación en tu propia computadora, necesitarás tener instalado [Node.js](https://nodejs.org/) (versión 18 o superior).

Una vez que descargues y descomprimas tu proyecto, abre una terminal o línea de comandos en la carpeta del proyecto y sigue estos pasos:

```bash
# 1. Instala todas las dependencias del proyecto.
npm install

# 2. Inicia la aplicación en modo de desarrollo.
npm run dev
```

¡Y listo! Ahora puedes abrir tu navegador en `http://localhost:9002` para ver tu aplicación en funcionamiento.

## 3. Siguientes Pasos: Publicar en las Tiendas de Apps

Tu proyecto es una **Aplicación Web Progresiva (PWA)**. Para publicarla en la **Google Play Store** y la **Apple App Store**, el camino recomendado es usar **Capacitor**.

Capacitor "envuelve" tu aplicación web en un contenedor nativo, permitiéndote acceder a funciones del teléfono y publicarla en las tiendas.

### Guía Rápida para Empezar con Capacitor:

1.  **Instalar Capacitor en tu Proyecto:**
    ```bash
    npm install @capacitor/core @capacitor/cli
    npx cap init "SquadUp" "com.squadup.app"
    ```

2.  **Construir tu Aplicación Web:**
    ```bash
    npm run build
    ```

3.  **Añadir las Plataformas Nativas:**
    ```bash
    # Para Android (Google Play Store)
    npm install @capacitor/android
    npx cap add android

    # Para iOS (Apple App Store) - Necesitas una Mac
    npm install @capacitor/ios
    npx cap add ios
    ```

4.  **Abrir los Proyectos Nativos:**
    ```bash
    # Para Android
    npx cap open android

    # Para iOS
    npx cap open ios
    ```

Esto abrirá **Android Studio** o **Xcode**, desde donde podrás compilar y preparar tu aplicación para subirla a las respectivas tiendas de desarrolladores.

¡Ha sido un placer trabajar contigo en este proyecto! Tienes una base increíble para construir algo fantástico. ¡Mucho éxito!
