import { useState, useEffect } from 'react';
import { Dimensions, Platform } from 'react-native';

export interface DeviceInfo {
  width: number;
  height: number;
  isTablet: boolean;
  isLandscape: boolean;
  isPortrait: boolean;
  deviceType: 'phone' | 'tablet';
  screenSize: 'small' | 'medium' | 'large' | 'xlarge';
}

export const useDeviceInfo = (): DeviceInfo => {
  const [dimensions, setDimensions] = useState(() => {
    const { width, height } = Dimensions.get('window');
    return { width, height };
  });

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions({ width: window.width, height: window.height });
    });

    return () => subscription?.remove();
  }, []);

  const { width, height } = dimensions;
  const isLandscape = width > height;
  const isPortrait = height > width;
  
  // Determinar si es tablet basado en el tamaño de pantalla
  const isTablet = Platform.OS === 'ios' 
    ? Math.min(width, height) >= 768 // iPad mínimo
    : Math.min(width, height) >= 600; // Android tablet mínimo

  const deviceType: 'phone' | 'tablet' = isTablet ? 'tablet' : 'phone';

  // Determinar el tamaño de pantalla
  let screenSize: 'small' | 'medium' | 'large' | 'xlarge';
  const minDimension = Math.min(width, height);
  
  if (minDimension < 480) {
    screenSize = 'small';
  } else if (minDimension < 768) {
    screenSize = 'medium';
  } else if (minDimension < 1024) {
    screenSize = 'large';
  } else {
    screenSize = 'xlarge';
  }

  return {
    width,
    height,
    isTablet,
    isLandscape,
    isPortrait,
    deviceType,
    screenSize,
  };
};

export default useDeviceInfo;