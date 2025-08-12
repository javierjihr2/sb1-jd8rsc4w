
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.squadup.app',
  appName: 'SquadUp',
  webDir: 'out',
  server: {
    androidScheme: 'https'
  }
};

export default config;
