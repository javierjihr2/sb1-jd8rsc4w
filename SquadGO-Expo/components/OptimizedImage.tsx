import * as React from 'react';
import { useState, useCallback, memo, useMemo } from 'react';
import { Image, ImageProps, View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useLazyImage } from '../hooks/useLazyLoading';

interface OptimizedImageProps extends Omit<ImageProps, 'source'> {
  source: { uri: string } | number;
  placeholder?: React.ReactNode;
  errorComponent?: React.ReactNode;
  lazy?: boolean;
  quality?: 'low' | 'medium' | 'high';
  resize?: { width: number; height: number };
}

// Cache de imágenes en memoria
const imageCache = new Map<string, boolean>();

// Función para optimizar URL de imagen
function optimizeImageUrl(uri: string, quality: string = 'medium', resize?: { width: number; height: number }) {
  if (typeof uri !== 'string' || !uri.startsWith('http')) {
    return uri;
  }

  // Para Firebase Storage, agregar parámetros de optimización
  if (uri.includes('firebasestorage.googleapis.com')) {
    const url = new URL(uri);
    
    // Agregar parámetros de calidad
    switch (quality) {
      case 'low':
        url.searchParams.set('alt', 'media');
        url.searchParams.set('token', 'low-quality');
        break;
      case 'high':
        url.searchParams.set('alt', 'media');
        url.searchParams.set('token', 'high-quality');
        break;
      default:
        url.searchParams.set('alt', 'media');
    }
    
    // Agregar parámetros de redimensionamiento
    if (resize) {
      url.searchParams.set('w', resize.width.toString());
      url.searchParams.set('h', resize.height.toString());
    }
    
    return url.toString();
  }
  
  return uri;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = memo(({
  source,
  placeholder,
  errorComponent,
  lazy = false,
  quality = 'medium',
  resize,
  style,
  ...props
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [inView, setInView] = useState(!lazy);
  
  const imageUri = useMemo(() => {
    return typeof source === 'object' && 'uri' in source 
      ? optimizeImageUrl(source.uri, quality, resize)
      : source;
  }, [source, quality, resize]);

  // Usar lazy loading si está habilitado
  const { ref: lazyRef, imageUri: lazyImageUri, loading: lazyLoading, error: lazyError } = useLazyImage(
    typeof imageUri === 'string' ? imageUri : '',
    typeof placeholder === 'string' ? placeholder : undefined
  );

  const cacheKey = typeof imageUri === 'string' ? imageUri : '';

  const handleLoad = useCallback(() => {
    setLoading(false);
    if (cacheKey) {
      imageCache.set(cacheKey, true);
    }
  }, [cacheKey]);

  const handleError = useCallback(() => {
    setLoading(false);
    setError(true);
  }, []);

  const handleLayout = useCallback(() => {
    if (lazy && !inView) {
      setInView(true);
    }
  }, [lazy, inView]);

  // Si es lazy loading y no está en vista, mostrar placeholder
  if (lazy && !inView) {
    return (
      <View style={[styles.container, style]} onLayout={handleLayout}>
        {placeholder || <View style={styles.placeholder} />}
      </View>
    );
  }

  // Si hay error, mostrar componente de error
  if (error) {
    return (
      <View style={[styles.container, style]}>
        {errorComponent || (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Error al cargar imagen</Text>
          </View>
        )}
      </View>
    );
  }

  if (lazy) {
    return (
      <View ref={lazyRef} style={[styles.container, style]}>
        {lazyLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#666" />
          </View>
        )}
        
        {lazyError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Error al cargar imagen</Text>
          </View>
        )}
        
        {lazyImageUri && (
          <Image
            source={{ uri: lazyImageUri }}
            style={[style]}
            {...props}
          />
        )}
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {loading && (
        <View style={styles.loadingContainer}>
          {placeholder || (
            <View style={styles.defaultPlaceholder}>
              <ActivityIndicator size="small" color="#ccc" />
            </View>
          )}
        </View>
      )}
      <Image
        {...props}
        source={typeof imageUri === 'string' ? { uri: imageUri } : imageUri}
        style={[style, loading && styles.hidden]}
        onLoad={handleLoad}
        onError={handleError}
        // Optimizaciones adicionales
        resizeMode={props.resizeMode || 'cover'}
        progressiveRenderingEnabled={true}
        fadeDuration={200}
      />
    </View>
  );
});

// Hook para precargar imágenes
export function usePreloadImages(imageUris: string[], quality: string = 'medium') {
  React.useEffect(() => {
    const preloadImages = async () => {
      const promises = imageUris.map(uri => {
        const optimizedUri = optimizeImageUrl(uri, quality);
        if (!imageCache.has(optimizedUri)) {
          return Image.prefetch(optimizedUri).catch(console.error);
        }
        return Promise.resolve();
      });
      
      await Promise.all(promises);
    };

    preloadImages();
  }, [imageUris, quality]);
}

// Función para limpiar cache de imágenes
export function clearImageCache() {
  imageCache.clear();
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  defaultPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    flex: 1,
  },
  placeholder: {
    backgroundColor: '#f0f0f0',
    flex: 1,
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    flex: 1,
    padding: 10,
  },
  errorText: {
    color: '#999',
    fontSize: 12,
    textAlign: 'center',
  },
  hidden: {
    opacity: 0,
  },
});