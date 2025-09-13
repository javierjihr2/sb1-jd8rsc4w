import React from 'react';
import { StyleSheet, Alert } from 'react-native';
import { PremiumMarketplace } from '../../components/modern/PremiumMarketplace';

export default function ServicesScreen() {
  const mockCategories = ['Coaching', 'Análisis', 'Boosting', 'Entrenamiento', 'Consultoría'];

  const handleServicePress = (service: any) => {
    console.log('Service pressed:', service);
    // Aquí puedes navegar a la pantalla de detalles del servicio
  };

  const handleProviderPress = (provider: any) => {
    console.log('Provider pressed:', provider);
    // Aquí puedes navegar al perfil del proveedor
  };

  const handleBookService = (serviceId: string, packageId: string) => {
    Alert.alert(
      'Reservar Servicio',
      `¿Deseas reservar este servicio?\nServicio ID: ${serviceId}\nPaquete ID: ${packageId}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Confirmar', 
          onPress: () => {
            console.log('Service booked:', { serviceId, packageId });
            Alert.alert('¡Éxito!', 'Servicio reservado correctamente');
          }
        }
      ]
    );
  };

  const handleContactProvider = (providerId: string) => {
    Alert.alert(
      'Contactar Proveedor',
      `¿Deseas contactar a este proveedor?\nProveedor ID: ${providerId}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Contactar', 
          onPress: () => {
            console.log('Contacting provider:', providerId);
            Alert.alert('¡Éxito!', 'Mensaje enviado al proveedor');
          }
        }
      ]
    );
  };

  const handleFavorite = (serviceId: string) => {
    console.log('Service favorited:', serviceId);
    Alert.alert('¡Favorito!', 'Servicio agregado a favoritos');
  };

  return (
    <PremiumMarketplace
      categories={mockCategories}
      services={[
        {
          id: '1',
          title: 'Coaching Personalizado 1v1',
          description: 'Sesión de coaching personalizada para mejorar tu gameplay, estrategias y toma de decisiones en el Battle Royale.',
          provider: {
            id: 'p1',
            name: 'ProGamer_YT',
            username: 'progamer_yt',
            avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
            rating: 4.9,
            reviewsCount: 127,
            isVerified: true,
            responseTime: '< 2 horas',
            completedOrders: 89,
            badges: ['Pro Player', 'Top Coach']
          },
          category: 'Coaching',
          subcategory: 'Personal Training',
          packages: [
            {
              id: 'basic-1',
              name: 'Sesión Básica',
              description: 'Coaching básico de 1 hora',
              price: 25,
              deliveryTime: '1 día',
              features: ['1 hora de coaching', 'Análisis básico', 'Consejos personalizados']
            },
            {
              id: 'premium-1',
              name: 'Sesión Premium',
              description: 'Coaching premium de 2 horas con análisis detallado',
              price: 45,
              deliveryTime: '1 día',
              features: ['2 horas de coaching', 'Análisis detallado', 'Plan de mejora', 'Seguimiento'],
              isPopular: true
            }
          ],
          gallery: [],
          startingPrice: 25,
          currency: 'USD',
          createdAt: Date.now(),
          totalOrders: 89,
          averageRating: 4.9,
          reviewsCount: 89,
          tags: ['PUBG Mobile', 'Coaching', '1v1', 'Personalizado']
        },
        {
          id: '2',
          title: 'Análisis Profesional de Partidas',
          description: 'Análisis detallado de tus partidas con feedback específico para mejorar tu rendimiento competitivo.',
          provider: {
            id: 'p2',
            name: 'AnalystPro',
            username: 'analyst_pro',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
            rating: 4.8,
            reviewsCount: 89,
            isVerified: true,
            responseTime: '< 4 horas',
            completedOrders: 156,
            badges: ['Expert Analyst', 'Top Rated']
          },
          category: 'Análisis',
          subcategory: 'Game Analysis',
          packages: [
            {
              id: 'analysis-basic',
              name: 'Análisis Básico',
              description: 'Análisis de 3 partidas',
              price: 20,
              deliveryTime: '2 días',
              features: ['Análisis de 3 partidas', 'Reporte escrito', 'Consejos generales']
            },
            {
              id: 'analysis-pro',
              name: 'Análisis Profesional',
              description: 'Análisis completo con video explicativo',
              price: 40,
              deliveryTime: '3 días',
              features: ['Análisis de 5 partidas', 'Video explicativo', 'Plan de mejora detallado', 'Sesión de seguimiento'],
              isPopular: true
            }
          ],
          gallery: [],
          startingPrice: 20,
          currency: 'USD',
          createdAt: Date.now(),
          totalOrders: 156,
          averageRating: 4.8,
          reviewsCount: 156,
          tags: ['Análisis', 'Profesional', 'Competitivo']
        }
      ]}
      currentUserId="current-user-id"
      onServicePress={handleServicePress}
      onProviderPress={handleProviderPress}
      onBookService={handleBookService}
      onContactProvider={handleContactProvider}
      onFavorite={handleFavorite}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
});