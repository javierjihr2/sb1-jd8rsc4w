import { useRef, useCallback, useMemo } from 'react';
import { Animated, Easing, InteractionManager } from 'react-native';

// Hook para animaciones optimizadas con 120 FPS
export const useOptimizedAnimations = () => {
  // Configuraciones optimizadas para 120 FPS
  const animationConfig = useMemo(() => ({
    // Duraciones más cortas para 120 FPS
    fast: 150,
    medium: 250,
    slow: 400,
    // Easing optimizado
    easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
    // Siempre usar native driver
    useNativeDriver: true,
  }), []);

  // Animación de fade optimizada
  const createFadeAnimation = useCallback((animatedValue: Animated.Value, toValue: number, duration?: number) => {
    return Animated.timing(animatedValue, {
      toValue,
      duration: duration || animationConfig.medium,
      easing: animationConfig.easing,
      useNativeDriver: true,
    });
  }, [animationConfig]);

  // Animación de escala optimizada
  const createScaleAnimation = useCallback((animatedValue: Animated.Value, toValue: number, duration?: number) => {
    return Animated.spring(animatedValue, {
      toValue,
      tension: 300,
      friction: 8,
      useNativeDriver: true,
    });
  }, []);

  // Animación de slide optimizada
  const createSlideAnimation = useCallback((animatedValue: Animated.Value, toValue: number, duration?: number) => {
    return Animated.timing(animatedValue, {
      toValue,
      duration: duration || animationConfig.fast,
      easing: animationConfig.easing,
      useNativeDriver: true,
    });
  }, [animationConfig]);

  // Animación de rotación optimizada
  const createRotateAnimation = useCallback((animatedValue: Animated.Value, duration?: number) => {
    return Animated.loop(
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: duration || 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
  }, []);

  // Animación de pulso optimizada
  const createPulseAnimation = useCallback((animatedValue: Animated.Value, scale: number = 1.1) => {
    return Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: scale,
          duration: animationConfig.medium,
          easing: animationConfig.easing,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: animationConfig.medium,
          easing: animationConfig.easing,
          useNativeDriver: true,
        }),
      ])
    );
  }, [animationConfig]);

  // Ejecutar animación después de interacciones
  const runAfterInteractions = useCallback((animation: Animated.CompositeAnimation) => {
    InteractionManager.runAfterInteractions(() => {
      animation.start();
    });
  }, []);

  // Animación de entrada optimizada
  const createEnterAnimation = useCallback((fadeValue: Animated.Value, slideValue: Animated.Value) => {
    return Animated.parallel([
      createFadeAnimation(fadeValue, 1),
      createSlideAnimation(slideValue, 0),
    ]);
  }, [createFadeAnimation, createSlideAnimation]);

  // Animación de salida optimizada
  const createExitAnimation = useCallback((fadeValue: Animated.Value, slideValue: Animated.Value, slideDistance: number = 50) => {
    return Animated.parallel([
      createFadeAnimation(fadeValue, 0),
      createSlideAnimation(slideValue, slideDistance),
    ]);
  }, [createFadeAnimation, createSlideAnimation]);

  return {
    animationConfig,
    createFadeAnimation,
    createScaleAnimation,
    createSlideAnimation,
    createRotateAnimation,
    createPulseAnimation,
    createEnterAnimation,
    createExitAnimation,
    runAfterInteractions,
  };
};

// Hook para valores animados optimizados
export const useAnimatedValues = (initialValues: { [key: string]: number }) => {
  const values = useRef<{ [key: string]: Animated.Value }>({});

  // Inicializar valores solo una vez
  if (Object.keys(values.current).length === 0) {
    Object.entries(initialValues).forEach(([key, value]) => {
      values.current[key] = new Animated.Value(value);
    });
  }

  return values.current;
};

// Hook para animaciones de lista optimizadas
export const useListAnimations = () => {
  const { createFadeAnimation, createSlideAnimation } = useOptimizedAnimations();

  const animateListItem = useCallback((index: number, animatedValue: Animated.Value, delay: number = 0) => {
    return Animated.sequence([
      Animated.delay(delay * index),
      createFadeAnimation(animatedValue, 1, 200),
    ]);
  }, [createFadeAnimation]);

  const staggeredListAnimation = useCallback((animatedValues: Animated.Value[], staggerDelay: number = 100) => {
    return Animated.stagger(
      staggerDelay,
      animatedValues.map(value => createFadeAnimation(value, 1, 200))
    );
  }, [createFadeAnimation]);

  return {
    animateListItem,
    staggeredListAnimation,
  };
};

// Hook para animaciones de gestos optimizadas
export const useGestureAnimations = () => {
  const createGestureAnimation = useCallback((animatedValue: Animated.ValueXY, toValue: { x: number; y: number }) => {
    return Animated.spring(animatedValue, {
      toValue,
      tension: 300,
      friction: 8,
      useNativeDriver: true,
    });
  }, []);

  const createSwipeAnimation = useCallback((animatedValue: Animated.Value, direction: 'left' | 'right' | 'up' | 'down', distance: number = 300) => {
    const toValue = direction === 'left' ? -distance : direction === 'right' ? distance : direction === 'up' ? -distance : distance;
    
    return Animated.timing(animatedValue, {
      toValue,
      duration: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
  }, []);

  return {
    createGestureAnimation,
    createSwipeAnimation,
  };
};