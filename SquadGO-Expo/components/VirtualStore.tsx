import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useCurrency, CoinPackage, PurchaseableItem } from '../contexts/CurrencyContext';

const { width } = Dimensions.get('window');

interface VirtualStoreProps {
  visible: boolean;
  onClose: () => void;
}

const VirtualStore: React.FC<VirtualStoreProps> = ({ visible, onClose }) => {
  const {
    balance,
    coinPackages,
    storeItems,
    isLoading,
    purchaseCoins,
    purchaseItem,
    canAfford
  } = useCurrency();
  
  const [activeTab, setActiveTab] = useState<'coins' | 'items'>('coins');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [purchasing, setPurchasing] = useState<string | null>(null);

  const handlePurchaseCoins = async (packageId: string) => {
    setPurchasing(packageId);
    try {
      await purchaseCoins(packageId);
    } finally {
      setPurchasing(null);
    }
  };

  const handlePurchaseItem = async (itemId: string) => {
    setPurchasing(itemId);
    try {
      await purchaseItem(itemId);
    } finally {
      setPurchasing(null);
    }
  };

  const filteredItems = selectedCategory === 'all' 
    ? storeItems 
    : storeItems.filter(item => item.category === selectedCategory);

  const categories = [
    { id: 'all', name: 'Todos', icon: '🛍️' },
    { id: 'theme', name: 'Temas', icon: '🎨' },
    { id: 'avatar', name: 'Avatares', icon: '👤' },
    { id: 'boost', name: 'Boosts', icon: '⚡' },
    { id: 'feature', name: 'Funciones', icon: '🔧' },
    { id: 'cosmetic', name: 'Cosméticos', icon: '✨' }
  ];

  const getRarityColor = (rarity?: string) => {
    switch (rarity) {
      case 'common': return '#95a5a6';
      case 'rare': return '#3498db';
      case 'epic': return '#9b59b6';
      case 'legendary': return '#f39c12';
      default: return '#95a5a6';
    }
  };

  const getRarityGradient = (rarity?: string) => {
    switch (rarity) {
      case 'common': return ['#bdc3c7', '#95a5a6'] as const;
      case 'rare': return ['#74b9ff', '#0984e3'] as const;
      case 'epic': return ['#a29bfe', '#6c5ce7'] as const;
      case 'legendary': return ['#fdcb6e', '#e17055'] as const;
      default: return ['#bdc3c7', '#95a5a6'] as const;
    }
  };

  const CoinPackageCard: React.FC<{ package: CoinPackage }> = ({ package: pkg }) => (
    <LinearGradient
      colors={pkg.popular ? ['#667eea', '#764ba2'] : ['#f093fb', '#f5576c']}
      style={[styles.packageCard, pkg.popular && styles.popularCard]}
    >
      {pkg.popular && (
        <View style={styles.popularBadge}>
          <Text style={styles.popularText}>MÁS POPULAR</Text>
        </View>
      )}
      
      <Text style={styles.packageIcon}>{pkg.icon}</Text>
      <Text style={styles.packageName}>{pkg.name}</Text>
      <Text style={styles.packageCoins}>{pkg.coins.toLocaleString()} SquadCoins</Text>
      
      {pkg.bonus && (
        <Text style={styles.bonusText}>+{pkg.bonus} BONUS</Text>
      )}
      
      <Text style={styles.packagePrice}>${pkg.price}</Text>
      
      <TouchableOpacity
        style={[styles.purchaseButton, purchasing === pkg.id && styles.purchasingButton]}
        onPress={() => handlePurchaseCoins(pkg.id)}
        disabled={purchasing === pkg.id}
      >
        {purchasing === pkg.id ? (
          <ActivityIndicator color="white" size="small" />
        ) : (
          <Text style={styles.purchaseButtonText}>COMPRAR</Text>
        )}
      </TouchableOpacity>
    </LinearGradient>
  );

  const StoreItemCard: React.FC<{ item: PurchaseableItem }> = ({ item }) => (
    <LinearGradient
      colors={getRarityGradient(item.rarity)}
      style={[styles.itemCard, item.owned && styles.ownedCard]}
    >
      <View style={styles.itemHeader}>
        <Text style={styles.itemIcon}>{item.icon}</Text>
        {item.rarity && (
          <View style={[styles.rarityBadge, { backgroundColor: getRarityColor(item.rarity) }]}>
            <Text style={styles.rarityText}>{item.rarity.toUpperCase()}</Text>
          </View>
        )}
      </View>
      
      <Text style={styles.itemName}>{item.name}</Text>
      <Text style={styles.itemDescription}>{item.description}</Text>
      
      {item.duration && (
        <Text style={styles.durationText}>⏰ {item.duration} días</Text>
      )}
      
      <View style={styles.itemFooter}>
        <Text style={styles.itemPrice}>{item.price} 🪙</Text>
        
        {item.owned ? (
          <View style={styles.ownedButton}>
            <Ionicons name="checkmark-circle" size={20} color="#27ae60" />
            <Text style={styles.ownedText}>POSEÍDO</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[
              styles.buyButton,
              !canAfford(item.price) && styles.cantAffordButton,
              purchasing === item.id && styles.purchasingButton
            ]}
            onPress={() => handlePurchaseItem(item.id)}
            disabled={!canAfford(item.price) || purchasing === item.id}
          >
            {purchasing === item.id ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={[
                styles.buyButtonText,
                !canAfford(item.price) && styles.cantAffordText
              ]}>
                {canAfford(item.price) ? 'COMPRAR' : 'SIN FONDOS'}
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </LinearGradient>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {/* Header */}
        <LinearGradient colors={['#667eea', '#764ba2']} style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
            
            <Text style={styles.headerTitle}>SquadStore</Text>
            
            <View style={styles.balanceContainer}>
              <Text style={styles.balanceText}>🪙 {balance.toLocaleString()}</Text>
            </View>
          </View>
          
          {/* Tabs */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'coins' && styles.activeTab]}
              onPress={() => setActiveTab('coins')}
            >
              <Text style={[styles.tabText, activeTab === 'coins' && styles.activeTabText]}>
                💰 SquadCoins
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.tab, activeTab === 'items' && styles.activeTab]}
              onPress={() => setActiveTab('items')}
            >
              <Text style={[styles.tabText, activeTab === 'items' && styles.activeTabText]}>
                🛍️ Artículos
              </Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {activeTab === 'coins' ? (
            <View style={styles.coinsSection}>
              <Text style={styles.sectionTitle}>Comprar SquadCoins</Text>
              <Text style={styles.sectionSubtitle}>
                Obtén SquadCoins para desbloquear contenido premium
              </Text>
              
              <View style={styles.packagesGrid}>
                {coinPackages.map((pkg) => (
                  <CoinPackageCard key={pkg.id} package={pkg} />
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.itemsSection}>
              {/* Category Filter */}
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.categoryFilter}
              >
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryButton,
                      selectedCategory === category.id && styles.activeCategoryButton
                    ]}
                    onPress={() => setSelectedCategory(category.id)}
                  >
                    <Text style={styles.categoryIcon}>{category.icon}</Text>
                    <Text style={[
                      styles.categoryText,
                      selectedCategory === category.id && styles.activeCategoryText
                    ]}>
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              
              {/* Items Grid */}
              <View style={styles.itemsGrid}>
                {filteredItems.map((item) => (
                  <StoreItemCard key={item.id} item={item} />
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa'
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20
  },
  closeButton: {
    padding: 8
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white'
  },
  balanceContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20
  },
  balanceText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 25,
    padding: 4
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 20
  },
  activeTab: {
    backgroundColor: 'white'
  },
  tabText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600'
  },
  activeTabText: {
    color: '#667eea'
  },
  content: {
    flex: 1,
    padding: 20
  },
  coinsSection: {
    marginBottom: 20
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 20
  },
  packagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  packageCard: {
    width: (width - 60) / 2,
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 15,
    position: 'relative'
  },
  popularCard: {
    borderWidth: 2,
    borderColor: '#f39c12'
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    backgroundColor: '#f39c12',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10
  },
  popularText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold'
  },
  packageIcon: {
    fontSize: 40,
    marginBottom: 10
  },
  packageName: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5
  },
  packageCoins: {
    color: 'white',
    fontSize: 14,
    marginBottom: 5
  },
  bonusText: {
    color: '#f39c12',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 10
  },
  packagePrice: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15
  },
  purchaseButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'white'
  },
  purchasingButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)'
  },
  purchaseButtonText: {
    color: 'white',
    fontWeight: 'bold'
  },
  itemsSection: {
    marginBottom: 20
  },
  categoryFilter: {
    marginBottom: 20
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  activeCategoryButton: {
    backgroundColor: '#667eea'
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: 5
  },
  categoryText: {
    color: '#2c3e50',
    fontWeight: '600'
  },
  activeCategoryText: {
    color: 'white'
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  itemCard: {
    width: (width - 60) / 2,
    padding: 15,
    borderRadius: 15,
    marginBottom: 15
  },
  ownedCard: {
    opacity: 0.7
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10
  },
  itemIcon: {
    fontSize: 30
  },
  rarityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8
  },
  rarityText: {
    color: 'white',
    fontSize: 8,
    fontWeight: 'bold'
  },
  itemName: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5
  },
  itemDescription: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginBottom: 10
  },
  durationText: {
    color: '#f39c12',
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 10
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  itemPrice: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold'
  },
  buyButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'white'
  },
  cantAffordButton: {
    backgroundColor: 'rgba(231, 76, 60, 0.3)',
    borderColor: '#e74c3c'
  },
  buyButtonText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold'
  },
  cantAffordText: {
    color: '#e74c3c'
  },
  ownedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(39, 174, 96, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12
  },
  ownedText: {
    color: '#27ae60',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4
  }
});

export default VirtualStore;