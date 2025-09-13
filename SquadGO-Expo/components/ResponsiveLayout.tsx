import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useDeviceInfo } from '../hooks/useDeviceInfo';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  style?: ViewStyle;
  phoneStyle?: ViewStyle;
  tabletStyle?: ViewStyle;
  landscapeStyle?: ViewStyle;
  portraitStyle?: ViewStyle;
  maxWidth?: number;
  centerContent?: boolean;
}

export const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  children,
  style,
  phoneStyle,
  tabletStyle,
  landscapeStyle,
  portraitStyle,
  maxWidth,
  centerContent = false,
}) => {
  const { isTablet, isLandscape, isPortrait, width } = useDeviceInfo();

  const getResponsiveStyle = (): ViewStyle => {
    let responsiveStyle: ViewStyle = { ...style };

    // Aplicar estilos específicos del dispositivo
    if (isTablet && tabletStyle) {
      responsiveStyle = { ...responsiveStyle, ...tabletStyle };
    } else if (!isTablet && phoneStyle) {
      responsiveStyle = { ...responsiveStyle, ...phoneStyle };
    }

    // Aplicar estilos de orientación
    if (isLandscape && landscapeStyle) {
      responsiveStyle = { ...responsiveStyle, ...landscapeStyle };
    } else if (isPortrait && portraitStyle) {
      responsiveStyle = { ...responsiveStyle, ...portraitStyle };
    }

    // Aplicar ancho máximo si se especifica
    if (maxWidth && width > maxWidth) {
      responsiveStyle.maxWidth = maxWidth;
      if (centerContent) {
        responsiveStyle.alignSelf = 'center';
      }
    }

    return responsiveStyle;
  };

  return (
    <View style={[styles.container, getResponsiveStyle()]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default ResponsiveLayout;