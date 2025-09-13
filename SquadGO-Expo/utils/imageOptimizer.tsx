import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Image,
  ImageProps,
  ImageSourcePropType,
  View,
  StyleSheet,
  Animated,
  Dimensions,
  Platform
} from 'react-native';
import { useAnalytics } from '../hooks/useAnalytics';
import { useMonitoring } from '../hooks/useMonitoring';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface OptimizedImageProps extends Omit<ImageProps, 'source'> {
  source: ImageSourcePropType | string;
  placeholder?: ImageSourcePropType;
  fallback?: ImageSourcePropType;
  quality?: 'low' | 'medium' | 'high' | 'original';
  lazy?: boolean;
  cache?: boolean;
  resize?: {
    width?: number;
    height?: number;
    mode?: 'contain' | 'cover' | 'stretch' | 'center';
  };
  progressive?: boolean;
  blur?: number;
  onLoadStart?: () => void;
  onLoadEnd?: () => void;
  onError?: (error: any) => void;
  priority?: 'low' | 'normal' | 'high';
}

interface ImageCache {
  [key: string]: {
    uri: string;
    timestamp: number;
    size: number;
    quality: string;
  };
}

class ImageCacheManager {
  private cache: ImageCache = {};
  private maxCacheSize = 50 * 1024 * 1024; // 50MB
  private maxCacheAge = 7 * 24 * 60 * 60 * 1000; // 7 días
  private currentCacheSize = 0;

  constructor() {
    this.loadCacheFromStorage();
  }

  private async loadCacheFromStorage() {
    try {
      // En una implementación real, cargarías desde AsyncStorage
      // const cacheData = await AsyncStorage.getItem('imageCache');
      // if (cacheData) {
      //   this.cache = JSON.parse(cacheData);
      //   this.calculateCacheSize();
      // }
    } catch (error) {
      console.warn('Error loading image cache:', error);
    }
  }

  private async saveCacheToStorage() {
    try {
      // En una implementación real, guardarías en AsyncStorage
      // await AsyncStorage.setItem('imageCache', JSON.stringify(this.cache));
    } catch (error) {
      console.warn('Error saving image cache:', error);
    }
  }

  private calculateCacheSize() {
    this.currentCacheSize = Object.values(this.cache)
      .reduce((total, item) => total + item.size, 0);
  }

  private cleanExpiredCache() {
    const now = Date.now();
    const expiredKeys = Object.keys(this.cache).filter(
      key => now - this.cache[key].timestamp > this.maxCacheAge
    );

    expiredKeys.forEach(key => {
      this.currentCacheSize -= this.cache[key].size;
      delete this.cache[key];
    });

    if (expiredKeys.length > 0) {
      this.saveCacheToStorage();
    }
  }

  private evictLRU() {
    const sortedEntries = Object.entries(this.cache)
      .sort(([, a], [, b]) => a.timestamp - b.timestamp);

    while (this.currentCacheSize > this.maxCacheSize && sortedEntries.length > 0) {
      const [key, entry] = sortedEntries.shift()!;
      this.currentCacheSize -= entry.size;
      delete this.cache[key];
    }

    this.saveCacheToStorage();
  }

  getCachedImage(key: string): string | null {
    this.cleanExpiredCache();
    const cached = this.cache[key];
    if (cached) {
      // Actualizar timestamp para LRU
      cached.timestamp = Date.now();
      return cached.uri;
    }
    return null;
  }

  setCachedImage(key: string, uri: string, size: number, quality: string) {
    this.cache[key] = {
      uri,
      timestamp: Date.now(),
      size,
      quality
    };

    this.currentCacheSize += size;

    if (this.currentCacheSize > this.maxCacheSize) {
      this.evictLRU();
    } else {
      this.saveCacheToStorage();
    }
  }

  clearCache() {
    this.cache = {};
    this.currentCacheSize = 0;
    this.saveCacheToStorage();
  }

