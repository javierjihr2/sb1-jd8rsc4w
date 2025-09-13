import React, { useRef } from 'react';
import {
  View,
  Modal,
  PanResponder,
  Animated,
  Dimensions,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { useDeviceInfo } from '../hooks/useDeviceInfo';

interface SwipeableModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  swipeDirection?: 'down' | 'up' | 'left' | 'right';
  swipeThreshold?: number;
  animationType?: 'slide' | 'fade' | 'none';
  presentationStyle?: 'fullScreen' | 'pageSheet' | 'formSheet' | 'overFullScreen';
  style?: ViewStyle;
}

export const SwipeableModal: React.FC<SwipeableModalProps> = ({
  visible,
  onClose,
  children,
  swipeDirection = 'down',
  swipeThreshold = 100,
  animationType = 'slide',
  presentationStyle = 'pageSheet',
  style,
}) => {
  const { isTablet, width, height } = useDeviceInfo();
  const pan = useRef(new Animated.ValueXY()).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // En iPad, requerir un movimiento más deliberado
        const threshold = isTablet ? 15 : 10;
        return Math.abs(gestureState.dx) > threshold || Math.abs(gestureState.dy) > threshold;
      },
      onPanResponderGrant: () => {
        pan.setOffset({
          x: (pan.x as any)._value,
          y: (pan.y as any)._value,
        });
      },
      onPanResponderMove: (evt, gestureState) => {
        // Limitar el movimiento según la dirección configurada
        let newX = 0;
        let newY = 0;

        switch (swipeDirection) {
          case 'down':
            newY = Math.max(0, gestureState.dy);
            break;
          case 'up':
            newY = Math.min(0, gestureState.dy);
            break;
          case 'left':
            newX = Math.min(0, gestureState.dx);
            break;
          case 'right':
            newX = Math.max(0, gestureState.dx);
            break;
        }

        pan.setValue({ x: newX, y: newY });
        
        // Ajustar opacidad basada en el progreso del swipe
        const progress = Math.abs(swipeDirection === 'down' || swipeDirection === 'up' ? newY : newX) / swipeThreshold;
        opacity.setValue(Math.max(0.3, 1 - progress * 0.7));
      },
      onPanResponderRelease: (evt, gestureState) => {
        pan.flattenOffset();
        
        const distance = swipeDirection === 'down' || swipeDirection === 'up' 
          ? Math.abs(gestureState.dy)
          : Math.abs(gestureState.dx);
        
        const velocity = swipeDirection === 'down' || swipeDirection === 'up'
          ? Math.abs(gestureState.vy)
          : Math.abs(gestureState.vx);

        // En iPad, ajustar los umbrales para gestos más naturales
        const adjustedThreshold = isTablet ? swipeThreshold * 1.2 : swipeThreshold;
        const velocityThreshold = isTablet ? 0.8 : 1.2;

        if (distance > adjustedThreshold || velocity > velocityThreshold) {
          // Cerrar modal con animación
          const toValue = swipeDirection === 'down' ? height : 
                         swipeDirection === 'up' ? -height :
                         swipeDirection === 'left' ? -width : width;
          
          Animated.parallel([
            Animated.timing(pan, {
              toValue: swipeDirection === 'down' || swipeDirection === 'up' 
                ? { x: 0, y: toValue }
                : { x: toValue, y: 0 },
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start(() => {
            onClose();
            // Reset para la próxima vez
            pan.setValue({ x: 0, y: 0 });
            opacity.setValue(1);
          });
        } else {
          // Volver a la posición original
          Animated.parallel([
            Animated.spring(pan, {
              toValue: { x: 0, y: 0 },
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 1,
              duration: 150,
              useNativeDriver: true,
            }),
          ]).start();
        }
      },
    })
  ).current;

  return (
    <Modal
      visible={visible}
      animationType={animationType}
      presentationStyle={presentationStyle}
      onRequestClose={onClose}
      transparent={presentationStyle === 'overFullScreen'}
    >
      <Animated.View
        style={[
          styles.container,
          {
            opacity,
            transform: pan.getTranslateTransform(),
          },
          style,
        ]}
        {...panResponder.panHandlers}
      >
        {children}
      </Animated.View>
    </Modal>
  );
};

interface PinchZoomViewProps {
  children: React.ReactNode;
  minScale?: number;
  maxScale?: number;
  style?: ViewStyle;
}

