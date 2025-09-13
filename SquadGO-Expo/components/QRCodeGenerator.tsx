import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Dimensions,
  Alert,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

interface AppRoute {
  name: string;
  path: string;
  description: string;
  category: string;
}

const APP_ROUTES: AppRoute[] = [
  // Páginas principales
  { name: 'Inicio', path: '/home', description: 'Página principal de la aplicación', category: 'Principal' },
  { name: 'Índice', path: '/index', description: 'Pantalla de carga inicial', category: 'Principal' },
  
  // Autenticación
  { name: 'Autenticación', path: '/auth', description: 'Portal de autenticación', category: 'Auth' },
  { name: 'Login', path: '/(auth)/login', description: 'Iniciar sesión', category: 'Auth' },
  { name: 'Registro', path: '/(auth)/register', description: 'Crear cuenta nueva', category: 'Auth' },
  
  // Tabs principales
  { name: 'Feed', path: '/(tabs)/feed', description: 'Feed de publicaciones', category: 'Social' },
  { name: 'Chat', path: '/(tabs)/chat', description: 'Sistema de mensajería', category: 'Social' },
  { name: 'Perfil', path: '/(tabs)/profile', description: 'Perfil de usuario', category: 'Usuario' },
  { name: 'Amigos', path: '/(tabs)/friends', description: 'Lista de amigos', category: 'Social' },
  { name: 'Mapas', path: '/(tabs)/maps', description: 'Exploración geográfica', category: 'Exploración' },
  { name: 'Noticias', path: '/(tabs)/news', description: 'Últimas noticias gaming', category: 'Contenido' },
  { name: 'Configuración', path: '/(tabs)/settings', description: 'Configuración general', category: 'Usuario' },
  
  // Gaming
  { name: 'Matchmaking', path: '/(tabs)/matchmaking', description: 'Búsqueda de partidas', category: 'Gaming' },
  { name: 'Torneos', path: '/(tabs)/tournaments', description: 'Torneos disponibles', category: 'Gaming' },
  { name: 'Chat Torneo', path: '/(tabs)/tournament-chat', description: 'Chat de torneos', category: 'Gaming' },
  { name: 'Sensibilidades', path: '/(tabs)/sensitivities', description: 'Configuración de juego', category: 'Gaming' },
  { name: 'Comparación Dúo', path: '/(tabs)/duo-comparison', description: 'Comparar estadísticas', category: 'Gaming' },
  { name: 'Conexiones Match', path: '/(tabs)/match-connections', description: 'Conexiones de partida', category: 'Gaming' },
  
  // Creadores
  { name: 'Creadores', path: '/(tabs)/creators', description: 'Portal de creadores', category: 'Creadores' },
  { name: 'Portal Creador', path: '/(tabs)/creator-portal', description: 'Panel de creador', category: 'Creadores' },
  { name: 'Funciones Creador', path: '/creator-features', description: 'Herramientas de creador', category: 'Creadores' },
  { name: 'Generador Controles', path: '/(tabs)/controls-generator', description: 'Generador de controles', category: 'Creadores' },
  
  // Administración
  { name: 'Admin', path: '/(tabs)/admin', description: 'Panel administrativo', category: 'Admin' },
  { name: 'Servicios', path: '/(tabs)/services', description: 'Servicios disponibles', category: 'Admin' },
  { name: 'Menú', path: '/(tabs)/menu', description: 'Menú principal', category: 'Admin' },
  
  // Tienda
  { name: 'Tienda', path: '/(tabs)/store', description: 'Tienda virtual', category: 'Comercio' },
  { name: 'Suscripciones', path: '/subscriptions', description: 'Planes premium', category: 'Comercio' },
  
  // Configuraciones específicas
  { name: 'Config. Cuenta', path: '/settings/account', description: 'Configuración de cuenta', category: 'Configuración' },
  { name: 'Config. Gaming', path: '/settings/gaming', description: 'Configuración de juegos', category: 'Configuración' },
  { name: 'Config. Notificaciones', path: '/settings/notifications', description: 'Configuración de notificaciones', category: 'Configuración' },
  { name: 'Config. Privacidad', path: '/settings/privacy', description: 'Configuración de privacidad', category: 'Configuración' },
  { name: 'Config. Seguridad', path: '/settings/security', description: 'Configuración de seguridad', category: 'Configuración' },
  { name: 'Config. Perfil', path: '/settings/profile', description: 'Editar perfil', category: 'Configuración' },
  { name: 'Usuarios Bloqueados', path: '/settings/blocked-users', description: 'Gestión de usuarios bloqueados', category: 'Configuración' },
];

