import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DropdownMenu from './DropdownMenu';
import ProfileDropdownMenu from './ProfileDropdownMenu';
import { useAuth } from '../contexts/AuthContextSimple';
import { useAdmin } from '../hooks/useAdmin';

interface CustomHeaderProps {
  title: string;
  showBackButton?: boolean;
}

export default function CustomHeader({ title, showBackButton = false }: CustomHeaderProps) {
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [isProfileDropdownVisible, setIsProfileDropdownVisible] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const { isAdmin, isSuperAdmin } = useAdmin();

  // Foto de perfil del usuario autenticado
  const userProfileImage = profile?.avatarUrl || 'https://via.placeholder.com/40x40/3b82f6/ffffff?text=U';

  const handleProfilePress = () => {
    setIsProfileDropdownVisible(true);
  };

  const handleBackPress = () => {
    router.back();
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#1f2937" />
      <LinearGradient
        colors={['#1f2937', '#111827']}
        style={[
          styles.header,
          {
            paddingTop: insets.top + 8, // Espacio extra para notch
            height: 60 + insets.top, // Altura dinámica basada en el notch
          }
        ]}
      >
        <View style={styles.headerContent}>
          {/* Lado izquierdo - Menú o botón de regreso */}
          <View style={styles.leftSection}>
            {showBackButton ? (
              <TouchableOpacity
                style={styles.iconButton}
                onPress={handleBackPress}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-back" size={24} color="#f9fafb" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => setIsDropdownVisible(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="menu" size={24} color="#f9fafb" />
              </TouchableOpacity>
            )}
          </View>

          {/* Centro - Logo y Título */}
          <View style={styles.centerSection}>
            <View style={styles.logoContainer}>
              <Image
          source={require('../assets/logo.png')}
          style={styles.logoImage}
        />
              <View style={styles.titleContainer}>
                <Text style={styles.titleSquad}>Squad</Text>
                <Text style={styles.titleGO}>GO</Text>
              </View>
            </View>
          </View>

          {/* Lado derecho - Foto de perfil */}
          <View style={styles.rightSection}>
            <TouchableOpacity
              style={styles.profileButton}
              onPress={handleProfilePress}
              activeOpacity={0.8}
            >
              <Image
                source={{ uri: userProfileImage }}
                style={styles.profileImage}
                defaultSource={require('../assets/icon.png')} // Imagen por defecto
              />
              <View style={styles.onlineIndicator} />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* Menú desplegable principal */}
      <DropdownMenu 
        isVisible={isDropdownVisible}
        onClose={() => setIsDropdownVisible(false)}
      />
      
      {/* Menú desplegable de perfil */}
      <ProfileDropdownMenu 
        isVisible={isProfileDropdownVisible}
        onClose={() => setIsProfileDropdownVisible(false)}
        isAdmin={isAdmin}
        isSuperAdmin={isSuperAdmin}
      />
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
    flex: 1,
  },
  leftSection: {
    width: 50,
    alignItems: 'flex-start',
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  rightSection: {
    width: 50,
    alignItems: 'flex-end',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 48,
    height: 48,
    marginRight: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleSquad: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fbbf24', // Equivalente a text-yellow-400
  },
  titleGO: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff', // Equivalente a text-white
  },
  profileButton: {
    position: 'relative',
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10b981',
    borderWidth: 2,
    borderColor: '#1f2937',
  },
});