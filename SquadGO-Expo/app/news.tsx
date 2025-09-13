import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  StatusBar
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  imageUrl: string;
  category: string;
  publishedAt: Date;
  readTime: string;
  author: string;
}

const mockNews: NewsArticle[] = [
  {
    id: '1',
    title: 'PUBG Mobile: Nueva temporada C3S10 disponible',
    summary: 'La nueva temporada trae mapas renovados, armas exclusivas y modos de juego innovadores que cambiarán tu experiencia de batalla.',
    imageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800',
    category: 'Actualizaciones',
    publishedAt: new Date('2024-01-15'),
    readTime: '3 min',
    author: 'PUBG Mobile Team'
  },
  {
    id: '2',
    title: 'Torneo Mundial PMGC 2024: Equipos confirmados',
    summary: 'Los mejores equipos del mundo se preparan para la competencia más importante del año con un premio de $3 millones.',
    imageUrl: 'https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=800',
    category: 'Esports',
    publishedAt: new Date('2024-01-14'),
    readTime: '5 min',
    author: 'Esports News'
  },
  {
    id: '3',
    title: 'Nuevas skins exclusivas en el Royale Pass',
    summary: 'Descubre las increíbles recompensas del nuevo Royale Pass, incluyendo skins de armas legendarias y trajes únicos.',
    imageUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800',
    category: 'Contenido',
    publishedAt: new Date('2024-01-13'),
    readTime: '2 min',
    author: 'Game Content'
  },
  {
    id: '4',
    title: 'Consejos pro para mejorar tu K/D ratio',
    summary: 'Estrategias avanzadas utilizadas por jugadores profesionales para dominar en cada partida y subir de rango rápidamente.',
    imageUrl: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=800',
    category: 'Guías',
    publishedAt: new Date('2024-01-12'),
    readTime: '7 min',
    author: 'Pro Gaming'
  },
  {
    id: '5',
    title: 'Evento especial: Colaboración con Godzilla',
    summary: 'Un evento épico que trae a Godzilla al mundo de PUBG Mobile con modos de juego únicos y recompensas exclusivas.',
    imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800',
    category: 'Eventos',
    publishedAt: new Date('2024-01-11'),
    readTime: '4 min',
    author: 'Event Team'
  },
  {
    id: '6',
    title: 'Análisis del meta actual: Mejores armas',
    summary: 'Un análisis profundo de las armas más efectivas en la temporada actual y cómo utilizarlas estratégicamente.',
    imageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800',
    category: 'Análisis',
    publishedAt: new Date('2024-01-10'),
    readTime: '6 min',
    author: 'Game Analysis'
  }
];

const categories = ['Todas', 'Actualizaciones', 'Esports', 'Contenido', 'Guías', 'Eventos', 'Análisis'];

export default function NewsScreen() {
  const [news, setNews] = useState<NewsArticle[]>(mockNews);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Todas');

  const filteredNews = selectedCategory === 'Todas' 
    ? news 
    : news.filter(article => article.category === selectedCategory);

  const onRefresh = () => {
    setRefreshing(true);
    // Simular carga de datos
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Hace 1 día';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  const renderNewsCard = (article: NewsArticle) => (
    <TouchableOpacity
      key={article.id}
      style={{
        backgroundColor: '#1f2937',
        borderRadius: 16,
        marginHorizontal: 16,
        marginBottom: 16,
        overflow: 'hidden',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      }}
      onPress={() => {
        // Navegar al detalle de la noticia
        console.log('Abrir noticia:', article.title);
      }}
    >
      <Image
        source={{ uri: article.imageUrl }}
        style={{
          width: '100%',
          height: 200,
          resizeMode: 'cover'
        }}
      />
      
      <View style={{ padding: 16 }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 8
        }}>
          <View style={{
            backgroundColor: '#3b82f6',
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 12,
            marginRight: 8
          }}>
            <Text style={{
              color: 'white',
              fontSize: 12,
              fontWeight: '600'
            }}>
              {article.category}
            </Text>
          </View>
          
          <Text style={{
            color: '#9ca3af',
            fontSize: 12
          }}>
            {formatDate(article.publishedAt)}
          </Text>
          
          <Text style={{
            color: '#9ca3af',
            fontSize: 12,
            marginLeft: 8
          }}>
            • {article.readTime}
          </Text>
        </View>
        
        <Text style={{
          color: 'white',
          fontSize: 18,
          fontWeight: 'bold',
          marginBottom: 8,
          lineHeight: 24
        }}>
          {article.title}
        </Text>
        
        <Text style={{
          color: '#d1d5db',
          fontSize: 14,
          lineHeight: 20,
          marginBottom: 12
        }}>
          {article.summary}
        </Text>
        
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Text style={{
            color: '#9ca3af',
            fontSize: 12
          }}>
            Por {article.author}
          </Text>
          
          <TouchableOpacity style={{
            flexDirection: 'row',
            alignItems: 'center'
          }}>
            <Text style={{
              color: '#3b82f6',
              fontSize: 14,
              fontWeight: '600',
              marginRight: 4
            }}>
              Leer más
            </Text>
            <Ionicons name="arrow-forward" size={14} color="#3b82f6" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#111827' }}>
      <StatusBar barStyle="light-content" backgroundColor="#111827" />
      
      {/* Header */}
      <LinearGradient
        colors={['#1f2937', '#111827']}
        style={{
          paddingTop: 50,
          paddingBottom: 20,
          paddingHorizontal: 16
        }}
      >
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 16
        }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              marginRight: 16,
              padding: 8
            }}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          
          <Text style={{
            color: 'white',
            fontSize: 24,
            fontWeight: 'bold',
            flex: 1
          }}>
            Noticias
          </Text>
          
          <TouchableOpacity style={{ padding: 8 }}>
            <Ionicons name="search" size={24} color="white" />
          </TouchableOpacity>
        </View>
        
        {/* Filtros de categoría */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: 8 }}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              onPress={() => setSelectedCategory(category)}
              style={{
                backgroundColor: selectedCategory === category ? '#3b82f6' : '#374151',
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                marginRight: 8
              }}
            >
              <Text style={{
                color: 'white',
                fontSize: 14,
                fontWeight: selectedCategory === category ? '600' : '400'
              }}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </LinearGradient>
      
      {/* Lista de noticias */}
      <ScrollView
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#3b82f6"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingTop: 16, paddingBottom: 32 }}>
          {loading ? (
            <View style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              paddingVertical: 50
            }}>
              <ActivityIndicator size="large" color="#3b82f6" />
              <Text style={{
                color: '#9ca3af',
                marginTop: 16,
                fontSize: 16
              }}>
                Cargando noticias...
              </Text>
            </View>
          ) : (
            filteredNews.map(renderNewsCard)
          )}
        </View>
      </ScrollView>
    </View>
  );
}