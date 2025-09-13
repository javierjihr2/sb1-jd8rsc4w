import React, { useMemo, useCallback, useState, useRef } from 'react';
import {
  FlatList,
  VirtualizedList as RNVirtualizedList,
  ListRenderItem,
  ListRenderItemInfo,
  ViewToken,
  RefreshControl,
  ActivityIndicator,
  View,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useDebounce, useBatchedUpdates } from '../hooks/usePerformance';

interface VirtualizedListProps<T> {
  data: T[];
  renderItem: ListRenderItem<T>;
  keyExtractor: (item: T, index: number) => string;
  onEndReached?: () => void;
  onEndReachedThreshold?: number;
  refreshing?: boolean;
  onRefresh?: () => void;
  estimatedItemSize?: number;
  windowSize?: number;
  maxToRenderPerBatch?: number;
  updateCellsBatchingPeriod?: number;
  removeClippedSubviews?: boolean;
  getItemLayout?: (data: T[] | null | undefined, index: number) => {
    length: number;
    offset: number;
    index: number;
  };
  ListHeaderComponent?: React.ComponentType<any> | React.ReactElement | null;
  ListFooterComponent?: React.ComponentType<any> | React.ReactElement | null;
  ListEmptyComponent?: React.ComponentType<any> | React.ReactElement | null;
  onViewableItemsChanged?: (info: { viewableItems: ViewToken[]; changed: ViewToken[] }) => void;
  viewabilityConfig?: {
    minimumViewTime?: number;
    viewAreaCoveragePercentThreshold?: number;
    itemVisiblePercentThreshold?: number;
    waitForInteraction?: boolean;
  };
  horizontal?: boolean;
  numColumns?: number;
  contentContainerStyle?: any;
  style?: any;
}

// Componente de loading para el footer
const LoadingFooter = () => (
  <View style={styles.loadingFooter}>
    <ActivityIndicator size="small" color="#666" />
  </View>
);

// Hook para optimizar viewability
function useOptimizedViewability<T>(
  onViewableItemsChanged?: (info: { viewableItems: ViewToken[]; changed: ViewToken[] }) => void,
  delay: number = 500
) {
  const [viewableItems, setViewableItems] = useBatchedUpdates<ViewToken[]>([]);
  const debouncedViewableItems = useDebounce(viewableItems, delay);

  const handleViewableItemsChanged = useCallback(
    (info: { viewableItems: ViewToken[]; changed: ViewToken[] }) => {
      setViewableItems(() => info.viewableItems);
      onViewableItemsChanged?.(info);
    },
    [onViewableItemsChanged, setViewableItems]
  );

  return {
    onViewableItemsChanged: handleViewableItemsChanged,
    viewableItems: debouncedViewableItems,
  };
}

