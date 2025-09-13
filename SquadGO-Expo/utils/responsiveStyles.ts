import { StyleSheet, TextStyle, ViewStyle, ImageStyle } from 'react-native';
import { iPadConstants } from '../styles/iPadStyles';

type Style = ViewStyle | TextStyle | ImageStyle;

// Responsive style creator
export const createResponsiveStyles = <T extends { [key: string]: Style }>(
  phoneStyles: T,
  tabletStyles?: Partial<T>,
  isTablet: boolean = false
) => {
  if (!isTablet || !tabletStyles) {
    return StyleSheet.create(phoneStyles);
  }
  
  const mergedStyles = { ...phoneStyles };
  
  Object.keys(tabletStyles).forEach(key => {
    if (tabletStyles[key]) {
      (mergedStyles as any)[key] = {
        ...phoneStyles[key],
        ...tabletStyles[key],
      };
    }
  });
  
  return StyleSheet.create(mergedStyles);
};

// Responsive value selector
export const responsiveValue = <T>(phoneValue: T, tabletValue: T, isTablet: boolean = false): T => {
  return isTablet ? tabletValue : phoneValue;
};

// Responsive spacing
export const responsiveSpacing = {
  xs: (multiplier: number = 1, isTablet: boolean = false) => responsiveValue(
    iPadConstants.spacing.xs * multiplier,
    iPadConstants.spacing.sm * multiplier,
    isTablet
  ),
  sm: (multiplier: number = 1, isTablet: boolean = false) => responsiveValue(
    iPadConstants.spacing.sm * multiplier,
    iPadConstants.spacing.md * multiplier,
    isTablet
  ),
  md: (multiplier: number = 1, isTablet: boolean = false) => responsiveValue(
    iPadConstants.spacing.md * multiplier,
    iPadConstants.spacing.lg * multiplier,
    isTablet
  ),
  lg: (multiplier: number = 1, isTablet: boolean = false) => responsiveValue(
    iPadConstants.spacing.lg * multiplier,
    iPadConstants.spacing.xl * multiplier,
    isTablet
  ),
  xl: (multiplier: number = 1, isTablet: boolean = false) => responsiveValue(
    iPadConstants.spacing.xl * multiplier,
    iPadConstants.spacing.xxl * multiplier,
    isTablet
  ),
};

// Responsive typography
export const responsiveTypography = {
  h1: {
    fontSize: responsiveValue(24, 32),
    lineHeight: responsiveValue(32, 40),
    fontWeight: '700' as const,
  },
  h2: {
    fontSize: responsiveValue(20, 28),
    lineHeight: responsiveValue(28, 36),
    fontWeight: '600' as const,
  },
  h3: {
    fontSize: responsiveValue(18, 24),
    lineHeight: responsiveValue(24, 32),
    fontWeight: '600' as const,
  },
  h4: {
    fontSize: responsiveValue(16, 20),
    lineHeight: responsiveValue(22, 28),
    fontWeight: '500' as const,
  },
  body: {
    fontSize: responsiveValue(14, 16),
    lineHeight: responsiveValue(20, 24),
    fontWeight: '400' as const,
  },
  bodyLarge: {
    fontSize: responsiveValue(16, 18),
    lineHeight: responsiveValue(22, 26),
    fontWeight: '400' as const,
  },
  caption: {
    fontSize: responsiveValue(12, 14),
    lineHeight: responsiveValue(16, 20),
    fontWeight: '400' as const,
  },
  button: {
    fontSize: responsiveValue(14, 16),
    lineHeight: responsiveValue(20, 24),
    fontWeight: '500' as const,
  },
};

// Responsive component dimensions
export const responsiveComponents = {
  button: {
    height: responsiveValue(44, 48),
    borderRadius: responsiveValue(8, 12),
    paddingHorizontal: responsiveValue(16, 24),
  },
  input: {
    height: responsiveValue(44, 48),
    borderRadius: responsiveValue(8, 12),
    paddingHorizontal: responsiveValue(12, 16),
  },
  card: {
    borderRadius: responsiveValue(12, 16),
    padding: responsiveValue(16, 20),
  },
  modal: {
    borderRadius: responsiveValue(16, 20),
    padding: responsiveValue(20, 24),
  },
  listItem: {
    height: responsiveValue(56, 64),
    paddingHorizontal: responsiveValue(16, 20),
  },
};

// Common responsive styles
export const commonResponsiveStyles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: responsiveSpacing.md(),
    paddingVertical: responsiveSpacing.lg(),
  },
  
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: responsiveSpacing.md(),
  },
  
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: responsiveComponents.card.borderRadius,
    padding: responsiveComponents.card.padding,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: responsiveValue(4, 8),
    elevation: responsiveValue(2, 4),
    marginBottom: responsiveSpacing.md(),
  },
  
  button: {
    height: responsiveComponents.button.height,
    borderRadius: responsiveComponents.button.borderRadius,
    paddingHorizontal: responsiveComponents.button.paddingHorizontal,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  input: {
    height: responsiveComponents.input.height,
    borderRadius: responsiveComponents.input.borderRadius,
    paddingHorizontal: responsiveComponents.input.paddingHorizontal,
    borderWidth: 1,
    borderColor: '#E5E5E7',
    backgroundColor: '#F2F2F7',
    fontSize: responsiveTypography.body.fontSize,
  },
  
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: responsiveSpacing.sm(),
    paddingHorizontal: responsiveComponents.listItem.paddingHorizontal,
    minHeight: responsiveComponents.listItem.height,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  
  section: {
    marginBottom: responsiveSpacing.xl(),
  },
  
  sectionHeader: {
    ...responsiveTypography.h3,
    marginBottom: responsiveSpacing.lg(),
    paddingBottom: responsiveSpacing.sm(),
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  column: {
    flexDirection: 'column',
  },
  
  spaceBetween: {
    justifyContent: 'space-between',
  },
  
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

// Responsive grid utilities
export const getResponsiveGrid = (isTablet: boolean = false) => {
  return {
    numColumns: isTablet ? 3 : 2,
    gap: responsiveSpacing.md(1, isTablet),
    itemMinWidth: isTablet ? 250 : 150,
    itemMaxWidth: isTablet ? 400 : 200,
  };
};

// Responsive modal utilities
export const getResponsiveModal = (isTablet: boolean = false) => {
  return {
    presentationStyle: isTablet ? 'formSheet' as const : 'pageSheet' as const,
    animationType: 'slide' as const,
    maxWidth: isTablet ? '70%' : '95%',
    margin: responsiveSpacing.lg(1, isTablet),
  };
};

// Responsive navigation utilities
export const getResponsiveNavigation = (isTablet: boolean = false) => {
  return {
    tabBarHeight: isTablet ? 80 : 60,
    tabBarLabelSize: isTablet ? 12 : 10,
    headerHeight: isTablet ? 64 : 56,
    headerTitleSize: isTablet ? 20 : 18,
  };
};

// Utility to merge responsive styles
export const mergeResponsiveStyles = (...styles: (ViewStyle | TextStyle)[]) => {
  return StyleSheet.flatten(styles);
};

// Conditional style application
export const applyIf = (condition: boolean, style: Style) => {
  return condition ? style : {};
};

// Platform and device specific styles
export const deviceSpecificStyles = {
  tablet: (style: Style, isTablet: boolean = false) => applyIf(responsiveValue(false, true, isTablet), style),
  phone: (style: Style, isTablet: boolean = false) => applyIf(responsiveValue(true, false, isTablet), style),
};