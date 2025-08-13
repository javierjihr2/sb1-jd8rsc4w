
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.squadup.app',
  appName: 'SquadUp',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    hostname: 'squadup.app'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#FF6B35",
      androidSplashResourceName: "splash",
    },
  },
};

export default config;
