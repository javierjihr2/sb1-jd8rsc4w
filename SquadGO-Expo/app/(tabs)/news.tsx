import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  RefreshControl,
  Dimensions,
  Alert,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { SwipeableModal } from '../../components/EnhancedGestures';
import { ZoomableImage } from '../../components/ZoomableImage';
import { useDeviceInfo } from '../../hooks/useDeviceInfo';
import { theme } from '../../styles/theme';

const { width, height } = Dimensions.get('window');

interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: 'Actualizaciones' | 'eSports' | 'Comunidad' | 'Eventos';
  author: string;
  publishedAt: string;
  imageUrl?: string;
  readTime: string;
  tags: string[];
  likes: number;
  views: number;
}

const mockNewsArticles: NewsArticle[] = [
  {
    id: '1',
    title: 'Nueva Actualización 3.0: Revolucionando el Battle Royale',
    summary: 'La actualización más grande del año trae nuevas armas, mapas rediseñados y un sistema de progresión completamente renovado.',
    content: 'Esta actualización introduce características revolucionarias que cambiarán completamente la experiencia de juego. Los desarrolladores han trabajado durante meses para perfeccionar cada detalle.\n\nNovedades Principales:\n• Nuevo sistema de progresión\n• Mapas rediseñados\n• Armas balanceadas\n• Interfaz mejorada\n• Sistema de clanes actualizado\n\nMejoras de Rendimiento:\nSe han optimizado los gráficos y la estabilidad del juego. Los jugadores experimentarán una mejora significativa en los FPS y una reducción en los tiempos de carga.',
    category: 'Actualizaciones',
    author: 'Equipo del Battle Royale',
    publishedAt: '2024-01-15',
    imageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800',
    readTime: '5 min',
    tags: ['Actualización', 'Nuevas características', 'Rendimiento'],
    likes: 1250,
    views: 15420
  },
  {
    id: '2',
    title: 'Campeonato Mundial del Battle Royale 2024: ¡Regístrate Ahora!',
    summary: 'El torneo más grande del año está aquí. Premios de $2M USD y la oportunidad de convertirte en campeón mundial.',
    content: 'Los mejores equipos de todo el mundo se enfrentarán en una batalla épica por el título mundial. Cada equipo ha demostrado su valía en torneos regionales.\n\nFormato del Torneo:\n• Fase de grupos: 32 equipos\n• Eliminatorias: Top 16\n• Finales: Top 4\n• Premio total: $2,000,000 USD\n\nFechas Importantes:\n• Registro: Hasta el 28 de Febrero\n• Clasificatorias: Marzo 1-15\n• Finales: Abril 20-22',
    category: 'eSports',
    author: 'eSports Team',
    publishedAt: '2024-01-12',
    imageUrl: 'https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=800',
    readTime: '3 min',
    tags: ['Torneo', 'eSports', 'Competitivo'],
    likes: 890,
    views: 12300
  },
  {
    id: '3',
    title: 'Nuevas Estrategias para Dominar Erangel',
    summary: 'Descubre las mejores rutas de loot, posiciones defensivas y tácticas avanzadas para el mapa clásico.',
    content: 'Erangel sigue siendo uno de los mapas más populares y competitivos. Aquí te compartimos las estrategias más efectivas utilizadas por los profesionales.\n\nZonas de Aterrizaje Recomendadas:\n• School: Alto riesgo, alto reward\n• Pochinki: Combate intenso\n• Military Base: Loot premium\n• Georgopol: Equilibrio perfecto\n\nTácticas Avanzadas:\n• Rotaciones tempranas\n• Control de vehículos\n• Posicionamiento en círculos finales',
    category: 'Comunidad',
    author: 'Pro Player Guide',
    publishedAt: '2024-01-10',
    imageUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800',
    readTime: '7 min',
    tags: ['Estrategia', 'Erangel', 'Guía'],
    likes: 567,
    views: 8900
  },
  {
    id: '4',
    title: 'Evento Especial: Skin Dorada Limitada',
    summary: 'Por tiempo limitado, consigue la skin más exclusiva del juego completando desafíos especiales.',
    content: 'Este evento especial te permite obtener una de las skins más codiciadas del juego. Solo estará disponible durante 2 semanas.\n\nDesafíos del Evento:\n• Eliminar 100 enemigos\n• Ganar 10 partidas\n• Completar 5 misiones diarias\n• Jugar en todos los mapas\n\nRecompensas:\n• Skin Dorada AKM\n• Paracaídas exclusivo\n• Emotes especiales\n• 1000 AG gratis',
    category: 'Eventos',
    author: 'Events Team',
    publishedAt: '2024-01-08',
    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800',
    readTime: '4 min',
    tags: ['Evento', 'Skin', 'Recompensas'],
    likes: 2100,
    views: 25600
  }
];