  getCacheStats() {
    return {
      size: this.currentCacheSize,
      count: Object.keys(this.cache).length,
      maxSize: this.maxCacheSize
    };
  }
}

const imageCache = new ImageCacheManager();

/**
 * Utilidad para optimizar URLs de imágenes
 */
function optimizeImageUrl(
  source: ImageSourcePropType | string,
  quality: string,
  resize?: OptimizedImageProps['resize']
): string {
  let baseUrl: string;

  if (typeof source === 'string') {
    baseUrl = source;
  } else if (source && typeof source === 'object' && 'uri' in source) {
    baseUrl = source.uri || '';
  } else {
    return '';
  }

  // Si es una imagen local, retornar tal como está
  if (!baseUrl.startsWith('http')) {
    return baseUrl;
  }

  const url = new URL(baseUrl);
  const params = new URLSearchParams();

  // Configurar calidad
  const qualityMap = {
    low: '30',
    medium: '60',
    high: '80',
    original: '100'
  };
  params.set('q', qualityMap[quality as keyof typeof qualityMap] || '60');

  // Configurar redimensionamiento
  if (resize) {
    if (resize.width) params.set('w', resize.width.toString());
    if (resize.height) params.set('h', resize.height.toString());
    if (resize.mode) params.set('fit', resize.mode);
  }

  // Configurar formato optimizado
  if (Platform.OS === 'ios') {
    params.set('fm', 'heic');
  } else {
    params.set('fm', 'webp');
  }

  // Auto-optimización
  params.set('auto', 'compress,format');

  url.search = params.toString();
  return url.toString();
}

/**
 * Hook para lazy loading de imágenes
 */
function useImageLazyLoading(enabled: boolean = true) {
  const [isVisible, setIsVisible] = useState(!enabled);
  const viewRef = useRef<View>(null);

  useEffect(() => {
    if (!enabled) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px'
      }
    );

    // En React Native, necesitarías una implementación diferente
    // usando onLayout y scroll events
    
    return () => {
      // observer.disconnect();
    };
  }, [enabled]);

  return { isVisible, viewRef };
}

/**
 * Hook para progresive loading
 */
function useProgressiveLoading(
  source: ImageSourcePropType | string,
  placeholder?: ImageSourcePropType
) {
  const [currentSource, setCurrentSource] = useState(placeholder);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (source) {
      setIsLoading(true);
      setHasError(false);
      
      // Precargar imagen de alta calidad
      Image.prefetch(typeof source === 'string' ? source : source.uri || '')
        .then(() => {
          setCurrentSource(source);
          setIsLoading(false);
          
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true
          }).start();
        })
        .catch(() => {
          setHasError(true);
          setIsLoading(false);
        });
    }
  }, [source]);

  return {
    currentSource,
    isLoading,
    hasError,
    fadeAnim
  };
}

