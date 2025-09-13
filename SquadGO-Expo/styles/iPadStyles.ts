import { StyleSheet, Dimensions } from 'react-native';
import { useDeviceInfo } from '../hooks/useDeviceInfo';

const { width, height } = Dimensions.get('window');

// iPad-specific style constants
export const iPadConstants = {
  // Spacing
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  
  // Typography
  typography: {
    h1: {
      fontSize: 32,
      lineHeight: 40,
      fontWeight: '700' as const,
    },
    h2: {
      fontSize: 28,
      lineHeight: 36,
      fontWeight: '600' as const,
    },
    h3: {
      fontSize: 24,
      lineHeight: 32,
      fontWeight: '600' as const,
    },
    h4: {
      fontSize: 20,
      lineHeight: 28,
      fontWeight: '500' as const,
    },
    body: {
      fontSize: 16,
      lineHeight: 24,
      fontWeight: '400' as const,
    },
    bodyLarge: {
      fontSize: 18,
      lineHeight: 26,
      fontWeight: '400' as const,
    },
    caption: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '400' as const,
    },
    button: {
      fontSize: 16,
      lineHeight: 24,
      fontWeight: '500' as const,
    },
  },
  
  // Component dimensions
  components: {
    button: {
      height: 48,
      borderRadius: 12,
      paddingHorizontal: 24,
    },
    input: {
      height: 48,
      borderRadius: 12,
      paddingHorizontal: 16,
    },
    card: {
      borderRadius: 16,
      padding: 20,
    },
    modal: {
      borderRadius: 20,
      padding: 24,
    },
  },
  
  // Layout
  layout: {
    containerPadding: 24,
    sectionSpacing: 32,
    gridGap: 16,
    listItemHeight: 64,
  },
};

