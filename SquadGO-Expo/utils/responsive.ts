import { Dimensions, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Breakpoints para diferentes tamaños de pantalla
export const BREAKPOINTS = {
  xs: 0,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  xxl: 1400
};

// Función para obtener el tamaño de pantalla actual
export const getScreenSize = () => {
  if (SCREEN_WIDTH < BREAKPOINTS.sm) return 'xs';
  if (SCREEN_WIDTH < BREAKPOINTS.md) return 'sm';
  if (SCREEN_WIDTH < BREAKPOINTS.lg) return 'md';
  if (SCREEN_WIDTH < BREAKPOINTS.xl) return 'lg';
  if (SCREEN_WIDTH < BREAKPOINTS.xxl) return 'xl';
  return 'xxl';
};

// Función para escalar valores basado en el tamaño de pantalla
export const scale = (size: number): number => {
  const baseWidth = 375; // iPhone X width as base
  return (SCREEN_WIDTH / baseWidth) * size;
};

// Función para escalar verticalmente
export const verticalScale = (size: number): number => {
  const baseHeight = 812; // iPhone X height as base
  return (SCREEN_HEIGHT / baseHeight) * size;
};

// Función para escalar moderadamente (híbrido)
export const moderateScale = (size: number, factor: number = 0.5): number => {
  return size + (scale(size) - size) * factor;
};

// Espaciado responsivo
export const responsiveSpacing = {
  xs: moderateScale(4),
  sm: moderateScale(8),
  md: moderateScale(16),
  lg: moderateScale(24),
  xl: moderateScale(32),
  xxl: moderateScale(48)
};

// Tamaños de fuente responsivos
export const responsiveFontSize = {
  xs: moderateScale(10),
  sm: moderateScale(12),
  md: moderateScale(14),
  lg: moderateScale(16),
  xl: moderateScale(18),
  xxl: moderateScale(20),
  title: moderateScale(24),
  heading: moderateScale(28),
  display: moderateScale(32)
};

// Función para obtener valores responsivos basados en el tamaño de pantalla
export const getResponsiveValue = <T>(values: {
  xs?: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
  xxl?: T;
}): T | undefined => {
  const screenSize = getScreenSize();
  
  // Buscar el valor más específico disponible
  const sizes = ['xxl', 'xl', 'lg', 'md', 'sm', 'xs'] as const;
  const currentIndex = sizes.indexOf(screenSize as any);
  
  for (let i = currentIndex; i < sizes.length; i++) {
    const size = sizes[i];
    if (values[size] !== undefined) {
      return values[size];
    }
  }
  
  return undefined;
};

// Función para verificar si es una pantalla pequeña
export const isSmallScreen = (): boolean => {
  return SCREEN_WIDTH < BREAKPOINTS.md;
};

// Función para verificar si es una pantalla grande
export const isLargeScreen = (): boolean => {
  return SCREEN_WIDTH >= BREAKPOINTS.lg;
};

// Función para verificar si es una tablet
export const isTablet = (): boolean => {
  return SCREEN_WIDTH >= BREAKPOINTS.md && SCREEN_WIDTH < BREAKPOINTS.xl;
};

// Función para verificar orientación
export const isLandscape = (): boolean => {
  return SCREEN_WIDTH > SCREEN_HEIGHT;
};

// Función para obtener el ratio de píxeles
export const getPixelRatio = (): number => {
  return PixelRatio.get();
};

// Función para obtener dimensiones de pantalla
export const getScreenDimensions = () => {
  return {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    ratio: SCREEN_WIDTH / SCREEN_HEIGHT
  };
};

// Función para calcular el número de columnas en una grid responsiva
export const getGridColumns = (itemWidth: number, spacing: number = 16): number => {
  const availableWidth = SCREEN_WIDTH - (spacing * 2);
  const itemWithSpacing = itemWidth + spacing;
  return Math.floor(availableWidth / itemWithSpacing);
};

// Función para obtener el ancho de un item en una grid
export const getGridItemWidth = (columns: number, spacing: number = 16): number => {
  const availableWidth = SCREEN_WIDTH - (spacing * 2);
  const totalSpacing = spacing * (columns - 1);
  return (availableWidth - totalSpacing) / columns;
};

export default {
  scale,
  verticalScale,
  moderateScale,
  responsiveSpacing,
  responsiveFontSize,
  getResponsiveValue,
  getScreenSize,
  isSmallScreen,
  isLargeScreen,
  isTablet,
  isLandscape,
  getPixelRatio,
  getScreenDimensions,
  getGridColumns,
  getGridItemWidth,
  BREAKPOINTS
};