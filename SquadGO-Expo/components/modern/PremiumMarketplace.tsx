import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  Modal,
  FlatList,
  TextInput,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { theme } from '../../styles/theme';

const { width, height } = Dimensions.get('window');

interface ServiceProvider {
  id: string;
  name: string;
  username: string;
  avatar: string;
  isVerified?: boolean;
  isPremium?: boolean;
  rating: number;
  reviewsCount: number;
  responseTime: string;
  completedOrders: number;
  badges: string[];
  location?: string;
}

interface ServicePackage {
  id: string;
  name: string;
  description: string;
  price: number;
  deliveryTime: string;
  features: string[];
  isPopular?: boolean;
}

interface Service {
  id: string;
  title: string;
  description: string;
  category: string;
  subcategory: string;
  provider: ServiceProvider;
  packages: ServicePackage[];
  gallery: string[];
  tags: string[];
  startingPrice: number;
  currency: string;
  isPromoted?: boolean;
  isFeatured?: boolean;
  createdAt: number;
  totalOrders: number;
  averageRating: number;
  reviewsCount: number;
}

interface PremiumMarketplaceProps {
  services: Service[];
  categories: string[];
  currentUserId: string;
  onServicePress?: (service: Service) => void;
  onProviderPress?: (provider: ServiceProvider) => void;
  onBookService?: (serviceId: string, packageId: string) => void;
  onContactProvider?: (providerId: string) => void;
  onFavorite?: (serviceId: string) => void;
}

const FILTER_OPTIONS = [
  { id: 'all', name: 'Todos', icon: 'grid-outline' },
  { id: 'featured', name: 'Destacados', icon: 'star-outline' },
  { id: 'new', name: 'Nuevos', icon: 'time-outline' },
  { id: 'popular', name: 'Populares', icon: 'trending-up-outline' },
  { id: 'nearby', name: 'Cerca', icon: 'location-outline' },
  { id: 'rating', name: 'Mejor Valorados', icon: 'star-outline' },
  { id: 'price-low', name: 'Precio Bajo', icon: 'arrow-down-outline' },
  { id: 'price-high', name: 'Precio Alto', icon: 'arrow-up-outline' },
];

const CATEGORIES = [
  { id: 'coaching', name: 'Coaching', icon: '🎯', color: '#FF6B35' },
  { id: 'design', name: 'Diseño', icon: '🎨', color: '#9C27B0' },
  { id: 'streaming', name: 'Streaming', icon: '📹', color: '#E91E63' },
  { id: 'editing', name: 'Edición', icon: '✂️', color: '#2196F3' },
  { id: 'music', name: 'Música', icon: '🎵', color: '#FF9800' },
  { id: 'writing', name: 'Escritura', icon: '✍️', color: '#4CAF50' },
  { id: 'marketing', name: 'Marketing', icon: '📈', color: '#795548' },
  { id: 'development', name: 'Desarrollo', icon: '💻', color: '#607D8B' },
];