const categoryColors = {
  'Actualizaciones': '#3B82F6',
  'eSports': '#EF4444',
  'Comunidad': '#10B981',
  'Eventos': '#F59E0B'
};

const categoryIcons = {
  'Actualizaciones': 'refresh-circle',
  'eSports': 'trophy',
  'Comunidad': 'people',
  'Eventos': 'calendar'
};

export default function NewsScreen() {
  const { isTablet } = useDeviceInfo();
  const [articles, setArticles] = useState<NewsArticle[]>(mockNewsArticles);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [likedArticles, setLikedArticles] = useState<Set<string>>(new Set());

  const categories = ['Todas', 'Actualizaciones', 'eSports', 'Comunidad', 'Eventos'];

  const filteredArticles = selectedCategory === 'Todas' 
    ? articles 
    : articles.filter(article => article.category === selectedCategory);

  const onRefresh = async () => {
    setRefreshing(true);
    // Simular carga de datos
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const handleLike = (articleId: string) => {
    const newLikedArticles = new Set(likedArticles);
    if (likedArticles.has(articleId)) {
      newLikedArticles.delete(articleId);
    } else {
      newLikedArticles.add(articleId);
    }
    setLikedArticles(newLikedArticles);

    setArticles(prev => prev.map(article => 
      article.id === articleId 
        ? { ...article, likes: article.likes + (likedArticles.has(articleId) ? -1 : 1) }
        : article
    ));
  };

  const handleShare = async (article: NewsArticle) => {
    try {
      await Share.share({
        message: `${article.title}\n\n${article.summary}\n\nLee más en SquadGO`,
        title: article.title
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const openArticle = (article: NewsArticle) => {
    setSelectedArticle(article);
    setModalVisible(true);
    // Incrementar vistas
    setArticles(prev => prev.map(a => 
      a.id === article.id ? { ...a, views: a.views + 1 } : a
    ));
  };

  const renderCategoryFilter = () => (
    <View style={styles.filterWrapper}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoryContainer}
        contentContainerStyle={styles.categoryContent}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryButton,
              selectedCategory === category && styles.categoryButtonActive
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text style={[
              styles.categoryText,
              selectedCategory === category && styles.categoryTextActive
            ]}>
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderArticleCard = (article: NewsArticle) => (
    <TouchableOpacity
      key={article.id}
      style={styles.articleCard}
      onPress={() => openArticle(article)}
      activeOpacity={0.8}
    >
      {article.imageUrl && (
        <Image source={{ uri: article.imageUrl }} style={styles.articleImage} />
      )}
      
      <View style={styles.articleContent}>
        <View style={styles.articleHeader}>
          <View style={[
            styles.categoryBadge,
            { backgroundColor: categoryColors[article.category] }
          ]}>
            <Ionicons 
              name={categoryIcons[article.category] as any} 
              size={12} 
              color="white" 
            />
            <Text style={styles.categoryBadgeText}>{article.category}</Text>
          </View>
          <Text style={styles.readTime}>{article.readTime}</Text>
        </View>

        <Text style={styles.articleTitle}>{article.title}</Text>
        <Text style={styles.articleSummary}>{article.summary}</Text>

        <View style={styles.articleFooter}>
          <View style={styles.articleMeta}>
            <Text style={styles.articleAuthor}>{article.author}</Text>
            <Text style={styles.articleDate}>{article.publishedAt}</Text>
          </View>

          <View style={styles.articleActions}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleLike(article.id)}
            >
              <Ionicons 
                name={likedArticles.has(article.id) ? 'heart' : 'heart-outline'} 
                size={16} 
                color={likedArticles.has(article.id) ? '#EF4444' : '#6B7280'} 
              />
              <Text style={styles.actionText}>{article.likes}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleShare(article)}
            >
              <Ionicons name="share-outline" size={16} color="#6B7280" />
            </TouchableOpacity>

            <View style={styles.actionButton}>
              <Ionicons name="eye-outline" size={16} color="#6B7280" />
              <Text style={styles.actionText}>{article.views}</Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderArticleModal = () => (
    <SwipeableModal
      visible={modalVisible}
      onClose={() => setModalVisible(false)}
      swipeDirection="down"
      swipeThreshold={isTablet ? 120 : 80}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        {selectedArticle && (
          <>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
              
              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={styles.modalActionButton}
                  onPress={() => handleLike(selectedArticle.id)}
                >
                  <Ionicons 
                    name={likedArticles.has(selectedArticle.id) ? 'heart' : 'heart-outline'} 
                    size={20} 
                    color={likedArticles.has(selectedArticle.id) ? '#EF4444' : '#6B7280'} 
                  />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.modalActionButton}
                  onPress={() => handleShare(selectedArticle)}
                >
                  <Ionicons name="share-outline" size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView style={styles.modalContent}>
              {selectedArticle.imageUrl && (
                <ZoomableImage
                  source={{ uri: selectedArticle.imageUrl }}
                  style={styles.modalImage}
                  minScale={1}
                  maxScale={isTablet ? 4 : 3}
                  doubleTapScale={isTablet ? 2.5 : 2}
                />
              )}
              
              <View style={styles.modalArticleContent}>
                <View style={[
                  styles.categoryBadge,
                  { backgroundColor: categoryColors[selectedArticle.category] }
                ]}>
                  <Ionicons 
                    name={categoryIcons[selectedArticle.category] as any} 
                    size={12} 
                    color="white" 
                  />
                  <Text style={styles.categoryBadgeText}>{selectedArticle.category}</Text>
                </View>

                <Text style={styles.modalTitle}>{selectedArticle.title}</Text>
                
                <View style={styles.modalMeta}>
                  <Text style={styles.modalAuthor}>{selectedArticle.author}</Text>
                  <Text style={styles.modalDate}>{selectedArticle.publishedAt}</Text>
                  <Text style={styles.modalReadTime}>{selectedArticle.readTime}</Text>
                </View>

                <Text style={styles.modalText}>
                  {selectedArticle.content.split('\n').map((paragraph, index) => (
                    paragraph.trim() && (
                      <Text key={index}>
                        {paragraph}
                        {index < selectedArticle.content.split('\n').length - 1 && '\n\n'}
                      </Text>
                    )
                  ))}
                </Text>

                <View style={styles.modalTags}>
                  {selectedArticle.tags.map((tag, index) => (
                    <View key={index} style={styles.tag}>
                      <Text style={styles.tagText}>#{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </ScrollView>
          </>
        )}
      </SafeAreaView>
    </SwipeableModal>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a1a2e', '#16213e']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Noticias</Text>
        <Text style={styles.headerSubtitle}>Mantente al día con el Battle Royale</Text>
      </LinearGradient>

      {renderCategoryFilter()}

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredArticles.map(renderArticleCard)}
      </ScrollView>

      {renderArticleModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    fontSize: theme.typography.fontSize['3xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[1],
  },
  headerSubtitle: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
  },
  filterWrapper: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  categoryContainer: {
    paddingVertical: 12,
  },
  categoryContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(241, 245, 249, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.3)',
    minWidth: 'auto',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  categoryButtonActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.9)',
    borderColor: 'rgba(59, 130, 246, 0.5)',
    shadowColor: '#3b82f6',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.secondary,
  },
  categoryTextActive: {
    color: theme.colors.text.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  articleCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  articleImage: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  articleContent: {
    padding: 16,
  },
  articleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  readTime: {
    fontSize: 12,
    color: '#6b7280',
  },
  articleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    lineHeight: 24,
  },
  articleSummary: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  articleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  articleMeta: {
    flex: 1,
  },
  articleAuthor: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  articleDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  articleActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 12,
    color: '#6b7280',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  closeButton: {
    padding: 8,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 16,
  },
  modalActionButton: {
    padding: 8,
  },
  modalContent: {
    flex: 1,
  },
  modalImage: {
    width: '100%',
    height: 250,
  },
  modalArticleContent: {
    padding: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginVertical: 16,
    lineHeight: 32,
  },
  modalMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  modalDate: {
    fontSize: 14,
    color: '#6b7280',
  },
  modalReadTime: {
    fontSize: 14,
    color: '#6b7280',
  },
  modalText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#374151',
    marginBottom: 24,
  },
  modalTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
});