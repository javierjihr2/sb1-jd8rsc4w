import React, { Suspense, lazy, ComponentType } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Text } from 'react-native';

interface LazyScreenProps {
  component: () => Promise<{ default: ComponentType<any> }>;
  fallback?: React.ReactNode;
}

// Componente de carga por defecto
const DefaultLoadingComponent = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#007AFF" />
    <Text style={styles.loadingText}>Cargando...</Text>
  </View>
);

// HOC para crear pantallas lazy
export function createLazyScreen(
  importFunction: () => Promise<{ default: ComponentType<any> }>,
  fallback?: React.ReactNode
) {
  const LazyComponent = lazy(importFunction);
  
  return function LazyScreen(props: any) {
    return (
      <Suspense fallback={fallback || <DefaultLoadingComponent />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

// Hook para precargar componentes
export function usePreloadComponent(
  importFunction: () => Promise<{ default: ComponentType<any> }>
) {
  React.useEffect(() => {
    // Precargar el componente en el siguiente tick
    const timer = setTimeout(() => {
      importFunction().catch(console.error);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [importFunction]);
}

// Componente de error boundary para lazy loading
export class LazyErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('LazyScreen Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Error al cargar la pantalla</Text>
          </View>
        )
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  errorText: {
    fontSize: 16,
    color: '#ff4444',
    textAlign: 'center',
  },
});