/**
 * Componente de imagen optimizada
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  source,
  placeholder,
  fallback,
  quality = 'medium',
  lazy = false,
  cache = true,
  resize,
  progressive = true,
  blur = 0,
  onLoadStart,
  onLoadEnd,
  onError,
  priority = 'normal',
  style,
  ...props
}) => {
  const { trackEvent } = useAnalytics();
  const { trackError } = useMonitoring();
  const { isVisible } = useImageLazyLoading(lazy);
  
  const optimizedSource = useMemo(() => {
    if (!isVisible && lazy) return placeholder;
    
    const cacheKey = `${typeof source === 'string' ? source : source?.uri}_${quality}_${JSON.stringify(resize)}`;
    
    if (cache) {
      const cached = imageCache.getCachedImage(cacheKey);
      if (cached) {
        return { uri: cached };
      }
    }
    
    const optimizedUrl = optimizeImageUrl(source, quality, resize);
    
    if (cache && optimizedUrl) {
      // Estimar tamaño de imagen (simplificado)
      const estimatedSize = (resize?.width || 300) * (resize?.height || 300) * 0.1;
      imageCache.setCachedImage(cacheKey, optimizedUrl, estimatedSize, quality);
    }
    
    return { uri: optimizedUrl };
  }, [source, quality, resize, cache, isVisible, lazy]);

  const {
    currentSource,
    isLoading,
    hasError,
    fadeAnim
  } = useProgressiveLoading(optimizedSource, placeholder);

  const [loadStartTime, setLoadStartTime] = useState<number>(0);

  const handleLoadStart = () => {
    setLoadStartTime(Date.now());
    onLoadStart?.();
    
    trackEvent('image_load_start', {
      source: typeof source === 'string' ? source : source?.uri,
      quality,
      lazy,
      priority,
      timestamp: Date.now()
    });
  };

  const handleLoadEnd = () => {
    const loadTime = Date.now() - loadStartTime;
    onLoadEnd?.();
    
    trackEvent('image_load_success', {
      source: typeof source === 'string' ? source : source?.uri,
      quality,
      load_time: loadTime,
      lazy,
      priority,
      timestamp: Date.now()
    });
  };

  const handleError = (error: any) => {
    onError?.(error);
    
    trackError(new Error(`Image load failed: ${error.nativeEvent?.error}`), 'image_load_failed', {
      source: typeof source === 'string' ? source : source?.uri,
      quality,
      lazy,
      priority
    });
  };

  if (!isVisible && lazy) {
    return (
      <View style={[styles.placeholder, style]}>
        {placeholder && (
          <Image
            source={placeholder}
            style={[StyleSheet.absoluteFillObject, { opacity: 0.3 }]}
            {...props}
          />
        )}
      </View>
    );
  }

  if (hasError && fallback) {
    return (
      <Image
        source={fallback}
        style={style}
        {...props}
      />
    );
  }

  return (
    <View style={style}>
      {progressive && placeholder && isLoading && (
        <Image
          source={placeholder}
          style={[StyleSheet.absoluteFillObject, { opacity: 0.5 }]}
          blurRadius={blur}
        />
      )}
      
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          { opacity: progressive ? fadeAnim : 1 }
        ]}
      >
        <Image
          source={currentSource}
          style={StyleSheet.absoluteFillObject}
          onLoadStart={handleLoadStart}
          onLoadEnd={handleLoadEnd}
          onError={handleError}
          {...props}
        />
      </Animated.View>
    </View>
  );
};

/**
 * Hook para precargar imágenes
 */
export function useImagePreloader() {
  const [preloadedImages, setPreloadedImages] = useState<Set<string>>(new Set());
  const [preloadErrors, setPreloadErrors] = useState<Record<string, Error>>({});
  const { trackEvent } = useAnalytics();
  const { trackError } = useMonitoring();

  const preloadImage = async (
    source: string,
    priority: 'low' | 'normal' | 'high' = 'normal'
  ) => {
    try {
      const startTime = Date.now();
      await Image.prefetch(source);
      const loadTime = Date.now() - startTime;

      setPreloadedImages(prev => new Set([...prev, source]));
      
      trackEvent('image_preload_success', {
        source,
        load_time: loadTime,
        priority,
        timestamp: Date.now()
      });
    } catch (error) {
      const err = error as Error;
      setPreloadErrors(prev => ({ ...prev, [source]: err }));
      trackError(err, 'image_preload_failed', { source, priority });
    }
  };

  const preloadImages = async (
    sources: Array<{ url: string; priority?: 'low' | 'normal' | 'high' }>
  ) => {
    // Ordenar por prioridad
    const sortedSources = [...sources].sort((a, b) => {
      const priorityOrder = { high: 0, normal: 1, low: 2 };
      const aPriority = priorityOrder[a.priority || 'normal'];
      const bPriority = priorityOrder[b.priority || 'normal'];
      return aPriority - bPriority;
    });

    // Precargar imágenes de alta prioridad primero
    const highPriorityImages = sortedSources.filter(s => s.priority === 'high');
    const otherImages = sortedSources.filter(s => s.priority !== 'high');

    if (highPriorityImages.length > 0) {
      await Promise.allSettled(
        highPriorityImages.map(img => preloadImage(img.url, img.priority))
      );
    }

    // Precargar otras imágenes con delay
    for (const img of otherImages) {
      await new Promise(resolve => setTimeout(resolve, 100));
      preloadImage(img.url, img.priority);
    }
  };

  const clearPreloadCache = () => {
    setPreloadedImages(new Set());
    setPreloadErrors({});
    imageCache.clearCache();
  };

  return {
    preloadImage,
    preloadImages,
    clearPreloadCache,
    preloadedImages,
    preloadErrors,
    isImagePreloaded: (source: string) => preloadedImages.has(source),
    getPreloadError: (source: string) => preloadErrors[source]
  };
}

