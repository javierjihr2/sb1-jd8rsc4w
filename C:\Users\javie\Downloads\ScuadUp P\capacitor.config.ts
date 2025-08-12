
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.squadup.app',
  appName: 'SquadUp',
  webDir: 'public', // Apuntamos a la carpeta que Next.js ahora va a generar
  bundledWebRuntime: false
};

export default config;
