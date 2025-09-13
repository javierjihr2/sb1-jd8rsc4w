import React, { useRef, useState } from 'react';
import {
  View,
  Image,
  PanResponder,
  Animated,
  Dimensions,
  StyleSheet,
  ImageStyle,
  ViewStyle,
} from 'react-native';
import { useDeviceInfo } from '../hooks/useDeviceInfo';

interface ZoomableImageProps {
  source: { uri: string } | number;
  style?: ImageStyle;
  containerStyle?: ViewStyle;
  minScale?: number;
  maxScale?: number;
  doubleTapScale?: number;
  resetOnDoubleTap?: boolean;
  onZoomChange?: (scale: number) => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const ZoomableImage: React.FC<ZoomableImageProps> = ({
  source,
  style,
  containerStyle,
  minScale = 1,
  maxScale = 4,
  doubleTapScale = 2,
  resetOnDoubleTap = true,
  onZoomChange,
}) => {
  const { isTablet } = useDeviceInfo();
  const scale = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  
  const [lastScale, setLastScale] = useState(1);
  const [lastTranslateX, setLastTranslateX] = useState(0);
  const [lastTranslateY, setLastTranslateY] = useState(0);
  const currentScaleRef = useRef(1);
  const currentTranslateXRef = useRef(0);
  const currentTranslateYRef = useRef(0);
  const [isZooming, setIsZooming] = useState(false);
  const [lastTap, setLastTap] = useState(0);

  // Ajustar escalas para iPad
  const adjustedMaxScale = isTablet ? maxScale * 1.5 : maxScale;
  const adjustedDoubleTapScale = isTablet ? doubleTapScale * 1.2 : doubleTapScale;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Activar solo si hay movimiento significativo o múltiples toques
        return (
          Math.abs(gestureState.dx) > 5 ||
          Math.abs(gestureState.dy) > 5 ||
          evt.nativeEvent.touches.length > 1
        );
      },
      onPanResponderGrant: (evt) => {
        // Detectar doble tap
        const now = Date.now();
        if (now - lastTap < 300) {
          handleDoubleTap();
          return;
        }
        setLastTap(now);

        // Configurar valores iniciales
        scale.setOffset(lastScale);
        translateX.setOffset(lastTranslateX);
        translateY.setOffset(lastTranslateY);
        
        if (evt.nativeEvent.touches.length > 1) {
          setIsZooming(true);
        }
      },
      onPanResponderMove: (evt, gestureState) => {
        const touches = evt.nativeEvent.touches;
        
        if (touches.length === 2) {
          // Gesto de pinch para zoom
          const touch1 = touches[0];
          const touch2 = touches[1];
          
          const distance = Math.sqrt(
            Math.pow(touch2.pageX - touch1.pageX, 2) +
            Math.pow(touch2.pageY - touch1.pageY, 2)
          );
          
          // Calcular nueva escala
          const newScale = Math.max(
            minScale,
            Math.min(adjustedMaxScale, lastScale * (distance / 200))
          );
          
          scale.setValue(newScale - lastScale);
          currentScaleRef.current = newScale;
          
          if (onZoomChange) {
            onZoomChange(newScale);
          }
        } else if (touches.length === 1 && lastScale > minScale) {
          // Pan solo si está zoomeado
          const maxTranslateX = (screenWidth * (lastScale - 1)) / 2;
          const maxTranslateY = (screenHeight * (lastScale - 1)) / 2;
          
          const newTranslateX = Math.max(
            -maxTranslateX,
            Math.min(maxTranslateX, gestureState.dx)
          );
          const newTranslateY = Math.max(
            -maxTranslateY,
            Math.min(maxTranslateY, gestureState.dy)
          );
          
          translateX.setValue(newTranslateX);
          translateY.setValue(newTranslateY);
          currentTranslateXRef.current = newTranslateX;
          currentTranslateYRef.current = newTranslateY;
        }
      },
      onPanResponderRelease: () => {
        // Finalizar offsets
        scale.flattenOffset();
        translateX.flattenOffset();
        translateY.flattenOffset();
        
        // Actualizar valores de referencia
        const currentScale = currentScaleRef.current;
        const currentTranslateX = currentTranslateXRef.current;
        const currentTranslateY = currentTranslateYRef.current;
        
        setLastScale(currentScale);
        setLastTranslateX(currentTranslateX);
        setLastTranslateY(currentTranslateY);
        setIsZooming(false);
        
        // Verificar límites y corregir si es necesario
        if (currentScale < minScale) {
          // Volver al tamaño mínimo
          resetToMinScale();
        } else if (currentScale > adjustedMaxScale) {
          // Limitar al tamaño máximo
          Animated.spring(scale, {
            toValue: adjustedMaxScale,
            useNativeDriver: true,
          }).start(() => {
            setLastScale(adjustedMaxScale);
          });
        }
        
        // Corregir posición si está fuera de límites
        correctPosition(currentScale);
      },
    })
  ).current;

  const handleDoubleTap = () => {
    const targetScale = lastScale > minScale && resetOnDoubleTap ? minScale : adjustedDoubleTapScale;
    
    Animated.parallel([
      Animated.spring(scale, {
        toValue: targetScale,
        useNativeDriver: true,
      }),
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setLastScale(targetScale);
      setLastTranslateX(0);
      setLastTranslateY(0);
      
      if (onZoomChange) {
        onZoomChange(targetScale);
      }
    });
  };

  const resetToMinScale = () => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: minScale,
        useNativeDriver: true,
      }),
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setLastScale(minScale);
      setLastTranslateX(0);
      setLastTranslateY(0);
      
      if (onZoomChange) {
        onZoomChange(minScale);
      }
    });
  };

  const correctPosition = (currentScale: number) => {
    const maxTranslateX = (screenWidth * (currentScale - 1)) / 2;
    const maxTranslateY = (screenHeight * (currentScale - 1)) / 2;
    
    let newTranslateX = lastTranslateX;
    let newTranslateY = lastTranslateY;
    
    if (Math.abs(lastTranslateX) > maxTranslateX) {
      newTranslateX = lastTranslateX > 0 ? maxTranslateX : -maxTranslateX;
    }
    
    if (Math.abs(lastTranslateY) > maxTranslateY) {
      newTranslateY = lastTranslateY > 0 ? maxTranslateY : -maxTranslateY;
    }
    
    if (newTranslateX !== lastTranslateX || newTranslateY !== lastTranslateY) {
      Animated.parallel([
        Animated.spring(translateX, {
          toValue: newTranslateX,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: newTranslateY,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setLastTranslateX(newTranslateX);
        setLastTranslateY(newTranslateY);
      });
    }
  };

  return (
    <View style={[styles.container, containerStyle]} {...panResponder.panHandlers}>
      <Animated.View
        style={{
          transform: [
            { scale },
            { translateX },
            { translateY },
          ],
        }}
      >
        <Image
          source={source}
          style={[styles.image, style]}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    width: screenWidth,
    height: screenHeight * 0.6,
  },
});

export default ZoomableImage;