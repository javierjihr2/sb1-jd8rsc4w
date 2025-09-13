import React from 'react';
import { View } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import CustomHeader from '../../components/CustomHeader';

export default function TabLayout() {
  return (
    <>
      <CustomHeader title="SquadGO" />
      <Tabs
        screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: '#FF6B35',
            tabBarInactiveTintColor: '#64748b',
            tabBarShowLabel: true,
            tabBarStyle: {
              backgroundColor: 'transparent',
              borderTopWidth: 0,
              elevation: 25,
              shadowOpacity: 0.4,
              shadowOffset: { width: 0, height: -8 },
              shadowRadius: 16,
              shadowColor: '#000000',
              height: 100,
              paddingBottom: 20,
              paddingTop: 12,
              paddingHorizontal: 8,
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
            },
            tabBarLabelStyle: {
              fontSize: 14,
              fontWeight: '700',
              marginTop: 6,
              textShadowColor: 'rgba(0, 0, 0, 0.8)',
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 3,
            },
            tabBarBackground: () => (
              <View style={{
                flex: 1,
                backgroundColor: 'transparent',
                borderTopLeftRadius: 25,
                borderTopRightRadius: 25,
                overflow: 'hidden',
                borderWidth: 1,
                borderColor: 'rgba(255, 107, 53, 0.2)',
                borderBottomWidth: 0,
              }}>
                <LinearGradient
                  colors={['#0F0F23', '#1A1A2E', '#2D1B69']}
                  style={{ flex: 1 }}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
                <View style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 3,
                  backgroundColor: 'rgba(255, 107, 53, 0.8)',
                  shadowColor: '#FF6B35',
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 1,
                  shadowRadius: 8,
                }} />
              </View>
            ),
          }}
      >
        {/* Inicio (Feed) */}
        <Tabs.Screen
          name="feed"
          options={{
            title: 'Inicio',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons 
                name={focused ? "home" : "home-outline"} 
                size={32} 
                color={focused ? '#FF6B35' : '#64748b'} 
              />
            ),
          }}
        />
        
        {/* Match */}
        <Tabs.Screen
          name="matchmaking"
          options={{
            title: 'Match',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons 
                name={focused ? "game-controller" : "game-controller-outline"} 
                size={32} 
                color={focused ? '#8B5CF6' : '#64748b'} 
              />
            ),
          }}
        />
        
        {/* Chat */}
        <Tabs.Screen
          name="chat"
          options={{
            title: 'Chat',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons 
                name={focused ? "chatbubbles" : "chatbubbles-outline"} 
                size={32} 
                color={focused ? '#10B981' : '#64748b'} 
              />
            ),
          }}
        />
        

        
        {/* Torneo */}
        <Tabs.Screen
          name="tournaments"
          options={{
            title: 'Torneo',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons 
                name={focused ? "trophy" : "trophy-outline"} 
                size={32} 
                color={focused ? '#FFD700' : '#64748b'} 
              />
            ),
          }}
        />
        
        {/* Tienda */}
        <Tabs.Screen
          name="store"
          options={{
            title: 'Tienda',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons 
                name={focused ? "storefront" : "storefront-outline"} 
                size={32} 
                color={focused ? '#F59E0B' : '#64748b'} 
              />
            ),
          }}
        />
        
        {/* Servicios */}
        <Tabs.Screen
          name="services"
          options={{
            title: 'Servicios',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons 
                name={focused ? "briefcase" : "briefcase-outline"} 
                size={32} 
                color={focused ? '#8B5CF6' : '#64748b'} 
              />
            ),
          }}
        />
        
        {/* Pantallas ocultas - no aparecen en la barra de navegación */}
         <Tabs.Screen
           name="news"
           options={{
             href: null, // Oculta de la barra de navegación
           }}
         />
         <Tabs.Screen
           name="match-connections"
           options={{
             href: null,
           }}
         />
         <Tabs.Screen
           name="profile"
           options={{
             href: null,
           }}
         />
         <Tabs.Screen
           name="friends"
           options={{
             href: null,
           }}
         />
         <Tabs.Screen
           name="sensitivities"
           options={{
             href: null,
           }}
         />
         <Tabs.Screen
           name="maps"
           options={{
             href: null,
           }}
         />
         <Tabs.Screen
           name="tournament-chat"
           options={{
             href: null,
           }}
         />
         <Tabs.Screen
           name="creators"
           options={{
             href: null,
           }}
         />
         <Tabs.Screen
           name="admin"
           options={{
             href: null,
           }}
         />
         <Tabs.Screen
           name="controls-generator"
           options={{
             href: null,
           }}
         />
         <Tabs.Screen
           name="duo-comparison"
           options={{
             href: null,
           }}
         />
         <Tabs.Screen
           name="creator-portal"
           options={{
             href: null,
           }}
         />
         <Tabs.Screen
           name="menu"
           options={{
             href: null,
           }}
         />
         <Tabs.Screen
           name="pubg-strategy"
           options={{
             href: null,
           }}
         />
      </Tabs>
     </>
  );
}