import React, { useState, useCallback, memo } from 'react';
import {
  View,
  Image,
  ActivityIndicator,
  ImageStyle,
  ViewStyle,
  ImageSourcePropType
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface LazyImageProps {
  source: ImageSourcePropType;
  style?: ImageStyle;
  containerStyle?: ViewStyle;
  placeholder?: React.ReactNode;
  fallbackSource?: ImageSourcePropType;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
  onLoad?: () => void;
  onError?: () => void;
}

const LazyImage = memo(function LazyImage({
  source,
  style,
  containerStyle,
  placeholder,
  fallbackSource,
  resizeMode = 'cover',
  onLoad,
  onError
}: LazyImageProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleLoad = useCallback(() => {
    setLoading(false);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setLoading(false);
    setError(true);
    onError?.();
  }, [onError]);

  const defaultPlaceholder = (
    <LinearGradient
      colors={['#374151', '#4b5563']}
      style={[
        {
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          height: '100%'
        },
        style
      ]}
    >
      <ActivityIndicator size="small" color="#9ca3af" />
    </LinearGradient>
  );

  const errorPlaceholder = (
    <LinearGradient
      colors={['#374151', '#4b5563']}
      style={[
        {
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          height: '100%'
        },
        style
      ]}
    >
      <View style={{
        width: 24,
        height: 24,
        backgroundColor: '#6b7280',
        borderRadius: 4
      }} />
    </LinearGradient>
  );

  return (
    <View style={[{ position: 'relative' }, containerStyle]}>
      {loading && (placeholder || defaultPlaceholder)}
      
      {error && fallbackSource ? (
        <Image
          source={fallbackSource}
          style={style}
          resizeMode={resizeMode}
          onLoad={handleLoad}
          onError={() => setError(true)}
        />
      ) : error ? (
        errorPlaceholder
      ) : (
        <Image
          source={source}
          style={[
            style,
            loading && { position: 'absolute', opacity: 0 }
          ]}
          resizeMode={resizeMode}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
    </View>
  );
});

export default LazyImage;

// Hook para precargar imágenes
export const useImagePreloader = () => {
  const preloadImages = useCallback((imageUris: string[]) => {
    return Promise.all(
      imageUris.map(uri => {
        return new Promise<void>((resolve, reject) => {
          Image.prefetch(uri)
            .then(() => resolve())
            .catch(() => reject());
        });
      })
    );
  }, []);

  return { preloadImages };
};

// Componente para lazy loading de listas
export const LazyList = memo(function LazyList<T>({
  data,
  renderItem,
  keyExtractor,
  initialNumToRender = 10,
  windowSize = 10,
  ...props
}: {
  data: T[];
  renderItem: ({ item, index }: { item: T; index: number }) => React.ReactElement;
  keyExtractor: (item: T, index: number) => string;
  initialNumToRender?: number;
  windowSize?: number;
  [key: string]: any;
}) {
  const [visibleItems, setVisibleItems] = useState(initialNumToRender);

  const handleEndReached = useCallback(() => {
    if (visibleItems < data.length) {
      setVisibleItems(prev => Math.min(prev + windowSize, data.length));
    }
  }, [visibleItems, data.length, windowSize]);

  const visibleData = data.slice(0, visibleItems);

  return (
    <View {...props}>
      {visibleData.map((item, index) => (
        <View key={keyExtractor(item, index)}>
          {renderItem({ item, index })}
        </View>
      ))}
      
      {visibleItems < data.length && (
        <View style={{
          padding: 20,
          alignItems: 'center'
        }}>
          <ActivityIndicator size="small" color="#9ca3af" />
        </View>
      )}
    </View>
  );
});