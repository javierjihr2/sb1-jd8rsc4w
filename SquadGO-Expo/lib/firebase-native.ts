// Configuración específica para React Native Firebase (nativo)
import { Platform } from 'react-native';

// Solo importar en plataformas nativas
let crashlytics: any = null;
let perf: any = null;
let analytics: any = null;

if (Platform.OS !== 'web') {
  try {
    crashlytics = require('@react-native-firebase/crashlytics').default;
    perf = require('@react-native-firebase/perf').default;
    analytics = require('@react-native-firebase/analytics').default;
  } catch (error) {
    console.warn('⚠️ React Native Firebase no disponible:', error);
  }
}

// Wrapper para funcionalidades nativas
export class NativeFirebaseService {
  private static instance: NativeFirebaseService;
  private isNativeAvailable = Platform.OS !== 'web' && crashlytics && perf && analytics;

  static getInstance(): NativeFirebaseService {
    if (!NativeFirebaseService.instance) {
      NativeFirebaseService.instance = new NativeFirebaseService();
    }
    return NativeFirebaseService.instance;
  }

  isAvailable(): boolean {
    return this.isNativeAvailable;
  }

  // Crashlytics methods
  async recordError(error: Error, context?: string): Promise<void> {
    if (!this.isNativeAvailable || !crashlytics) return;
    
    try {
      if (context) {
        await crashlytics().setAttribute('error_context', context);
      }
      await crashlytics().recordError(error);
    } catch (err) {
      console.error('Error recording to Crashlytics:', err);
    }
  }

  async setUserId(userId: string): Promise<void> {
    if (!this.isNativeAvailable) return;
    
    try {
      if (crashlytics) await crashlytics().setUserId(userId);
      if (analytics) await analytics().setUserId(userId);
    } catch (error) {
      console.error('Error setting user ID:', error);
    }
  }

  async setAttribute(key: string, value: string): Promise<void> {
    if (!this.isNativeAvailable || !crashlytics) return;
    
    try {
      await crashlytics().setAttribute(key, value);
    } catch (error) {
      console.error('Error setting attribute:', error);
    }
  }

  log(message: string): void {
    if (!this.isNativeAvailable || !crashlytics) return;
    
    try {
      crashlytics().log(message);
    } catch (error) {
      console.error('Error logging message:', error);
    }
  }

  // Performance methods
  newTrace(identifier: string): any {
    if (!this.isNativeAvailable || !perf) return null;
    
    try {
      return perf().newTrace(identifier);
    } catch (error) {
      console.error('Error creating trace:', error);
      return null;
    }
  }

  // Analytics methods
  async logEvent(name: string, parameters?: Record<string, any>): Promise<void> {
    if (!this.isNativeAvailable || !analytics) return;
    
    try {
      await analytics().logEvent(name, parameters);
    } catch (error) {
      console.error('Error logging event:', error);
    }
  }

  async logScreenView(screenName: string, screenClass?: string): Promise<void> {
    if (!this.isNativeAvailable || !analytics) return;
    
    try {
      await analytics().logScreenView({
        screen_name: screenName,
        screen_class: screenClass || screenName
      });
    } catch (error) {
      console.error('Error logging screen view:', error);
    }
  }

  async setUserProperties(properties: Record<string, string>): Promise<void> {
    if (!this.isNativeAvailable || !analytics) return;
    
    try {
      await analytics().setUserProperties(properties);
    } catch (error) {
      console.error('Error setting user properties:', error);
    }
  }
}

export const nativeFirebaseService = NativeFirebaseService.getInstance();
export default nativeFirebaseService;