const QRCodeGenerator: React.FC = () => {
  const [selectedRoute, setSelectedRoute] = useState<AppRoute | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showAllRoutes, setShowAllRoutes] = useState(false);

  const generateQRData = (route?: AppRoute) => {
    const baseUrl = 'http://localhost:8081';
    if (route) {
      return `${baseUrl}${route.path}`;
    }
    // Generar QR con todas las rutas para revisión completa
    const allRoutes = APP_ROUTES.map(r => `${baseUrl}${r.path}`).join('\n');
    return `SQUADGO - Revisión Completa\n\nRutas de la aplicación:\n${allRoutes}\n\nTotal: ${APP_ROUTES.length} páginas`;
  };

  const showQR = (route?: AppRoute) => {
    setSelectedRoute(route || null);
    setShowModal(true);
  };

  const groupedRoutes = APP_ROUTES.reduce((acc, route) => {
    if (!acc[route.category]) {
      acc[route.category] = [];
    }
    acc[route.category].push(route);
    return acc;
  }, {} as Record<string, AppRoute[]>);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>🔍 Generador QR - Revisión App</Text>
        <Text style={styles.headerSubtitle}>Verifica todas las páginas de SquadGO</Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* QR para revisión completa */}
        <View style={styles.mainQRSection}>
          <TouchableOpacity
            style={styles.mainQRButton}
            onPress={() => showQR()}
          >
            <LinearGradient
              colors={['#43e97b', '#38f9d7']}
              style={styles.mainQRGradient}
            >
              <Ionicons name="qr-code" size={40} color="white" />
              <Text style={styles.mainQRTitle}>QR Revisión Completa</Text>
              <Text style={styles.mainQRSubtitle}>
                {APP_ROUTES.length} páginas para revisar
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Toggle para mostrar todas las rutas */}
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => setShowAllRoutes(!showAllRoutes)}
        >
          <Text style={styles.toggleText}>
            {showAllRoutes ? 'Ocultar' : 'Mostrar'} rutas individuales
          </Text>
          <Ionicons 
            name={showAllRoutes ? 'chevron-up' : 'chevron-down'} 
            size={20} 
            color="#667eea" 
          />
        </TouchableOpacity>

        {/* Rutas agrupadas por categoría */}
        {showAllRoutes && Object.entries(groupedRoutes).map(([category, routes]) => (
          <View key={category} style={styles.categorySection}>
            <Text style={styles.categoryTitle}>{category}</Text>
            {routes.map((route, index) => (
              <TouchableOpacity
                key={index}
                style={styles.routeItem}
                onPress={() => showQR(route)}
              >
                <View style={styles.routeInfo}>
                  <Text style={styles.routeName}>{route.name}</Text>
                  <Text style={styles.routePath}>{route.path}</Text>
                  <Text style={styles.routeDescription}>{route.description}</Text>
                </View>
                <Ionicons name="qr-code-outline" size={24} color="#667eea" />
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </ScrollView>

      {/* Modal QR */}
      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedRoute ? selectedRoute.name : 'Revisión Completa'}
              </Text>
              <TouchableOpacity
                onPress={() => setShowModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.qrContainer}>
              <QRCode
                value={generateQRData(selectedRoute || undefined)}
                size={250}
                backgroundColor="white"
                color="black"
              />
            </View>
            
            <Text style={styles.qrInfo}>
              {selectedRoute 
                ? `Escanea para ir a: ${selectedRoute.path}`
                : `Escanea para ver todas las ${APP_ROUTES.length} rutas de la app`
              }
            </Text>
            
            <TouchableOpacity
              style={styles.copyButton}
              onPress={() => {
                Alert.alert(
                  'URL Copiada',
                  generateQRData(selectedRoute || undefined),
                  [{ text: 'OK' }]
                );
              }}
            >
              <Text style={styles.copyButtonText}>Ver URL</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    paddingTop: 40,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  mainQRSection: {
    marginBottom: 20,
  },
  mainQRButton: {
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  mainQRGradient: {
    padding: 30,
    alignItems: 'center',
  },
  mainQRTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 10,
  },
  mainQRSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 5,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 20,
    elevation: 2,
  },
  toggleText: {
    fontSize: 16,
    color: '#667eea',
    fontWeight: '600',
    marginRight: 10,
  },
  categorySection: {
    marginBottom: 20,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    paddingLeft: 10,
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 8,
    borderRadius: 10,
    elevation: 2,
  },
  routeInfo: {
    flex: 1,
  },
  routeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  routePath: {
    fontSize: 14,
    color: '#667eea',
    marginTop: 2,
  },
  routeDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: width * 0.9,
    maxHeight: height * 0.8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  closeButton: {
    padding: 5,
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 20,
    padding: 20,
    backgroundColor: '#f9f9f9',
    borderRadius: 15,
  },
  qrInfo: {
    textAlign: 'center',
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  copyButton: {
    backgroundColor: '#667eea',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  copyButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default QRCodeGenerator;