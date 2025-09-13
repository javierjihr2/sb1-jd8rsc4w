import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Animated,
  Dimensions,
  Alert,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContextSimple';

const { width, height } = Dimensions.get('window');

interface ProfileDropdownMenuProps {
  isVisible: boolean;
  onClose: () => void;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

export default function ProfileDropdownMenu({ 
  isVisible, 
  onClose, 
  isAdmin, 
  isSuperAdmin 
}: ProfileDropdownMenuProps) {
  const router = useRouter();
  const { profile, logout } = useAuth();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(-300));

  React.useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -300,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [isVisible]);

  const handleItemPress = (route: string) => {
    onClose();
    router.push(route as any);
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            try {
              onClose();
              await logout();
              router.replace('/(auth)/login');
            } catch (error) {
              console.error('Error al cerrar sesión:', error);
              Alert.alert('Error', 'No se pudo cerrar la sesión');
            }
          },
        },
      ]
    );
  };

  const menuItems = [
    {
      id: 'profile',
      title: 'Perfil',
      icon: 'person-outline',
      route: '/profile',
      color: '#3b82f6',
      show: true
    },
    {
      id: 'settings',
      title: 'Configuración',
      icon: 'settings-outline',
      route: '/settings',
      color: '#8b5cf6',
      show: true
    },
    {
      id: 'admin',
      title: 'Admin',
      icon: 'shield-checkmark-outline',
      route: '/admin',
      color: '#dc2626',
      show: isAdmin || isSuperAdmin
    },
    {
      id: 'creator',
      title: 'Portal Creador',
      icon: 'briefcase-outline',
      route: '/creator-portal',
      color: '#f59e0b',
      show: isAdmin || isSuperAdmin
    }
  ];

  const visibleItems = menuItems.filter(item => item.show);

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View 
        style={[styles.overlay, { opacity: fadeAnim }]}
      >
        <TouchableOpacity 
          style={styles.overlayTouch}
          activeOpacity={1}
          onPress={onClose}
        />
        
        <Animated.View 
          style={[
            styles.menuContainer,
            {
              transform: [{ translateX: slideAnim }]
            }
          ]}
        >
          <LinearGradient
            colors={['#0f172a', '#1e293b', '#334155']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
          >
            {/* Header compacto */}
            <View style={styles.header}>
              <View style={styles.userInfo}>
                <Image
                  source={{ uri: profile?.avatarUrl || 'https://via.placeholder.com/40x40/3b82f6/ffffff?text=U' }}
                  style={styles.userAvatar}
                  defaultSource={require('../assets/icon.png')}
                />
                <View style={styles.userDetails}>
                  <Text style={styles.userName}>{profile?.displayName || 'Usuario'}</Text>
                  <Text style={styles.userEmail}>{profile?.email || ''}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* Menu Items */}
            <View style={styles.menuItems}>
              {visibleItems.map((item, index) => {
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.menuItem}
                    onPress={() => handleItemPress(item.route)}
                    activeOpacity={0.7}
                  >
                    <View 
                      style={[
                        styles.iconContainer,
                        { backgroundColor: `${item.color}15` }
                      ]}
                    >
                      <Ionicons 
                        name={item.icon as any} 
                        size={20} 
                        color={item.color} 
                      />
                    </View>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    <Ionicons name="chevron-forward" size={16} color="#64748b" />
                  </TouchableOpacity>
                );
              })}
              
              {/* Separador */}
              <View style={styles.separator} />
              
              {/* Botón de cerrar sesión */}
              <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
                activeOpacity={0.7}
              >
                <View style={styles.logoutIconContainer}>
                  <Ionicons 
                    name="log-out-outline" 
                    size={20} 
                    color="#ef4444" 
                  />
                </View>
                <Text style={styles.logoutTitle}>Cerrar Sesión</Text>
                <Ionicons name="chevron-forward" size={16} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  overlayTouch: {
    flex: 1,
  },
  menuContainer: {
    width: 280,
    maxHeight: height * 0.6,
    position: 'absolute',
    top: 60,
    right: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 163, 184, 0.2)',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#3b82f6',
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f1f5f9',
    marginBottom: 1,
  },
  userEmail: {
    fontSize: 12,
    color: '#94a3b8',
  },
  closeButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(100, 116, 139, 0.2)',
  },
  menuItems: {
    padding: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginVertical: 2,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },

  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  itemTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#f8fafc',
    flex: 1,
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(148, 163, 184, 0.2)',
    marginVertical: 8,
    marginHorizontal: 4,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  logoutIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logoutTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#ef4444',
    flex: 1,
  },
});