import { useState, useEffect } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

interface BiometricAuthState {
  isAvailable: boolean;
  isEnrolled: boolean;
  supportedTypes: LocalAuthentication.AuthenticationType[];
  isLoading: boolean;
}

export const useBiometricAuth = () => {
  const [state, setState] = useState<BiometricAuthState>({
    isAvailable: false,
    isEnrolled: false,
    supportedTypes: [],
    isLoading: true,
  });

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

      setState({
        isAvailable: compatible,
        isEnrolled: enrolled,
        supportedTypes,
        isLoading: false,
      });
    } catch (error) {
      console.error('❌ Error checking biometric availability:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const authenticateWithBiometrics = async (
    promptMessage: string = '🔐 Autenticación biométrica'
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!state.isAvailable || !state.isEnrolled) {
        return {
          success: false,
          error: 'Autenticación biométrica no disponible'
        };
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        cancelLabel: 'Cancelar',
        fallbackLabel: 'Usar contraseña',
        disableDeviceFallback: false,
      });

      if (result.success) {
        return { success: true };
      } else {
        return {
          success: false,
          error: 'Autenticación fallida'
        };
      }
    } catch (error) {
      console.error('❌ Biometric authentication error:', error);
      return {
        success: false,
        error: 'Error en autenticación biométrica'
      };
    }
  };

  const saveBiometricCredentials = async (email: string, hashedPassword: string) => {
    try {
      await SecureStore.setItemAsync('biometric_email', email);
      await SecureStore.setItemAsync('biometric_password_hash', hashedPassword);
      await SecureStore.setItemAsync('biometric_enabled', 'true');
      console.log('✅ Credenciales biométricas guardadas');
      return true;
    } catch (error) {
      console.error('❌ Error saving biometric credentials:', error);
      return false;
    }
  };

  const getBiometricCredentials = async (): Promise<{
    email?: string;
    passwordHash?: string;
    enabled: boolean;
  }> => {
    try {
      const email = await SecureStore.getItemAsync('biometric_email');
      const passwordHash = await SecureStore.getItemAsync('biometric_password_hash');
      const enabled = await SecureStore.getItemAsync('biometric_enabled') === 'true';

      return {
        email: email || undefined,
        passwordHash: passwordHash || undefined,
        enabled,
      };
    } catch (error) {
      console.error('❌ Error getting biometric credentials:', error);
      return { enabled: false };
    }
  };

  const clearBiometricCredentials = async () => {
    try {
      await SecureStore.deleteItemAsync('biometric_email');
      await SecureStore.deleteItemAsync('biometric_password_hash');
      await SecureStore.deleteItemAsync('biometric_enabled');
      console.log('✅ Credenciales biométricas eliminadas');
      return true;
    } catch (error) {
      console.error('❌ Error clearing biometric credentials:', error);
      return false;
    }
  };

  const getBiometricTypeText = (): string => {
    if (state.supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return 'Face ID';
    }
    if (state.supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return 'Huella dactilar';
    }
    if (state.supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      return 'Reconocimiento de iris';
    }
    return 'Autenticación biométrica';
  };

  return {
    ...state,
    authenticateWithBiometrics,
    saveBiometricCredentials,
    getBiometricCredentials,
    clearBiometricCredentials,
    getBiometricTypeText,
    checkBiometricAvailability,
  };
};