// iPad-specific styles
export const iPadStyles = StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
    paddingHorizontal: iPadConstants.layout.containerPadding,
    paddingVertical: iPadConstants.spacing.lg,
  },
  
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: iPadConstants.layout.containerPadding,
  },
  
  // Typography styles
  h1: {
    ...iPadConstants.typography.h1,
    marginBottom: iPadConstants.spacing.lg,
  },
  
  h2: {
    ...iPadConstants.typography.h2,
    marginBottom: iPadConstants.spacing.md,
  },
  
  h3: {
    ...iPadConstants.typography.h3,
    marginBottom: iPadConstants.spacing.md,
  },
  
  h4: {
    ...iPadConstants.typography.h4,
    marginBottom: iPadConstants.spacing.sm,
  },
  
  body: {
    ...iPadConstants.typography.body,
    marginBottom: iPadConstants.spacing.sm,
  },
  
  bodyLarge: {
    ...iPadConstants.typography.bodyLarge,
    marginBottom: iPadConstants.spacing.sm,
  },
  
  caption: {
    ...iPadConstants.typography.caption,
    opacity: 0.7,
  },
  
  // Button styles
  primaryButton: {
    height: iPadConstants.components.button.height,
    borderRadius: iPadConstants.components.button.borderRadius,
    paddingHorizontal: iPadConstants.components.button.paddingHorizontal,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#007AFF',
  },
  
  secondaryButton: {
    height: iPadConstants.components.button.height,
    borderRadius: iPadConstants.components.button.borderRadius,
    paddingHorizontal: iPadConstants.components.button.paddingHorizontal,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  
  buttonText: {
    ...iPadConstants.typography.button,
    color: '#FFFFFF',
  },
  
  secondaryButtonText: {
    ...iPadConstants.typography.button,
    color: '#007AFF',
  },
  
  // Input styles
  textInput: {
    height: iPadConstants.components.input.height,
    borderRadius: iPadConstants.components.input.borderRadius,
    paddingHorizontal: iPadConstants.components.input.paddingHorizontal,
    borderWidth: 1,
    borderColor: '#E5E5E7',
    backgroundColor: '#F2F2F7',
    fontSize: iPadConstants.typography.body.fontSize,
  },
  
  // Card styles
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: iPadConstants.components.card.borderRadius,
    padding: iPadConstants.components.card.padding,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: iPadConstants.spacing.md,
  },
  
  // Modal styles
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: iPadConstants.components.modal.borderRadius,
    padding: iPadConstants.components.modal.padding,
    margin: iPadConstants.spacing.xl,
    maxWidth: width * 0.8,
    alignSelf: 'center',
  },
  
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // List styles
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: iPadConstants.spacing.md,
    paddingHorizontal: iPadConstants.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
    minHeight: iPadConstants.layout.listItemHeight,
  },
  
  listItemContent: {
    flex: 1,
    marginLeft: iPadConstants.spacing.md,
  },
  
  // Grid styles
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: iPadConstants.layout.gridGap,
    paddingHorizontal: iPadConstants.spacing.md,
  },
  
  gridItem: {
    flex: 1,
    minWidth: 300,
    maxWidth: 400,
  },
  
  // Section styles
  section: {
    marginBottom: iPadConstants.layout.sectionSpacing,
  },
  
  sectionHeader: {
    ...iPadConstants.typography.h3,
    marginBottom: iPadConstants.spacing.lg,
    paddingBottom: iPadConstants.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  
  // Navigation styles
  tabBar: {
    height: 80,
    paddingBottom: 20,
    paddingTop: 12,
  },
  
  tabBarLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  
  // Responsive utilities
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
  
  spaceAround: {
    justifyContent: 'space-around',
  },
  
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Spacing utilities
  mt_xs: { marginTop: iPadConstants.spacing.xs },
  mt_sm: { marginTop: iPadConstants.spacing.sm },
  mt_md: { marginTop: iPadConstants.spacing.md },
  mt_lg: { marginTop: iPadConstants.spacing.lg },
  mt_xl: { marginTop: iPadConstants.spacing.xl },
  
  mb_xs: { marginBottom: iPadConstants.spacing.xs },
  mb_sm: { marginBottom: iPadConstants.spacing.sm },
  mb_md: { marginBottom: iPadConstants.spacing.md },
  mb_lg: { marginBottom: iPadConstants.spacing.lg },
  mb_xl: { marginBottom: iPadConstants.spacing.xl },
  
  mx_xs: { marginHorizontal: iPadConstants.spacing.xs },
  mx_sm: { marginHorizontal: iPadConstants.spacing.sm },
  mx_md: { marginHorizontal: iPadConstants.spacing.md },
  mx_lg: { marginHorizontal: iPadConstants.spacing.lg },
  mx_xl: { marginHorizontal: iPadConstants.spacing.xl },
  
  my_xs: { marginVertical: iPadConstants.spacing.xs },
  my_sm: { marginVertical: iPadConstants.spacing.sm },
  my_md: { marginVertical: iPadConstants.spacing.md },
  my_lg: { marginVertical: iPadConstants.spacing.lg },
  my_xl: { marginVertical: iPadConstants.spacing.xl },
  
  pt_xs: { paddingTop: iPadConstants.spacing.xs },
  pt_sm: { paddingTop: iPadConstants.spacing.sm },
  pt_md: { paddingTop: iPadConstants.spacing.md },
  pt_lg: { paddingTop: iPadConstants.spacing.lg },
  pt_xl: { paddingTop: iPadConstants.spacing.xl },
  
  pb_xs: { paddingBottom: iPadConstants.spacing.xs },
  pb_sm: { paddingBottom: iPadConstants.spacing.sm },
  pb_md: { paddingBottom: iPadConstants.spacing.md },
  pb_lg: { paddingBottom: iPadConstants.spacing.lg },
  pb_xl: { paddingBottom: iPadConstants.spacing.xl },
  
  px_xs: { paddingHorizontal: iPadConstants.spacing.xs },
  px_sm: { paddingHorizontal: iPadConstants.spacing.sm },
  px_md: { paddingHorizontal: iPadConstants.spacing.md },
  px_lg: { paddingHorizontal: iPadConstants.spacing.lg },
  px_xl: { paddingHorizontal: iPadConstants.spacing.xl },
  
  py_xs: { paddingVertical: iPadConstants.spacing.xs },
  py_sm: { paddingVertical: iPadConstants.spacing.sm },
  py_md: { paddingVertical: iPadConstants.spacing.md },
  py_lg: { paddingVertical: iPadConstants.spacing.lg },
  py_xl: { paddingVertical: iPadConstants.spacing.xl },
});

// Utility for conditional iPad styles
export const getIPadStyles = (isTablet: boolean = false) => {
  const getStyle = (phoneStyle: ViewStyle | TextStyle, tabletStyle?: ViewStyle | TextStyle) => {
    return isTablet && tabletStyle ? [phoneStyle, tabletStyle] : phoneStyle;
  };
  
  const getSpacing = (multiplier: number = 1) => {
    return isTablet ? iPadConstants.spacing.md * multiplier : iPadConstants.spacing.sm * multiplier;
  };
  
  const getFontSize = (baseSize: number) => {
    return isTablet ? baseSize + 2 : baseSize;
  };
  
  return {
    getStyle,
    getSpacing,
    getFontSize,
    isTablet,
    constants: iPadConstants,
    styles: iPadStyles,
  };
};

// Responsive dimension utilities
export const getResponsiveDimensions = (isTablet: boolean = false) => {
  return {
    screenWidth: width,
    screenHeight: height,
    containerWidth: isTablet ? Math.min(width * 0.9, 1200) : width * 0.95,
    modalWidth: isTablet ? Math.min(width * 0.7, 600) : width * 0.9,
    cardWidth: isTablet ? Math.min(width * 0.45, 400) : width * 0.9,
    isTablet,
  };
};