import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { View, ActivityIndicator, Dimensions, Text } from 'react-native';
import { InteractionManager } from 'react-native';

// Hook para lazy loading de componentes
export const useLazyComponent = <T extends React.ComponentType<any>>(
  importFunction: () => Promise<{ default: T }>,
  fallback?: React.ComponentType
) => {
  const [Component, setComponent] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadComponent = async () => {
      try {
        // Esperar a que las interacciones terminen antes de cargar
        await new Promise(resolve => {
          InteractionManager.runAfterInteractions(() => resolve(undefined));
        });

        const module = await importFunction();
        
        if (isMounted) {
          setComponent(() => module.default);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err as Error);
          setLoading(false);
        }
      }
    };

    loadComponent();

    return () => {
      isMounted = false;
    };
  }, []);

  return { Component, loading, error };
};

// Hook para lazy loading basado en visibilidad
export const useIntersectionObserver = (threshold = 0.1) => {
  const [isVisible, setIsVisible] = useState(false);
  const [ref, setRef] = useState<View | null>(null);

  useEffect(() => {
    if (!ref) return;

    // Simulación de intersection observer para React Native
    const checkVisibility = () => {
      if (ref) {
        ref.measure((x, y, width, height, pageX, pageY) => {
          const screenHeight = Dimensions.get('window').height;
          const isInViewport = pageY < screenHeight && pageY + height > 0;
          setIsVisible(isInViewport);
        });
      }
    };

    const timer = setInterval(checkVisibility, 100);
    return () => clearInterval(timer);
  }, [ref, threshold]);

  return { ref: setRef, isVisible };
};

// Hook para lazy loading de imágenes
export const useLazyImage = (uri: string, placeholder?: string) => {
  const [imageUri, setImageUri] = useState<string | undefined>(placeholder);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { ref, isVisible } = useIntersectionObserver();

  useEffect(() => {
    if (!isVisible || imageUri === uri) return;

    const loadImage = async () => {
      try {
        // Precargar la imagen
        await new Promise((resolve, reject) => {
          const image = new Image();
          image.onload = resolve;
          image.onerror = reject;
          image.src = uri;
        });

        setImageUri(uri);
        setLoading(false);
      } catch (err) {
        setError(err as Error);
        setLoading(false);
      }
    };

    loadImage();
  }, [isVisible, uri, imageUri]);

  return { ref, imageUri, loading, error };
};

// Hook para lazy loading de listas
export const useLazyList = <T>(
  items: T[],
  batchSize = 10,
  delay = 100
) => {
  const [visibleItems, setVisibleItems] = useState<T[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadMoreItems = React.useCallback(() => {
    if (loading || currentIndex >= items.length) return;

    setLoading(true);
    
    setTimeout(() => {
      const nextIndex = Math.min(currentIndex + batchSize, items.length);
      const newItems = items.slice(currentIndex, nextIndex);
      
      setVisibleItems(prev => [...prev, ...newItems]);
      setCurrentIndex(nextIndex);
      setLoading(false);
    }, delay);
  }, [items, currentIndex, batchSize, delay, loading]);

  const hasMore = currentIndex < items.length;

  // Cargar items iniciales
  useEffect(() => {
    if (visibleItems.length === 0 && items.length > 0) {
      loadMoreItems();
    }
  }, [items, visibleItems.length, loadMoreItems]);

  const reset = React.useCallback(() => {
    setVisibleItems([]);
    setCurrentIndex(0);
    setLoading(false);
  }, []);

  return {
    visibleItems,
    loading,
    hasMore,
    loadMoreItems,
    reset
  };
};

// Hook para lazy loading con scroll infinito
export const useInfiniteScroll = <T>(
  fetchFunction: (page: number) => Promise<T[]>,
  initialPage = 0
) => {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [page, setPage] = useState(initialPage);
  const [hasMore, setHasMore] = useState(true);

  const loadMore = React.useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      const newItems = await fetchFunction(page);
      
      if (newItems.length === 0) {
        setHasMore(false);
      } else {
        setItems(prev => [...prev, ...newItems]);
        setPage(prev => prev + 1);
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [fetchFunction, page, loading, hasMore]);

  const reset = React.useCallback(() => {
    setItems([]);
    setPage(initialPage);
    setHasMore(true);
    setError(null);
  }, [initialPage]);

  // Cargar página inicial
  useEffect(() => {
    if (items.length === 0 && !loading) {
      loadMore();
    }
  }, []);

  return {
    items,
    loading,
    error,
    hasMore,
    loadMore,
    reset
  };
};

// Hook para lazy loading de datos con cache
export const useLazyData = <T>(
  key: string,
  fetchFunction: () => Promise<T>,
  options: {
    cacheTime?: number;
    staleTime?: number;
    enabled?: boolean;
  } = {}
) => {
  const {
    cacheTime = 5 * 60 * 1000, // 5 minutos
    staleTime = 1 * 60 * 1000,  // 1 minuto
    enabled = true
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastFetch, setLastFetch] = useState<number>(0);

  const isStale = Date.now() - lastFetch > staleTime;
  const isExpired = Date.now() - lastFetch > cacheTime;

  const fetchData = React.useCallback(async (force = false) => {
    if (!enabled || (loading && !force)) return;
    if (!force && data && !isStale) return;

    setLoading(true);
    setError(null);

    try {
      const result = await fetchFunction();
      setData(result);
      setLastFetch(Date.now());
    } catch (err) {
      setError(err as Error);
      if (isExpired) {
        setData(null);
      }
    } finally {
      setLoading(false);
    }
  }, [fetchFunction, enabled, loading, data, isStale, isExpired]);

  const refetch = React.useCallback(() => {
    return fetchData(true);
  }, [fetchData]);

  const invalidate = React.useCallback(() => {
    setData(null);
    setLastFetch(0);
  }, []);

  // Fetch inicial y cuando cambia enabled
  useEffect(() => {
    if (enabled && (!data || isExpired)) {
      fetchData();
    }
  }, [enabled, fetchData, data, isExpired]);

  return {
    data,
    loading,
    error,
    isStale,
    refetch,
    invalidate
  };
};