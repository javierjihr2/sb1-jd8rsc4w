import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Alert,
} from 'react-native';
import {
  useInteractionManager,
  useHeavyOperation,
  useBatchOperations,
  useOptimizedNetworkOperation,
  InteractionUtils,
} from '../hooks/useInteractionManager';

interface DataItem {
  id: string;
  title: string;
  processed: boolean;
}

interface InteractionOptimizedComponentProps {
  onComplete?: () => void;
}

const InteractionOptimizedComponent: React.FC<InteractionOptimizedComponentProps> = ({
  onComplete,
}) => {
  const [data, setData] = useState<DataItem[]>([]);
  const [processedCount, setProcessedCount] = useState(0);
  const { runAfterInteractions } = useInteractionManager();
  const { addOperation, processing, pendingOperations } = useBatchOperations();
  const heavyOperation = useHeavyOperation<string>();
  const networkOperation = useOptimizedNetworkOperation<DataItem[]>();

  // Simular carga inicial de datos
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        await networkOperation.execute(
          async (signal) => {
            // Simular llamada de red
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            if (signal.aborted) {
              throw new Error('Operation cancelled');
            }
            
            const mockData: DataItem[] = Array.from({ length: 100 }, (_, i) => ({
              id: `item-${i}`,
              title: `Item ${i + 1}`,
              processed: false,
            }));
            
            return mockData;
          },
          {
            timeout: 5000,
            retries: 2,
            retryDelay: 1000,
          }
        );
      } catch (error) {
        Alert.alert('Error', 'Failed to load data');
      }
    };

    loadInitialData();
  }, []);

  // Actualizar data cuando la operación de red se complete
  useEffect(() => {
    if (networkOperation.data) {
      setData(networkOperation.data);
    }
  }, [networkOperation.data]);

  // Operación pesada individual
  const handleHeavyOperation = useCallback(async () => {
    try {
      const result = await heavyOperation.execute(
        async () => {
          // Simular operación pesada (cálculos complejos)
          let sum = 0;
          for (let i = 0; i < 1000000; i++) {
            sum += Math.random() * Math.sin(i) * Math.cos(i);
          }
          return `Calculation result: ${sum.toFixed(2)}`;
        },
        {
          timeout: 3000,
          onStart: () => console.log('Heavy operation started'),
          onComplete: (result) => {
            console.log('Heavy operation completed:', result);
            Alert.alert('Success', result);
          },
          onError: (error) => {
            console.error('Heavy operation failed:', error);
            Alert.alert('Error', error.message);
          },
        }
      );
    } catch (error) {
      // Error ya manejado en onError
    }
  }, [heavyOperation]);

  // Procesar items en batch
  const handleBatchProcessing = useCallback(() => {
    data.forEach((item, index) => {
      if (!item.processed) {
        addOperation(() => {
          // Simular procesamiento del item
          setTimeout(() => {
            setData(prevData => 
              prevData.map(dataItem => 
                dataItem.id === item.id 
                  ? { ...dataItem, processed: true }
                  : dataItem
              )
            );
            setProcessedCount(prev => prev + 1);
          }, Math.random() * 100); // Simular tiempo variable de procesamiento
        });
      }
    });
  }, [data, addOperation]);

  // Procesar items usando InteractionUtils
  const handleChunkProcessing = useCallback(async () => {
    const unprocessedItems = data.filter(item => !item.processed);
    
    try {
      await runAfterInteractions(async () => {
        await InteractionUtils.processInChunks(
          unprocessedItems,
          async (item) => {
            // Simular procesamiento
            await new Promise(resolve => setTimeout(resolve, 10));
            
            setData(prevData => 
              prevData.map(dataItem => 
                dataItem.id === item.id 
                  ? { ...dataItem, processed: true }
                  : dataItem
              )
            );
            setProcessedCount(prev => prev + 1);
          },
          5, // chunk size
          10 // delay between chunks
        );
      });
      
      Alert.alert('Success', 'All items processed!');
      onComplete?.();
    } catch (error) {
      Alert.alert('Error', 'Processing failed');
    }
  }, [data, runAfterInteractions, onComplete]);

  // Reset data
  const handleReset = useCallback(() => {
    setData(prevData => 
      prevData.map(item => ({ ...item, processed: false }))
    );
    setProcessedCount(0);
    heavyOperation.reset();
    networkOperation.reset();
  }, [heavyOperation, networkOperation]);

  // Refresh data
  const handleRefresh = useCallback(() => {
    networkOperation.execute(
      async (signal) => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (signal.aborted) {
          throw new Error('Operation cancelled');
        }
        
        const mockData: DataItem[] = Array.from({ length: 100 }, (_, i) => ({
          id: `item-${i}`,
          title: `Refreshed Item ${i + 1}`,
          processed: false,
        }));
        
        return mockData;
      },
      { timeout: 5000 }
    );
    setProcessedCount(0);
  }, [networkOperation]);

  const renderItem = useCallback(({ item }: { item: DataItem }) => (
    <View style={[styles.item, item.processed && styles.processedItem]}>
      <Text style={styles.itemTitle}>{item.title}</Text>
      <Text style={styles.itemStatus}>
        {item.processed ? '✅ Processed' : '⏳ Pending'}
      </Text>
    </View>
  ), []);

  const keyExtractor = useCallback((item: DataItem) => item.id, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>InteractionManager Demo</Text>
        <Text style={styles.subtitle}>
          Processed: {processedCount} / {data.length}
        </Text>
        {processing && (
          <Text style={styles.batchInfo}>
            Batch processing... ({pendingOperations} pending)
          </Text>
        )}
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={handleHeavyOperation}
          disabled={heavyOperation.loading}
        >
          {heavyOperation.loading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={styles.buttonText}>Heavy Operation</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={handleBatchProcessing}
          disabled={processing || data.length === 0}
        >
          <Text style={styles.buttonText}>Batch Process</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.tertiaryButton]}
          onPress={handleChunkProcessing}
          disabled={data.length === 0}
        >
          <Text style={styles.buttonText}>Chunk Process</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.button, styles.refreshButton]}
          onPress={handleRefresh}
          disabled={networkOperation.loading}
        >
          {networkOperation.loading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={styles.buttonText}>Refresh Data</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.resetButton]}
          onPress={handleReset}
        >
          <Text style={styles.buttonText}>Reset</Text>
        </TouchableOpacity>
      </View>

      {networkOperation.loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading data...</Text>
        </View>
      ) : (
        <FlatList
          data={data}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          style={styles.list}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
          getItemLayout={(_, index) => ({
            length: 60,
            offset: 60 * index,
            index,
          })}
        />
      )}

      {networkOperation.error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            Network Error: {networkOperation.error.message}
          </Text>
        </View>
      )}

      {heavyOperation.error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            Operation Error: {heavyOperation.error.message}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  header: {
    marginBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  batchInfo: {
    fontSize: 14,
    color: '#007AFF',
    fontStyle: 'italic',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
    marginVertical: 4,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: '#34C759',
  },
  tertiaryButton: {
    backgroundColor: '#FF9500',
  },
  refreshButton: {
    backgroundColor: '#5856D6',
  },
  resetButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  list: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 8,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    height: 60,
  },
  processedItem: {
    backgroundColor: '#f0f9ff',
  },
  itemTitle: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  itemStatus: {
    fontSize: 14,
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default InteractionOptimizedComponent;