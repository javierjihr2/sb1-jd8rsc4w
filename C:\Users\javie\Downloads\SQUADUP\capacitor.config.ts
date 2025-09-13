
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.squadgo.battle',
  appName: 'SquadGO',
  webDir: 'out',
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#FF6B35",
      androidSplashResourceName: "splash"
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    }
  },
  // Las configuraciones de permisos se manejan en android/app/src/main/AndroidManifest.xml
  // y ios/App/App/Info.plist respectivamente
  // server: {
  //   url: 'http://10.0.2.2:9002',
  //   cleartext: true
  // }
};

export default config;