export const PremiumMarketplace: React.FC<PremiumMarketplaceProps> = ({
  services,
  categories,
  currentUserId,
  onServicePress,
  onProviderPress,
  onBookService,
  onContactProvider,
  onFavorite
}) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [sortBy, setSortBy] = useState('relevance');

  const filteredServices = services.filter(service => {
    const matchesSearch = service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         service.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || service.category === selectedCategory;
    
    const matchesFilter = (() => {
      switch (selectedFilter) {
        case 'featured': return service.isFeatured;
        case 'new': return Date.now() - service.createdAt < 7 * 24 * 60 * 60 * 1000; // 7 days
        case 'popular': return service.totalOrders > 50;
        case 'nearby': return true; // Would implement location-based filtering
        default: return true;
      }
    })();
    
    const matchesPrice = service.startingPrice >= priceRange[0] && service.startingPrice <= priceRange[1];
    
    return matchesSearch && matchesCategory && matchesFilter && matchesPrice;
  });

  const renderServiceCard = (service: Service) => {
    return (
      <TouchableOpacity
        key={service.id}
        style={styles.serviceCard}
        onPress={() => setSelectedService(service)}
      >
        {service.isPromoted && (
          <View style={styles.promotedBadge}>
            <Text style={styles.promotedText}>Promocionado</Text>
          </View>
        )}
        
        {service.isFeatured && (
          <View style={styles.featuredBadge}>
            <Ionicons name="star" size={12} color="white" />
          </View>
        )}

        <Image source={{ uri: service.gallery[0] }} style={styles.serviceImage} />
        
        <View style={styles.serviceContent}>
          <View style={styles.serviceHeader}>
            <Text style={styles.serviceTitle} numberOfLines={2}>{service.title}</Text>
            <TouchableOpacity onPress={() => onFavorite?.(service.id)}>
              <Ionicons name="heart-outline" size={20} color="#666" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.serviceDescription} numberOfLines={2}>
            {service.description}
          </Text>
          
          <View style={styles.serviceTags}>
            {service.tags.slice(0, 3).map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
          
          <TouchableOpacity
            style={styles.providerInfo}
            onPress={() => onProviderPress?.(service.provider)}
          >
            <Image source={{ uri: service.provider.avatar }} style={styles.providerAvatar} />
            <View style={styles.providerDetails}>
              <Text style={styles.providerName}>
                {service.provider.name}
                {service.provider.isVerified && (
                  <Ionicons name="checkmark-circle" size={14} color="#1DA1F2" />
                )}
                {service.provider.isPremium && (
                  <Ionicons name="diamond" size={14} color="#FFD700" />
                )}
              </Text>
              <View style={styles.providerStats}>
                <Ionicons name="star" size={12} color="#FFD700" />
                <Text style={styles.rating}>{service.provider.rating}</Text>
                <Text style={styles.reviews}>({service.provider.reviewsCount})</Text>
              </View>
            </View>
          </TouchableOpacity>
          
          <View style={styles.serviceFooter}>
            <View style={styles.priceContainer}>
              <Text style={styles.priceLabel}>Desde</Text>
              <Text style={styles.price}>
                {service.currency}{service.startingPrice}
              </Text>
            </View>
            <View style={styles.serviceStats}>
              <Text style={styles.orders}>{service.totalOrders} pedidos</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFiltersModal = () => {
    return (
      <Modal
        visible={showFilters}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Filtros</Text>
            <TouchableOpacity onPress={() => {
              setSelectedCategory('all');
              setSelectedFilter('all');
              setPriceRange([0, 1000]);
            }}>
              <Text style={styles.clearFiltersText}>Limpiar</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            {/* Categories */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Categorías</Text>
              <View style={styles.filterGrid}>
                {CATEGORIES.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[styles.filterGridItem, selectedCategory === category.id && styles.selectedFilterGridItem]}
                    onPress={() => setSelectedCategory(category.id)}
                  >
                    <Text style={styles.categoryIcon}>{category.icon}</Text>
                    <Text style={[styles.filterGridText, selectedCategory === category.id && styles.selectedFilterGridText]}>
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            {/* Filter Options */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Filtros</Text>
              <View style={styles.filterGrid}>
                {FILTER_OPTIONS.map((filter) => (
                  <TouchableOpacity
                    key={filter.id}
                    style={[styles.filterGridItem, selectedFilter === filter.id && styles.selectedFilterGridItem]}
                    onPress={() => setSelectedFilter(filter.id)}
                  >
                    <Ionicons
                      name={filter.icon as any}
                      size={20}
                      color={selectedFilter === filter.id ? 'white' : '#666'}
                    />
                    <Text style={[styles.filterGridText, selectedFilter === filter.id && styles.selectedFilterGridText]}>
                      {filter.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
          
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.applyFiltersButton}
              onPress={() => setShowFilters(false)}
            >
              <Text style={styles.applyFiltersButtonText}>Aplicar Filtros</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  const renderServiceModal = () => {
    if (!selectedService) return null;

    return (
      <Modal
        visible={!!selectedService}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedService(null)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setSelectedService(null)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Detalles del Servicio</Text>
            <TouchableOpacity onPress={() => onFavorite?.(selectedService.id)}>
              <Ionicons name="heart-outline" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            {/* Service Gallery */}
            <ScrollView horizontal pagingEnabled style={styles.gallery}>
              {selectedService.gallery.map((image, index) => (
                <Image key={index} source={{ uri: image }} style={styles.galleryImage} />
              ))}
            </ScrollView>
            
            {/* Service Info */}
            <View style={styles.serviceInfo}>
              <Text style={styles.modalServiceTitle}>{selectedService.title}</Text>
              <Text style={styles.modalServiceDescription}>{selectedService.description}</Text>
              
              {/* Provider Card */}
              <TouchableOpacity
                style={styles.modalProviderCard}
                onPress={() => onProviderPress?.(selectedService.provider)}
              >
                <Image source={{ uri: selectedService.provider.avatar }} style={styles.modalProviderAvatar} />
                <View style={styles.modalProviderInfo}>
                  <Text style={styles.modalProviderName}>
                    {selectedService.provider.name}
                    {selectedService.provider.isVerified && (
                      <Ionicons name="checkmark-circle" size={16} color="#1DA1F2" />
                    )}
                    {selectedService.provider.isPremium && (
                      <Ionicons name="diamond" size={16} color="#FFD700" />
                    )}
                  </Text>
                  <View style={styles.modalProviderStats}>
                    <View style={styles.statItem}>
                      <Ionicons name="star" size={14} color="#FFD700" />
                      <Text style={styles.statText}>{selectedService.provider.rating}</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Ionicons name="time" size={14} color="#666" />
                      <Text style={styles.statText}>{selectedService.provider.responseTime}</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
                      <Text style={styles.statText}>{selectedService.provider.completedOrders} completados</Text>
                    </View>
                  </View>
                  
                  {/* Provider Badges */}
                  <View style={styles.badges}>
                    {selectedService.provider.badges.map((badge, index) => (
                      <View key={index} style={styles.badge}>
                        <Text style={styles.badgeText}>{badge}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </TouchableOpacity>
              
              {/* Service Packages */}
              <Text style={styles.packagesTitle}>Paquetes de Servicio</Text>
              {selectedService.packages.map((pkg, index) => (
                <View key={pkg.id} style={[styles.packageCard, pkg.isPopular && styles.popularPackage]}>
                  {pkg.isPopular && (
                    <View style={styles.popularBadge}>
                      <Text style={styles.popularBadgeText}>Más Popular</Text>
                    </View>
                  )}
                  
                  <View style={styles.packageHeader}>
                    <Text style={styles.packageName}>{pkg.name}</Text>
                    <Text style={styles.packagePrice}>
                      {selectedService.currency}{pkg.price}
                    </Text>
                  </View>
                  
                  <Text style={styles.packageDescription}>{pkg.description}</Text>
                  
                  <View style={styles.packageFeatures}>
                    {pkg.features.map((feature, featureIndex) => (
                      <View key={featureIndex} style={styles.feature}>
                        <Ionicons name="checkmark" size={16} color="#4CAF50" />
                        <Text style={styles.featureText}>{feature}</Text>
                      </View>
                    ))}
                  </View>
                  
                  <View style={styles.packageFooter}>
                    <Text style={styles.deliveryTime}>
                      <Ionicons name="time" size={14} color="#666" /> {pkg.deliveryTime}
                    </Text>
                    <TouchableOpacity
                      style={[styles.bookButton, pkg.isPopular && styles.popularBookButton]}
                      onPress={() => {
                        onBookService?.(selectedService.id, pkg.id);
                        setSelectedService(null);
                      }}
                    >
                      <Text style={[styles.bookButtonText, pkg.isPopular && styles.popularBookButtonText]}>
                        Contratar
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
          
          {/* Bottom Actions */}
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.contactButton}
              onPress={() => {
                onContactProvider?.(selectedService.provider.id);
                setSelectedService(null);
              }}
            >
              <Ionicons name="chatbubble-outline" size={20} color="#FF6B35" />
              <Text style={styles.contactButtonText}>Contactar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Marketplace Premium</Text>
        <TouchableOpacity onPress={() => setShowFilters(true)}>
          <Ionicons name="options-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar servicios..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      
      {/* Categories */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
        <TouchableOpacity
          style={[styles.categoryItem, selectedCategory === 'all' && styles.selectedCategory]}
          onPress={() => setSelectedCategory('all')}
        >
          <Text style={[styles.categoryText, selectedCategory === 'all' && styles.selectedCategoryText]}>
            Todos
          </Text>
        </TouchableOpacity>
        {CATEGORIES.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[styles.categoryItem, selectedCategory === category.id && styles.selectedCategory]}
            onPress={() => setSelectedCategory(category.id)}
          >
            <Text style={styles.categoryIcon}>{category.icon}</Text>
            <Text style={[styles.categoryText, selectedCategory === category.id && styles.selectedCategoryText]}>
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      {/* Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersContainer}>
        {FILTER_OPTIONS.map((filter) => (
          <TouchableOpacity
            key={filter.id}
            style={[styles.filterItem, selectedFilter === filter.id && styles.selectedFilter]}
            onPress={() => setSelectedFilter(filter.id)}
          >
            <Ionicons
              name={filter.icon as any}
              size={16}
              color={selectedFilter === filter.id ? 'white' : '#666'}
            />
            <Text style={[styles.filterText, selectedFilter === filter.id && styles.selectedFilterText]}>
              {filter.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      {/* Services Grid */}
      <FlatList
        data={filteredServices}
        renderItem={({ item }) => renderServiceCard(item)}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.servicesGrid}
        showsVerticalScrollIndicator={false}
      />
      
      {/* Service Detail Modal */}
      {renderServiceModal()}
      
      {/* Filters Modal */}
      {renderFiltersModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingBottom: 120, // Espacio para el menú inferior
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginTop: -10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchInput: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    paddingLeft: theme.spacing.sm,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
  },
  categoriesContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    marginBottom: theme.spacing.md,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  selectedCategory: {
    backgroundColor: '#FF6B35',
  },
  categoryIcon: {
    fontSize: 16,
  },
  categoryText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.secondary,
  },
  selectedCategoryText: {
    color: 'white',
  },
  filtersContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    marginBottom: 8,
  },
  filterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    gap: 6,
    height: 40,
    minWidth: 80,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  selectedFilter: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },
  selectedFilterText: {
    color: 'white',
  },
  servicesGrid: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 12,
  },
  serviceCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    marginHorizontal: 4,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  promotedBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FF6B35',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    zIndex: 1,
  },
  promotedText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  featuredBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FFD700',
    padding: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  serviceImage: {
    width: '100%',
    height: 140,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  serviceContent: {
    padding: 16,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  serviceTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    lineHeight: 20,
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
    marginBottom: 8,
  },
  serviceTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 8,
  },
  tag: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 10,
    color: '#666',
    fontWeight: '500',
  },
  providerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  providerAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  providerDetails: {
    flex: 1,
  },
  providerName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  providerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[1],
  },
  rating: {
    fontSize: 11,
    fontWeight: '600',
    color: '#333',
  },
  reviews: {
    fontSize: 11,
    color: '#666',
  },
  serviceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceContainer: {
    alignItems: 'flex-start',
  },
  priceLabel: {
    fontSize: 10,
    color: '#666',
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF6B35',
  },
  serviceStats: {
    alignItems: 'flex-end',
  },
  orders: {
    fontSize: 10,
    color: '#666',
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
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  modalContent: {
    flex: 1,
  },
  gallery: {
    height: 250,
  },
  galleryImage: {
    width,
    height: 250,
  },
  serviceInfo: {
    padding: theme.spacing.lg,
  },
  modalServiceTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 10,
  },
  modalServiceDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
    marginBottom: 20,
  },
  modalProviderCard: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    gap: 12,
  },
  modalProviderAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  modalProviderInfo: {
    flex: 1,
  },
  modalProviderName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 5,
  },
  modalProviderStats: {
    flexDirection: 'row',
    gap: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[1],
  },
  statText: {
    fontSize: 12,
    color: '#666',
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  badge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 10,
    color: '#1976D2',
    fontWeight: '600',
  },
  packagesTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 15,
  },
  packageCard: {
    backgroundColor: '#F8F9FA',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    position: 'relative',
  },
  popularPackage: {
    borderWidth: 2,
    borderColor: '#FF6B35',
    backgroundColor: '#FFF8F5',
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    left: 15,
    backgroundColor: '#FF6B35',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
  },
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  packageName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  packagePrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF6B35',
  },
  packageDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  packageFeatures: {
    marginBottom: 15,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  featureText: {
    fontSize: 14,
    color: '#333',
  },
  packageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deliveryTime: {
    fontSize: 12,
    color: '#666',
  },
  bookButton: {
    backgroundColor: '#333',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  popularBookButton: {
    backgroundColor: theme.colors.accent.primary,
  },
  bookButtonText: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  popularBookButtonText: {
    color: theme.colors.text.primary,
  },
  modalActions: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface.primary,
    borderWidth: 2,
    borderColor: theme.colors.accent.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    gap: theme.spacing.sm,
  },
  contactButtonText: {
    color: theme.colors.accent.primary,
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  clearFiltersText: {
    color: '#FF6B35',
    fontSize: 16,
    fontWeight: '600',
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  filterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  filterGridItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    gap: 8,
    minWidth: '45%',
  },
  selectedFilterGridItem: {
    backgroundColor: '#333',
    borderColor: '#333',
  },
  filterGridText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  selectedFilterGridText: {
    color: 'white',
  },
  applyFiltersButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyFiltersButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PremiumMarketplace;