export const PinchZoomView: React.FC<PinchZoomViewProps> = ({
  children,
  minScale = 1,
  maxScale = 3,
  style,
}) => {
  const { isTablet } = useDeviceInfo();
  const scale = useRef(new Animated.Value(1)).current;
  const lastScale = useRef(1);
  const lastTapRef = useRef(0);

  const pinchResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt) => {
        // Solo activar en gestos de pinch (2 dedos)
        return evt.nativeEvent.touches.length === 2;
      },
      onPanResponderGrant: () => {
        lastScale.current = (scale as any)._value;
      },
      onPanResponderMove: (evt, gestureState) => {
        if (evt.nativeEvent.touches.length === 2) {
          const touch1 = evt.nativeEvent.touches[0];
          const touch2 = evt.nativeEvent.touches[1];
          
          const distance = Math.sqrt(
            Math.pow(touch2.pageX - touch1.pageX, 2) +
            Math.pow(touch2.pageY - touch1.pageY, 2)
          );
          
          // Calcular escala basada en la distancia inicial
          const scaleValue = Math.max(
            minScale,
            Math.min(maxScale, lastScale.current * (distance / 200))
          );
          
          scale.setValue(scaleValue);
        }
      },
      onPanResponderRelease: () => {
        // En iPad, permitir zoom más suave
        if (isTablet && (scale as any)._value < minScale * 1.1) {
          Animated.spring(scale, {
            toValue: minScale,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const handleDoubleTap = () => {
    const targetScale = (scale as any)._value > minScale ? minScale : maxScale * 0.7;
    Animated.spring(scale, {
      toValue: targetScale,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      style={[
        style,
        {
          transform: [{ scale }],
        },
      ]}
      {...pinchResponder.panHandlers}
      onTouchEnd={(evt) => {
        // Detectar doble tap
        if (evt.nativeEvent.touches.length === 0) {
          const now = Date.now();
          const lastTap = lastTapRef.current;
          const timeDiff = now - lastTap;
          
          if (timeDiff < 300) {
            handleDoubleTap();
          }
          
          lastTapRef.current = now;
        }
      }}
    >
      {children}
    </Animated.View>
  );
};

interface SwipeableCardProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  swipeThreshold?: number;
  style?: ViewStyle;
}

export const SwipeableCard: React.FC<SwipeableCardProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  swipeThreshold = 120,
  style,
}) => {
  const { isTablet, width } = useDeviceInfo();
  const pan = useRef(new Animated.ValueXY()).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const rotation = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // En iPad, requerir un movimiento más deliberado
        const threshold = isTablet ? 20 : 15;
        return Math.abs(gestureState.dx) > threshold;
      },
      onPanResponderGrant: () => {
        pan.setOffset({
          x: (pan.x as any)._value,
          y: (pan.y as any)._value,
        });
      },
      onPanResponderMove: (evt, gestureState) => {
        pan.setValue({ x: gestureState.dx, y: gestureState.dy * 0.3 });
        
        // Rotar ligeramente la tarjeta
        const rotationValue = gestureState.dx / width * 30;
        rotation.setValue(rotationValue);
        
        // Ajustar opacidad
        const progress = Math.abs(gestureState.dx) / swipeThreshold;
        opacity.setValue(Math.max(0.5, 1 - progress * 0.5));
      },
      onPanResponderRelease: (evt, gestureState) => {
        pan.flattenOffset();
        
        const adjustedThreshold = isTablet ? swipeThreshold * 1.3 : swipeThreshold;
        
        if (Math.abs(gestureState.dx) > adjustedThreshold) {
          // Swipe completo
          const direction = gestureState.dx > 0 ? 1 : -1;
          
          Animated.parallel([
            Animated.timing(pan, {
              toValue: { x: direction * width * 1.5, y: gestureState.dy },
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(rotation, {
              toValue: direction * 45,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start(() => {
            if (direction > 0 && onSwipeRight) {
              onSwipeRight();
            } else if (direction < 0 && onSwipeLeft) {
              onSwipeLeft();
            }
            
            // Reset
            pan.setValue({ x: 0, y: 0 });
            opacity.setValue(1);
            rotation.setValue(0);
          });
        } else {
          // Volver a la posición original
          Animated.parallel([
            Animated.spring(pan, {
              toValue: { x: 0, y: 0 },
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 1,
              duration: 150,
              useNativeDriver: true,
            }),
            Animated.spring(rotation, {
              toValue: 0,
              useNativeDriver: true,
            }),
          ]).start();
        }
      },
    })
  ).current;

  return (
    <Animated.View
      style={[
        style,
        {
          opacity,
          transform: [
            ...pan.getTranslateTransform(),
            {
              rotate: rotation.interpolate({
                inputRange: [-45, 45],
                outputRange: ['-45deg', '45deg'],
              }),
            },
          ],
        },
      ]}
      {...panResponder.panHandlers}
    >
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default {
  SwipeableModal,
  PinchZoomView,
  SwipeableCard,
};