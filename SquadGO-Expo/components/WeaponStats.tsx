import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Image,
  Dimensions,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface WeaponAttachment {
  id: string;
  name: string;
  type: 'scope' | 'muzzle' | 'grip' | 'magazine' | 'stock';
  effect: string;
}

interface WeaponData {
  id: string;
  name: string;
  category: 'AR' | 'SMG' | 'Sniper' | 'DMR' | 'LMG' | 'Shotgun' | 'Pistol';
  damage: number;
  range: number;
  stability: number;
  fireRate: number;
  mobility: number;
  ammoType: '5.56mm' | '7.62mm' | '.45 ACP' | '9mm' | '.300 Magnum' | '12 Gauge';
  attachments: WeaponAttachment[];
  description: string;
  pros: string[];
  cons: string[];
  bestMaps: string[];
  image: string;
}

interface WeaponStatsProps {
  visible: boolean;
  onClose: () => void;
}

const weaponsData: WeaponData[] = [
  {
    id: 'm416',
    name: 'M416',
    category: 'AR',
    damage: 43,
    range: 85,
    stability: 75,
    fireRate: 80,
    mobility: 70,
    ammoType: '5.56mm',
    attachments: [
      { id: 'red_dot', name: 'Red Dot Sight', type: 'scope', effect: '+10% Precisión' },
      { id: 'compensator', name: 'Compensador', type: 'muzzle', effect: '-15% Retroceso' },
      { id: 'vertical_grip', name: 'Empuñadura Vertical', type: 'grip', effect: '-10% Retroceso Vertical' },
      { id: 'extended_mag', name: 'Cargador Extendido', type: 'magazine', effect: '+10 Balas' },
      { id: 'tactical_stock', name: 'Culata Táctica', type: 'stock', effect: '+5% Estabilidad' }
    ],
    description: 'Rifle de asalto versátil y equilibrado, ideal para jugadores de todos los niveles.',
    pros: ['Muy estable', 'Fácil de controlar', 'Buen daño', 'Muchos attachments'],
    cons: ['Daño menor que AKM', 'Requiere attachments para brillar'],
    bestMaps: ['Erangel', 'Miramar', 'Vikendi'],
    image: 'https://via.placeholder.com/200x100/4a5568/ffffff?text=M416'
  },
  {
    id: 'akm',
    name: 'AKM',
    category: 'AR',
    damage: 49,
    range: 80,
    stability: 60,
    fireRate: 75,
    mobility: 65,
    ammoType: '7.62mm',
    attachments: [
      { id: 'red_dot', name: 'Red Dot Sight', type: 'scope', effect: '+10% Precisión' },
      { id: 'compensator', name: 'Compensador', type: 'muzzle', effect: '-15% Retroceso' },
      { id: 'extended_mag', name: 'Cargador Extendido', type: 'magazine', effect: '+10 Balas' }
    ],
    description: 'Rifle de asalto de alto daño pero difícil de controlar. Para jugadores experimentados.',
    pros: ['Daño muy alto', 'Excelente para long range', 'Penetración de armadura'],
    cons: ['Retroceso alto', 'Difícil de controlar', 'Pocos attachments'],
    bestMaps: ['Miramar', 'Erangel'],
    image: 'https://via.placeholder.com/200x100/dc2626/ffffff?text=AKM'
  },
  {
    id: 'awm',
    name: 'AWM',
    category: 'Sniper',
    damage: 120,
    range: 100,
    stability: 90,
    fireRate: 20,
    mobility: 40,
    ammoType: '.300 Magnum',
    attachments: [
      { id: '8x_scope', name: 'Mira 8x', type: 'scope', effect: '+50% Zoom' },
      { id: 'suppressor', name: 'Silenciador', type: 'muzzle', effect: 'Sin flash ni sonido' },
      { id: 'extended_mag', name: 'Cargador Extendido', type: 'magazine', effect: '+2 Balas' }
    ],
    description: 'El sniper más poderoso del juego. One-shot headshot garantizado.',
    pros: ['Daño máximo', 'One-shot headshot', 'Alcance extremo'],
    cons: ['Solo en drops', 'Munición limitada', 'Muy lento'],
    bestMaps: ['Miramar', 'Erangel'],
    image: 'https://via.placeholder.com/200x100/7c3aed/ffffff?text=AWM'
  },
  {
    id: 'vector',
    name: 'Vector',
    category: 'SMG',
    damage: 31,
    range: 50,
    stability: 85,
    fireRate: 95,
    mobility: 90,
    ammoType: '.45 ACP',
    attachments: [
      { id: 'red_dot', name: 'Red Dot Sight', type: 'scope', effect: '+10% Precisión' },
      { id: 'suppressor', name: 'Silenciador', type: 'muzzle', effect: 'Sin flash ni sonido' },
      { id: 'vertical_grip', name: 'Empuñadura Vertical', type: 'grip', effect: '-10% Retroceso' },
      { id: 'extended_mag', name: 'Cargador Extendido', type: 'magazine', effect: '+12 Balas' },
      { id: 'tactical_stock', name: 'Culata Táctica', type: 'stock', effect: '+5% Estabilidad' }
    ],
    description: 'SMG de alta cadencia de tiro, devastador en combate cercano.',
    pros: ['Cadencia altísima', 'Excelente CQC', 'Muy móvil', 'Fácil de controlar'],
    cons: ['Alcance limitado', 'Daño por bala bajo', 'Consume mucha munición'],
    bestMaps: ['Sanhok', 'Livik'],
    image: 'https://via.placeholder.com/200x100/059669/ffffff?text=Vector'
  },
  {
    id: 'kar98k',
    name: 'Kar98k',
    category: 'Sniper',
    damage: 79,
    range: 95,
    stability: 85,
    fireRate: 35,
    mobility: 55,
    ammoType: '7.62mm',
    attachments: [
      { id: '8x_scope', name: 'Mira 8x', type: 'scope', effect: '+50% Zoom' },
      { id: 'suppressor', name: 'Silenciador', type: 'muzzle', effect: 'Sin flash ni sonido' }
    ],
    description: 'Sniper clásico y confiable. Disponible en el mundo y muy efectivo.',
    pros: ['Buen daño', 'Disponible en mundo', 'Alcance excelente', 'Headshot letal'],
    cons: ['No one-shot a nivel 3', 'Recarga lenta', 'Bullet drop'],
    bestMaps: ['Erangel', 'Miramar', 'Vikendi'],
    image: 'https://via.placeholder.com/200x100/b45309/ffffff?text=Kar98k'
  },
  {
    id: 'groza',
    name: 'Groza',
    category: 'AR',
    damage: 49,
    range: 75,
    stability: 70,
    fireRate: 85,
    mobility: 75,
    ammoType: '7.62mm',
    attachments: [
      { id: 'red_dot', name: 'Red Dot Sight', type: 'scope', effect: '+10% Precisión' },
      { id: 'suppressor', name: 'Silenciador', type: 'muzzle', effect: 'Sin flash ni sonido' },
      { id: 'extended_mag', name: 'Cargador Extendido', type: 'magazine', effect: '+10 Balas' }
    ],
    description: 'Rifle de asalto de drop con alto daño y buena cadencia de tiro.',
    pros: ['Daño alto', 'Buena cadencia', 'Viene con silenciador', 'Muy efectivo'],
    cons: ['Solo en drops', 'Retroceso considerable', 'Munición 7.62mm'],
    bestMaps: ['Todos los mapas'],
    image: 'https://via.placeholder.com/200x100/dc2626/ffffff?text=Groza'
  }
];

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'AR': return '#3b82f6';
    case 'SMG': return '#10b981';
    case 'Sniper': return '#8b5cf6';
    case 'DMR': return '#f59e0b';
    case 'LMG': return '#ef4444';
    case 'Shotgun': return '#f97316';
    case 'Pistol': return '#6b7280';
    default: return '#6b7280';
  }
};

