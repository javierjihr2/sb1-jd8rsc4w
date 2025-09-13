import { useState, useEffect } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

interface BiometricCredentials {
  enabled: boolean;
  email?: string;
  passwordHash?: string;
}

export const useBiometricAuth = () => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [biometricType, setBiometricType] = useState<string>('none');

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      
      setIsAvailable(compatible);
      setIsEnrolled(enrolled);
      
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        setBiometricType('Face ID');
      } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        setBiometricType('Touch ID');
      } else {
        setBiometricType('Biometric');
      }
    } catch (error) {
      console.log('Error checking biometric availability:', error);
      setIsAvailable(false);
      setIsEnrolled(false);
    }
  };

  const authenticateWithBiometrics = async (promptMessage: string = 'Authenticate') => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        cancelLabel: 'Cancelar',
        fallbackLabel: 'Usar contraseña'
      });
      
      return {
        success: result.success,
        error: result.success ? undefined : 'Authentication failed'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Biometric authentication error'
      };
    }
  };

  const saveBiometricCredentials = async (email: string, passwordHash: string): Promise<boolean> => {
    try {
      const credentials: BiometricCredentials = {
        enabled: true,
        email,
        passwordHash
      };
      
      await SecureStore.setItemAsync('biometric_credentials', JSON.stringify(credentials));
      return true;
    } catch (error) {
      console.error('Error saving biometric credentials:', error);
      return false;
    }
  };

  const getBiometricCredentials = async (): Promise<BiometricCredentials> => {
    try {
      const stored = await SecureStore.getItemAsync('biometric_credentials');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error getting biometric credentials:', error);
    }
    
    return { enabled: false };
  };

  const clearBiometricCredentials = async (): Promise<boolean> => {
    try {
      await SecureStore.deleteItemAsync('biometric_credentials');
      return true;
    } catch (error) {
      console.error('Error clearing biometric credentials:', error);
      return false;
    }
  };

  const getBiometricTypeText = (): string => {
    return biometricType;
  };

  return {
    isAvailable,
    isEnrolled,
    authenticateWithBiometrics,
    saveBiometricCredentials,
    getBiometricCredentials,
    clearBiometricCredentials,
    getBiometricTypeText
  };
};