/**
 * Utilidad para generar thumbnails
 */
export function generateThumbnail(
  source: string,
  size: { width: number; height: number } = { width: 150, height: 150 }
): string {
  return optimizeImageUrl(source, 'low', {
    width: size.width,
    height: size.height,
    mode: 'cover'
  });
}

/**
 * Hook para optimización automática basada en conexión
 */
export function useAdaptiveImageQuality() {
  const [quality, setQuality] = useState<'low' | 'medium' | 'high'>('medium');

  useEffect(() => {
    // En una implementación real, usarías NetInfo para detectar la conexión
    // import NetInfo from '@react-native-netinfo';
    
    // const unsubscribe = NetInfo.addEventListener(state => {
    //   if (state.type === 'wifi') {
    //     setQuality('high');
    //   } else if (state.type === 'cellular') {
    //     if (state.details?.cellularGeneration === '4g') {
    //       setQuality('medium');
    //     } else {
    //       setQuality('low');
    //     }
    //   } else {
    //     setQuality('low');
    //   }
    // });
    
    // return unsubscribe;
  }, []);

  return quality;
}

/**
 * Componente para galería de imágenes optimizada
 */
interface OptimizedImageGalleryProps {
  images: Array<{
    id: string;
    source: string;
    thumbnail?: string;
    alt?: string;
  }>;
  onImagePress?: (image: any, index: number) => void;
  numColumns?: number;
  lazy?: boolean;
}

export const OptimizedImageGallery: React.FC<OptimizedImageGalleryProps> = ({
  images,
  onImagePress,
  numColumns = 2,
  lazy = true
}) => {
  const adaptiveQuality = useAdaptiveImageQuality();
  const { preloadImages } = useImagePreloader();

  useEffect(() => {
    // Precargar thumbnails de las primeras imágenes
    const firstImages = images.slice(0, 6).map(img => ({
      url: img.thumbnail || generateThumbnail(img.source),
      priority: 'high' as const
    }));
    
    preloadImages(firstImages);
  }, [images]);

  const itemWidth = (screenWidth - 30 - (numColumns - 1) * 10) / numColumns;

  return (
    <View style={styles.gallery}>
      {images.map((image, index) => (
        <TouchableOpacity
          key={image.id}
          style={[styles.galleryItem, { width: itemWidth, height: itemWidth }]}
          onPress={() => onImagePress?.(image, index)}
        >
          <OptimizedImage
            source={image.source}
            placeholder={{ uri: image.thumbnail || generateThumbnail(image.source) }}
            quality={adaptiveQuality}
            lazy={lazy}
            resize={{ width: itemWidth * 2, height: itemWidth * 2, mode: 'cover' }}
            style={styles.galleryImage}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center'
  },
  gallery: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 15
  },
  galleryItem: {
    marginBottom: 10,
    borderRadius: 8,
    overflow: 'hidden'
  },
  galleryImage: {
    width: '100%',
    height: '100%'
  }
});

export default {
  OptimizedImage,
  OptimizedImageGallery,
  useImagePreloader,
  useAdaptiveImageQuality,
  generateThumbnail,
  imageCache
};