const getStatColor = (value: number) => {
  if (value >= 80) return '#10b981';
  if (value >= 60) return '#f59e0b';
  return '#ef4444';
};

export default function WeaponStats({ visible, onClose }: WeaponStatsProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [selectedWeapon, setSelectedWeapon] = useState<WeaponData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showWeaponDetail, setShowWeaponDetail] = useState(false);

  const categories = useMemo(() => ['Todas', 'AR', 'SMG', 'Sniper', 'DMR', 'LMG', 'Shotgun', 'Pistol'], []);

  const filteredWeapons = useMemo(() => {
    return weaponsData.filter(weapon => {
      const matchesCategory = selectedCategory === 'Todas' || weapon.category === selectedCategory;
      const matchesSearch = weapon.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const renderStatBar = useCallback((label: string, value: number, maxValue: number = 100) => (
    <View style={styles.statContainer}>
      <View style={styles.statHeader}>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={[styles.statValue, { color: getStatColor(value) }]}>{value}</Text>
      </View>
      <View style={styles.statBarContainer}>
        <View 
          style={[styles.statBar, { 
            width: `${(value / maxValue) * 100}%` as any,
            backgroundColor: getStatColor(value)
          }]} 
        />
      </View>
    </View>
  ), []);

  const renderWeaponCard = (weapon: WeaponData) => (
    <TouchableOpacity
      key={weapon.id}
      style={styles.weaponCard}
      onPress={() => {
        setSelectedWeapon(weapon);
        setShowWeaponDetail(true);
      }}
    >
      <LinearGradient
        colors={['#1f2937', '#374151']}
        style={styles.weaponCardGradient}
      >
        <View style={styles.weaponHeader}>
          <Image source={{ uri: weapon.image }} style={styles.weaponImage} />
          <View style={styles.weaponInfo}>
            <Text style={styles.weaponName}>{weapon.name}</Text>
            <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(weapon.category) }]}>
              <Text style={styles.categoryText}>{weapon.category}</Text>
            </View>
            <Text style={styles.ammoType}>{weapon.ammoType}</Text>
          </View>
        </View>
        
        <View style={styles.quickStats}>
          <View style={styles.quickStat}>
            <Text style={styles.quickStatLabel}>DMG</Text>
            <Text style={[styles.quickStatValue, { color: getStatColor(weapon.damage) }]}>
              {weapon.damage}
            </Text>
          </View>
          <View style={styles.quickStat}>
            <Text style={styles.quickStatLabel}>RNG</Text>
            <Text style={[styles.quickStatValue, { color: getStatColor(weapon.range) }]}>
              {weapon.range}
            </Text>
          </View>
          <View style={styles.quickStat}>
            <Text style={styles.quickStatLabel}>STB</Text>
            <Text style={[styles.quickStatValue, { color: getStatColor(weapon.stability) }]}>
              {weapon.stability}
            </Text>
          </View>
          <View style={styles.quickStat}>
            <Text style={styles.quickStatLabel}>ROF</Text>
            <Text style={[styles.quickStatValue, { color: getStatColor(weapon.fireRate) }]}>
              {weapon.fireRate}
            </Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Estadísticas de Armas</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar armas..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Categories */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
        >
          {categories.map(category => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryButton,
                selectedCategory === category && styles.categoryButtonActive
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text style={[
                styles.categoryButtonText,
                selectedCategory === category && styles.categoryButtonTextActive
              ]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Weapons List */}
        <ScrollView style={styles.weaponsList} showsVerticalScrollIndicator={false}>
          {filteredWeapons.map(renderWeaponCard)}
        </ScrollView>

        {/* Weapon Detail Modal */}
        <Modal 
          visible={showWeaponDetail} 
          animationType="slide" 
          presentationStyle="pageSheet"
        >
          {selectedWeapon && (
            <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.container}>
              <View style={styles.header}>
                <TouchableOpacity 
                  onPress={() => setShowWeaponDetail(false)} 
                  style={styles.closeButton}
                >
                  <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{selectedWeapon.name}</Text>
                <View style={styles.placeholder} />
              </View>

              <ScrollView style={styles.weaponDetail} showsVerticalScrollIndicator={false}>
                <View style={styles.weaponDetailHeader}>
                  <Image source={{ uri: selectedWeapon.image }} style={styles.weaponDetailImage} />
                  <View style={styles.weaponDetailInfo}>
                    <Text style={styles.weaponDetailName}>{selectedWeapon.name}</Text>
                    <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(selectedWeapon.category) }]}>
                      <Text style={styles.categoryText}>{selectedWeapon.category}</Text>
                    </View>
                    <Text style={styles.weaponDescription}>{selectedWeapon.description}</Text>
                  </View>
                </View>

                {/* Stats */}
                <View style={styles.statsSection}>
                  <Text style={styles.sectionTitle}>Estadísticas</Text>
                  {renderStatBar('Daño', selectedWeapon.damage, 120)}
                  {renderStatBar('Alcance', selectedWeapon.range)}
                  {renderStatBar('Estabilidad', selectedWeapon.stability)}
                  {renderStatBar('Cadencia de Tiro', selectedWeapon.fireRate)}
                  {renderStatBar('Movilidad', selectedWeapon.mobility)}
                </View>

                {/* Pros and Cons */}
                <View style={styles.prosConsSection}>
                  <View style={styles.prosSection}>
                    <Text style={styles.prosTitle}>Ventajas</Text>
                    {selectedWeapon.pros.map((pro, index) => (
                      <View key={index} style={styles.proItem}>
                        <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                        <Text style={styles.proText}>{pro}</Text>
                      </View>
                    ))}
                  </View>
                  
                  <View style={styles.consSection}>
                    <Text style={styles.consTitle}>Desventajas</Text>
                    {selectedWeapon.cons.map((con, index) => (
                      <View key={index} style={styles.conItem}>
                        <Ionicons name="close-circle" size={16} color="#ef4444" />
                        <Text style={styles.conText}>{con}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Best Maps */}
                <View style={styles.mapsSection}>
                  <Text style={styles.sectionTitle}>Mejores Mapas</Text>
                  <View style={styles.mapsList}>
                    {selectedWeapon.bestMaps.map((map, index) => (
                      <View key={index} style={styles.mapBadge}>
                        <Text style={styles.mapText}>{map}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Attachments */}
                <View style={styles.attachmentsSection}>
                  <Text style={styles.sectionTitle}>Accesorios Recomendados</Text>
                  {selectedWeapon.attachments.map((attachment, index) => (
                    <View key={index} style={styles.attachmentItem}>
                      <View style={styles.attachmentInfo}>
                        <Text style={styles.attachmentName}>{attachment.name}</Text>
                        <Text style={styles.attachmentType}>{attachment.type}</Text>
                      </View>
                      <Text style={styles.attachmentEffect}>{attachment.effect}</Text>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </LinearGradient>
          )}
        </Modal>
      </LinearGradient>
    </Modal>
  );
}

const styles = {
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: 'white',
  },
  placeholder: {
    width: 40,
  },
  searchContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#374151',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    height: 48,
    color: 'white',
    fontSize: 16,
  },
  categoriesContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  categoryButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: '#374151',
  },
  categoryButtonActive: {
    backgroundColor: '#3b82f6',
  },
  categoryButtonText: {
    color: '#9ca3af',
    fontSize: 14,
    fontWeight: '500' as const,
  },
  categoryButtonTextActive: {
    color: 'white',
  },
  weaponsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  weaponCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden' as const,
  },
  weaponCardGradient: {
    padding: 16,
  },
  weaponHeader: {
    flexDirection: 'row' as const,
    marginBottom: 16,
  },
  weaponImage: {
    width: 80,
    height: 40,
    borderRadius: 8,
    marginRight: 16,
  },
  weaponInfo: {
    flex: 1,
  },
  weaponName: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: 'white',
    marginBottom: 4,
  },
  categoryBadge: {
    alignSelf: 'flex-start' as const,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginBottom: 4,
  },
  categoryText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600' as const,
  },
  ammoType: {
    color: '#9ca3af',
    fontSize: 14,
  },
  quickStats: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
  },
  quickStat: {
    alignItems: 'center' as const,
  },
  quickStatLabel: {
    color: '#9ca3af',
    fontSize: 12,
    marginBottom: 4,
  },
  quickStatValue: {
    fontSize: 16,
    fontWeight: 'bold' as const,
  },
  weaponDetail: {
    flex: 1,
    paddingHorizontal: 20,
  },
  weaponDetailHeader: {
    alignItems: 'center' as const,
    marginBottom: 32,
  },
  weaponDetailImage: {
    width: 200,
    height: 100,
    borderRadius: 12,
    marginBottom: 16,
  },
  weaponDetailInfo: {
    alignItems: 'center' as const,
  },
  weaponDetailName: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: 'white',
    marginBottom: 8,
  },
  weaponDescription: {
    color: '#9ca3af',
    fontSize: 16,
    textAlign: 'center' as const,
    marginTop: 8,
  },
  statsSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: 'white',
    marginBottom: 16,
  },
  statContainer: {
    marginBottom: 16,
  },
  statHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 8,
  },
  statLabel: {
    color: 'white',
    fontSize: 16,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold' as const,
  },
  statBarContainer: {
    height: 8,
    backgroundColor: '#374151',
    borderRadius: 4,
    overflow: 'hidden' as const,
  },
  statBar: {
    height: '100%' as any,
    borderRadius: 4,
  },
  prosConsSection: {
    flexDirection: 'row' as const,
    marginBottom: 32,
  },
  prosSection: {
    flex: 1,
    marginRight: 16,
  },
  consSection: {
    flex: 1,
  },
  prosTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#10b981',
    marginBottom: 12,
  },
  consTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#ef4444',
    marginBottom: 12,
  },
  proItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 8,
  },
  conItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 8,
  },
  proText: {
    color: 'white',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  conText: {
    color: 'white',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  mapsSection: {
    marginBottom: 32,
  },
  mapsList: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
  },
  mapBadge: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  mapText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500' as const,
  },
  attachmentsSection: {
    marginBottom: 32,
  },
  attachmentItem: {
    backgroundColor: '#374151',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  attachmentInfo: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 8,
  },
  attachmentName: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  attachmentType: {
    color: '#9ca3af',
    fontSize: 14,
    textTransform: 'capitalize' as const,
  },
  attachmentEffect: {
    color: '#10b981',
    fontSize: 14,
  },
};