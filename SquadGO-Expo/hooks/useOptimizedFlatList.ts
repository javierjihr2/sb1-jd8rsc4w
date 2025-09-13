import React, { useMemo, useCallback, useRef } from 'react';
import { FlatList, ListRenderItem, ViewToken } from 'react-native';
import { InteractionManager } from 'react-native';

interface OptimizedFlatListConfig<T> {
  data: T[];
  itemHeight?: number;
  estimatedItemSize?: number;
  keyExtractor?: (item: T, index: number) => string;
  renderItem: ListRenderItem<T>;
  onEndReached?: () => void;
  onEndReachedThreshold?: number;
  numColumns?: number;
  horizontal?: boolean;
  windowSize?: number;
  maxToRenderPerBatch?: number;
  updateCellsBatchingPeriod?: number;
  initialNumToRender?: number;
  removeClippedSubviews?: boolean;
  getItemLayout?: (data: T[] | null | undefined, index: number) => { length: number; offset: number; index: number };
}

// Hook para optimizar FlatList con configuraciones de rendimiento
export const useOptimizedFlatList = <T>(config: OptimizedFlatListConfig<T>) => {
  const {
    data,
    itemHeight = 100,
    estimatedItemSize,
    keyExtractor,
    renderItem,
    onEndReached,
    onEndReachedThreshold = 0.1,
    numColumns = 1,
    horizontal = false,
    windowSize = 10,
    maxToRenderPerBatch = 10,
    updateCellsBatchingPeriod = 50,
    initialNumToRender = 10,
    removeClippedSubviews = true,
    getItemLayout: customGetItemLayout
  } = config;

  const flatListRef = useRef<FlatList<T>>(null);

  // Optimized getItemLayout para elementos de altura fija
  const getItemLayout = useMemo(() => {
    if (customGetItemLayout) {
      return customGetItemLayout;
    }

    if (itemHeight && !horizontal) {
      return (data: T[] | null | undefined, index: number) => ({
        length: itemHeight,
        offset: itemHeight * index,
        index,
      });
    }

    if (itemHeight && horizontal) {
      return (data: T[] | null | undefined, index: number) => ({
        length: itemHeight,
        offset: itemHeight * index,
        index,
      });
    }

    return undefined;
  }, [itemHeight, horizontal, customGetItemLayout]);

  // Optimized keyExtractor
  const optimizedKeyExtractor = useCallback(
    (item: T, index: number) => {
      if (keyExtractor) {
        return keyExtractor(item, index);
      }
      
      // Fallback para objetos con id
      if (typeof item === 'object' && item !== null && 'id' in item) {
        return String((item as any).id);
      }
      
      return String(index);
    },
    [keyExtractor]
  );

  // Optimized renderItem con memoización
  const optimizedRenderItem = useCallback(
    (info: { item: T; index: number; separators: any }) => {
      return renderItem(info);
    },
    [renderItem]
  );

  // Optimized onEndReached con debounce
  const optimizedOnEndReached = useCallback(() => {
    if (onEndReached) {
      InteractionManager.runAfterInteractions(() => {
        onEndReached();
      });
    }
  }, [onEndReached]);

  // Configuración optimizada para FlatList
  const flatListProps = useMemo(() => ({
    ref: flatListRef,
    data,
    renderItem: optimizedRenderItem,
    keyExtractor: optimizedKeyExtractor,
    getItemLayout,
    onEndReached: optimizedOnEndReached,
    onEndReachedThreshold,
    numColumns,
    horizontal,
    
    // Optimizaciones de rendimiento
    removeClippedSubviews,
    windowSize,
    maxToRenderPerBatch,
    updateCellsBatchingPeriod,
    initialNumToRender,
    
    // Optimizaciones adicionales
    disableVirtualization: false,
    legacyImplementation: false,
    
    // Para listas grandes
    ...(data.length > 100 && {
      removeClippedSubviews: true,
      maxToRenderPerBatch: 5,
      windowSize: 5,
      initialNumToRender: 5,
      updateCellsBatchingPeriod: 100,
    }),
    
    // Para listas muy grandes
    ...(data.length > 1000 && {
      removeClippedSubviews: true,
      maxToRenderPerBatch: 3,
      windowSize: 3,
      initialNumToRender: 3,
      updateCellsBatchingPeriod: 200,
    }),
  }), [
    data,
    optimizedRenderItem,
    optimizedKeyExtractor,
    getItemLayout,
    optimizedOnEndReached,
    onEndReachedThreshold,
    numColumns,
    horizontal,
    removeClippedSubviews,
    windowSize,
    maxToRenderPerBatch,
    updateCellsBatchingPeriod,
    initialNumToRender,
  ]);

  // Métodos de utilidad
  const scrollToIndex = useCallback((index: number, animated = true) => {
    flatListRef.current?.scrollToIndex({ index, animated });
  }, []);

  const scrollToTop = useCallback((animated = true) => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated });
  }, []);

  const scrollToEnd = useCallback((animated = true) => {
    flatListRef.current?.scrollToEnd({ animated });
  }, []);

  return {
    flatListProps,
    flatListRef,
    scrollToIndex,
    scrollToTop,
    scrollToEnd,
  };
};