export function VirtualizedList<T>({
  data,
  renderItem,
  keyExtractor,
  onEndReached,
  onEndReachedThreshold = 0.1,
  refreshing = false,
  onRefresh,
  estimatedItemSize = 100,
  windowSize = 10,
  maxToRenderPerBatch = 10,
  updateCellsBatchingPeriod = 50,
  removeClippedSubviews = true,
  getItemLayout,
  ListHeaderComponent,
  ListFooterComponent,
  ListEmptyComponent,
  onViewableItemsChanged,
  viewabilityConfig = {
    minimumViewTime: 500,
    viewAreaCoveragePercentThreshold: 50,
    itemVisiblePercentThreshold: 50,
    waitForInteraction: true,
  },
  horizontal = false,
  numColumns = 1,
  contentContainerStyle,
  style,
}: VirtualizedListProps<T>) {
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const flatListRef = useRef<FlatList<T>>(null);
  
  const { onViewableItemsChanged: optimizedOnViewableItemsChanged } = useOptimizedViewability(
    onViewableItemsChanged
  );

  // Memoizar el renderItem para evitar re-renders innecesarios
  const memoizedRenderItem = useCallback(
    (info: ListRenderItemInfo<T>) => {
      return renderItem(info);
    },
    [renderItem]
  );

  // Optimizar onEndReached para evitar llamadas múltiples
  const optimizedOnEndReached = useCallback(() => {
    if (!isLoadingMore && onEndReached) {
      setIsLoadingMore(true);
      onEndReached();
      // Reset loading state after a delay
      setTimeout(() => setIsLoadingMore(false), 1000);
    }
  }, [isLoadingMore, onEndReached]);

  // Calcular getItemLayout automáticamente si no se proporciona
  const calculatedGetItemLayout = useMemo(() => {
    if (getItemLayout) return getItemLayout;
    
    if (!horizontal && numColumns === 1) {
      return (data: T[] | null | undefined, index: number) => ({
        length: estimatedItemSize,
        offset: estimatedItemSize * index,
        index,
      });
    }
    
    return undefined;
  }, [getItemLayout, horizontal, numColumns, estimatedItemSize]);

  // Componente de footer con loading
  const renderFooter = useCallback(() => {
    if (ListFooterComponent) {
      return typeof ListFooterComponent === 'function' ? 
        <ListFooterComponent /> : ListFooterComponent;
    }
    
    if (isLoadingMore) {
      return <LoadingFooter />;
    }
    
    return null;
  }, [ListFooterComponent, isLoadingMore]);

  // Configuración optimizada para diferentes tipos de listas
  const optimizedProps = useMemo(() => {
    const screenData = Dimensions.get('window');
    const isLargeList = data.length > 100;
    
    return {
      windowSize: isLargeList ? Math.min(windowSize, 5) : windowSize,
      maxToRenderPerBatch: isLargeList ? Math.min(maxToRenderPerBatch, 5) : maxToRenderPerBatch,
      updateCellsBatchingPeriod: isLargeList ? Math.max(updateCellsBatchingPeriod, 100) : updateCellsBatchingPeriod,
      removeClippedSubviews: isLargeList ? true : removeClippedSubviews,
      initialNumToRender: Math.min(10, data.length),
      legacyImplementation: false,
    };
  }, [data.length, windowSize, maxToRenderPerBatch, updateCellsBatchingPeriod, removeClippedSubviews]);

  return (
    <FlatList
      ref={flatListRef}
      data={data}
      renderItem={memoizedRenderItem}
      keyExtractor={keyExtractor}
      onEndReached={optimizedOnEndReached}
      onEndReachedThreshold={onEndReachedThreshold}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#007AFF']}
            tintColor="#007AFF"
          />
        ) : undefined
      }
      getItemLayout={calculatedGetItemLayout}
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={renderFooter}
      ListEmptyComponent={ListEmptyComponent}
      onViewableItemsChanged={optimizedOnViewableItemsChanged}
      viewabilityConfig={viewabilityConfig}
      horizontal={horizontal}
      numColumns={numColumns}
      contentContainerStyle={[
        data.length === 0 && styles.emptyContainer,
        contentContainerStyle,
      ]}
      style={style}
      // Optimizaciones de rendimiento
      {...optimizedProps}
      // Configuraciones adicionales para mejor rendimiento
      disableVirtualization={false}
      progressViewOffset={50}
      scrollEventThrottle={16}
      keyboardShouldPersistTaps="handled"
    />
  );
}

// Hook para scroll automático optimizado
export function useOptimizedScroll<T>(listRef: React.RefObject<FlatList<T>>) {
  const scrollToTop = useCallback(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, [listRef]);

  const scrollToIndex = useCallback((index: number, animated: boolean = true) => {
    listRef.current?.scrollToIndex({ index, animated });
  }, [listRef]);

  const scrollToEnd = useCallback((animated: boolean = true) => {
    listRef.current?.scrollToEnd({ animated });
  }, [listRef]);

  return {
    scrollToTop,
    scrollToIndex,
    scrollToEnd,
  };
}

// Componente de lista con paginación automática
export function PaginatedList<T>({
  data,
  renderItem,
  keyExtractor,
  onLoadMore,
  hasNextPage = true,
  loading = false,
  pageSize = 20,
  ...props
}: VirtualizedListProps<T> & {
  onLoadMore: () => Promise<void>;
  hasNextPage?: boolean;
  loading?: boolean;
  pageSize?: number;
}) {
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const handleEndReached = useCallback(async () => {
    if (!isLoadingMore && !loading && hasNextPage) {
      setIsLoadingMore(true);
      try {
        await onLoadMore();
      } finally {
        setIsLoadingMore(false);
      }
    }
  }, [isLoadingMore, loading, hasNextPage, onLoadMore]);

  return (
    <VirtualizedList
      {...props}
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      onEndReached={handleEndReached}
      ListFooterComponent={
        isLoadingMore || loading ? <LoadingFooter /> : props.ListFooterComponent
      }
    />
  );
}

const styles = StyleSheet.create({
  loadingFooter: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});