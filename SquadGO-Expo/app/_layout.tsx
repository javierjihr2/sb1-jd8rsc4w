import { Stack } from 'expo-router';
import { AuthProvider } from '../contexts/AuthContextSimple';
import { SubscriptionProvider } from '../contexts/SubscriptionContext';
import { CurrencyProvider } from '../contexts/CurrencyContext';
import { PaymentProvider } from '../contexts/PaymentContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { LazyErrorBoundary } from '../components/LazyScreen';
import NotificationBanner from '../components/NotificationBanner';
import { useNotificationContext } from '../contexts/NotificationContext';

// Componente interno para manejar las notificaciones
function AppWithNotifications() {
  const { state, actions } = useNotificationContext();

  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ 
        headerShown: false,
      }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="home" options={{ headerShown: false }} />
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      
      {/* Banner de notificaciones */}
      <NotificationBanner
        visible={state.showBanner}
        notification={state.currentNotification}
        onPress={() => {
          // Aquí puedes manejar la navegación según el tipo de notificación
          if (state.currentNotification?.actionUrl) {
            // Navegar a la URL de acción
            console.log('Navegando a:', state.currentNotification.actionUrl);
          }
        }}
        onDismiss={actions.hideNotificationBanner}
        position="top"
        showActions={true}
      />
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <LazyErrorBoundary>
          <AuthProvider>
            <PaymentProvider>
              <SubscriptionProvider>
                <CurrencyProvider>
                  <NotificationProvider>
                    <AppWithNotifications />
                  </NotificationProvider>
                </CurrencyProvider>
              </SubscriptionProvider>
            </PaymentProvider>
          </AuthProvider>
        </LazyErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}