// Hook para FlatList con paginación optimizada
export const useOptimizedPaginatedFlatList = <T>({
  fetchData,
  itemHeight = 100,
  pageSize = 20,
  ...config
}: OptimizedFlatListConfig<T> & {
  fetchData: (page: number, pageSize: number) => Promise<T[]>;
  pageSize?: number;
}) => {
  const [data, setData] = React.useState<T[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);
  const [hasMore, setHasMore] = React.useState(true);
  const currentPage = useRef(0);

  const loadData = useCallback(async (page: number, reset = false) => {
    if (loading) return;
    
    setLoading(true);
    
    try {
      const newData = await fetchData(page, pageSize);
      
      if (reset) {
        setData(newData);
      } else {
        setData(prev => [...prev, ...newData]);
      }
      
      setHasMore(newData.length === pageSize);
      currentPage.current = page;
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchData, pageSize, loading]);

  const loadMore = useCallback(() => {
    if (hasMore && !loading) {
      loadData(currentPage.current + 1);
    }
  }, [hasMore, loading, loadData]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    currentPage.current = 0;
    await loadData(0, true);
    setRefreshing(false);
  }, [loadData]);

  // Cargar datos iniciales
  React.useEffect(() => {
    loadData(0, true);
  }, []);

  const optimizedFlatList = useOptimizedFlatList({
    ...config,
    data,
    itemHeight,
    onEndReached: loadMore,
  });

  return {
    ...optimizedFlatList,
    data,
    loading,
    refreshing,
    hasMore,
    refresh,
    loadMore,
    flatListProps: {
      ...optimizedFlatList.flatListProps,
      refreshing,
      onRefresh: refresh,
    },
  };
};

// Hook para FlatList con búsqueda optimizada
export const useOptimizedSearchFlatList = <T>({
  searchFunction,
  debounceMs = 300,
  ...config
}: OptimizedFlatListConfig<T> & {
  searchFunction: (query: string) => Promise<T[]> | T[];
  debounceMs?: number;
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [searchResults, setSearchResults] = React.useState<T[]>([]);
  const [searching, setSearching] = React.useState(false);
  const searchTimeout = useRef<NodeJS.Timeout>();

  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    
    try {
      const results = await searchFunction(query);
      setSearchResults(Array.isArray(results) ? results : []);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, [searchFunction]);

  const debouncedSearch = useCallback((query: string) => {
    setSearchQuery(query);
    
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    
    searchTimeout.current = setTimeout(() => {
      performSearch(query);
    }, debounceMs);
  }, [performSearch, debounceMs]);

  const optimizedFlatList = useOptimizedFlatList({
    ...config,
    data: searchResults,
  });

  return {
    ...optimizedFlatList,
    searchQuery,
    searchResults,
    searching,
    setSearchQuery: debouncedSearch,
    clearSearch: () => {
      setSearchQuery('');
      setSearchResults([]);
    },
  };
};

// Configuraciones predefinidas para diferentes tipos de listas
export const FlatListConfigs = {
  // Para feeds de posts
  feed: {
    itemHeight: 200,
    windowSize: 8,
    maxToRenderPerBatch: 8,
    initialNumToRender: 5,
    updateCellsBatchingPeriod: 50,
    removeClippedSubviews: true,
  },
  
  // Para listas de chat
  chat: {
    itemHeight: 80,
    windowSize: 15,
    maxToRenderPerBatch: 15,
    initialNumToRender: 10,
    updateCellsBatchingPeriod: 30,
    removeClippedSubviews: true,
  },
  
  // Para grids de imágenes
  imageGrid: {
    itemHeight: 150,
    numColumns: 2,
    windowSize: 6,
    maxToRenderPerBatch: 6,
    initialNumToRender: 4,
    updateCellsBatchingPeriod: 100,
    removeClippedSubviews: true,
  },
  
  // Para listas de usuarios
  userList: {
    itemHeight: 60,
    windowSize: 20,
    maxToRenderPerBatch: 20,
    initialNumToRender: 15,
    updateCellsBatchingPeriod: 30,
    removeClippedSubviews: true,
  },
  
  // Para listas de notificaciones
  notifications: {
    itemHeight: 70,
    windowSize: 12,
    maxToRenderPerBatch: 12,
    initialNumToRender: 8,
    updateCellsBatchingPeriod: 50,
    removeClippedSubviews: true,
  },
};