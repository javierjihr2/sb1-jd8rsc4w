import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  Image,
  Dimensions,
  Alert,
  TextInput,
  Share
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContextSimple';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WeaponStats from '../../components/WeaponStats';
import RankingSystem from '../../components/RankingSystem';

const { width } = Dimensions.get('window');

interface LandingZone {
  id: string;
  name: string;
  coordinates: { x: number; y: number };
  risk: 'low' | 'medium' | 'high';
  loot: 'low' | 'medium' | 'high';
  description: string;
}

interface MapData {
  id: string;
  name: string;
  image: string;
  landingZones: LandingZone[];
}

interface Strategy {
  id: string;
  mapId: string;
  name: string;
  landingZone: string;
  rotationPlan: string;
  notes: string;
  isPublic: boolean;
  createdAt: string;
}

const mapsData: MapData[] = [
  {
    id: 'erangel',
    name: 'Erangel',
    image: 'https://via.placeholder.com/400x400/2c5530/ffffff?text=Erangel',
    landingZones: [
      { id: 'pochinki', name: 'Pochinki', coordinates: { x: 50, y: 45 }, risk: 'high', loot: 'high', description: 'Ciudad central con mucho loot pero muy peligrosa' },
      { id: 'school', name: 'School', coordinates: { x: 45, y: 50 }, risk: 'high', loot: 'medium', description: 'Zona de combate intenso, ideal para práctica' },
      { id: 'military', name: 'Military Base', coordinates: { x: 25, y: 85 }, risk: 'high', loot: 'high', description: 'Mejor loot del mapa, pero muy competida' },
      { id: 'georgopol', name: 'Georgopol', coordinates: { x: 30, y: 25 }, risk: 'medium', loot: 'high', description: 'Ciudad grande con buen loot y menos riesgo' },
      { id: 'yasnaya', name: 'Yasnaya Polyana', coordinates: { x: 65, y: 35 }, risk: 'medium', loot: 'medium', description: 'Zona equilibrada para equiparse' },
      { id: 'primorsk', name: 'Primorsk', coordinates: { x: 15, y: 65 }, risk: 'low', loot: 'medium', description: 'Zona costera tranquila para inicio seguro' }
    ]
  },
  {
    id: 'miramar',
    name: 'Miramar',
    image: 'https://via.placeholder.com/400x400/8b4513/ffffff?text=Miramar',
    landingZones: [
      { id: 'pecado', name: 'Pecado', coordinates: { x: 45, y: 55 }, risk: 'high', loot: 'high', description: 'Casino y arena, zona de alto riesgo' },
      { id: 'hacienda', name: 'Hacienda del Patrón', coordinates: { x: 35, y: 25 }, risk: 'high', loot: 'high', description: 'Complejo grande con excelente loot' },
      { id: 'losleones', name: 'Los Leones', coordinates: { x: 65, y: 70 }, risk: 'medium', loot: 'high', description: 'Ciudad grande en el sur del mapa' },
      { id: 'prison', name: 'Prison de Los Leones', coordinates: { x: 75, y: 75 }, risk: 'medium', loot: 'medium', description: 'Complejo de prisión con loot decente' },
      { id: 'powerplant', name: 'Power Plant', coordinates: { x: 25, y: 75 }, risk: 'low', loot: 'medium', description: 'Zona industrial con loot garantizado' }
    ]
  },
  {
    id: 'sanhok',
    name: 'Sanhok',
    image: 'https://via.placeholder.com/400x400/228b22/ffffff?text=Sanhok',
    landingZones: [
      { id: 'bootcamp', name: 'Bootcamp', coordinates: { x: 50, y: 50 }, risk: 'high', loot: 'high', description: 'Centro del mapa, combate garantizado' },
      { id: 'paradise', name: 'Paradise Resort', coordinates: { x: 30, y: 30 }, risk: 'high', loot: 'high', description: 'Resort de lujo con excelente equipamiento' },
      { id: 'ruins', name: 'Ruins', coordinates: { x: 70, y: 40 }, risk: 'medium', loot: 'medium', description: 'Ruinas antiguas con loot disperso' },
      { id: 'quarry', name: 'Quarry', coordinates: { x: 40, y: 70 }, risk: 'low', loot: 'medium', description: 'Cantera con loot industrial' },
      { id: 'kampong', name: 'Kampong', coordinates: { x: 60, y: 20 }, risk: 'low', loot: 'low', description: 'Pueblo pequeño para inicio tranquilo' }
    ]
  },
  {
    id: 'vikendi',
    name: 'Vikendi',
    image: 'https://via.placeholder.com/400x400/87ceeb/ffffff?text=Vikendi',
    landingZones: [
      { id: 'volnova', name: 'Volnova', coordinates: { x: 45, y: 35 }, risk: 'high', loot: 'high', description: 'Ciudad principal del mapa nevado' },
      { id: 'cosmodrome', name: 'Cosmodrome', coordinates: { x: 25, y: 25 }, risk: 'high', loot: 'high', description: 'Base espacial con loot único' },
      { id: 'castle', name: 'Castle', coordinates: { x: 65, y: 45 }, risk: 'medium', loot: 'high', description: 'Castillo medieval con buen loot' },
      { id: 'cement', name: 'Cement Factory', coordinates: { x: 35, y: 65 }, risk: 'medium', loot: 'medium', description: 'Fábrica industrial con equipamiento' },
      { id: 'dobro', name: 'Dobro Mesto', coordinates: { x: 70, y: 70 }, risk: 'low', loot: 'medium', description: 'Pueblo tranquilo en las montañas' }
    ]
  },
  {
    id: 'livik',
    name: 'Livik',
    image: 'https://via.placeholder.com/400x400/ff6347/ffffff?text=Livik',
    landingZones: [
      { id: 'blomster', name: 'Blomster', coordinates: { x: 40, y: 40 }, risk: 'high', loot: 'high', description: 'Centro urbano del mapa pequeño' },
      { id: 'iceborg', name: 'Iceborg', coordinates: { x: 60, y: 30 }, risk: 'medium', loot: 'high', description: 'Zona helada con buen equipamiento' },
      { id: 'lumber', name: 'Lumber Yard', coordinates: { x: 30, y: 60 }, risk: 'medium', loot: 'medium', description: 'Aserradero con loot industrial' },
      { id: 'midtstein', name: 'Midtstein', coordinates: { x: 70, y: 60 }, risk: 'low', loot: 'medium', description: 'Pueblo costero tranquilo' },
      { id: 'crabgrass', name: 'Crabgrass', coordinates: { x: 50, y: 70 }, risk: 'low', loot: 'low', description: 'Zona rural para inicio seguro' }
    ]
  },
  {
    id: 'karakin',
    name: 'Karakin',
    image: 'https://via.placeholder.com/400x400/daa520/ffffff?text=Karakin',
    landingZones: [
      { id: 'alazhar', name: 'Al Azhar', coordinates: { x: 45, y: 45 }, risk: 'high', loot: 'high', description: 'Ciudad central del desierto' },
      { id: 'blackzone', name: 'Black Zone', coordinates: { x: 30, y: 30 }, risk: 'high', loot: 'medium', description: 'Zona de bombardeo con túneles' },
      { id: 'bahr', name: 'Bahr Sahir', coordinates: { x: 60, y: 35 }, risk: 'medium', loot: 'medium', description: 'Complejo urbano mediano' },
      { id: 'towers', name: 'Towers', coordinates: { x: 35, y: 65 }, risk: 'medium', loot: 'high', description: 'Torres de comunicación' },
      { id: 'quarry_k', name: 'Quarry', coordinates: { x: 65, y: 65 }, risk: 'low', loot: 'medium', description: 'Cantera del desierto' }
    ]
  }
];

const getRiskColor = (risk: string) => {
  switch (risk) {
    case 'high': return '#FF5252';
    case 'medium': return '#FF9800';
    case 'low': return '#4CAF50';
    default: return '#666';
  }
};

const getLootColor = (loot: string) => {
  switch (loot) {
    case 'high': return '#FFD700';
    case 'medium': return '#FFA500';
    case 'low': return '#CD853F';
    default: return '#666';
  }
};

export default function Maps() {
  const { user } = useAuth();
  const [selectedMap, setSelectedMap] = useState<MapData>(mapsData[0]);
  const [selectedZone, setSelectedZone] = useState<LandingZone | null>(null);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [showStrategyModal, setShowStrategyModal] = useState(false);
  const [showWeaponStats, setShowWeaponStats] = useState(false);
  const [showRankings, setShowRankings] = useState(false);
  const [newStrategy, setNewStrategy] = useState({
    name: '',
    landingZone: '',
    rotationPlan: '',
    notes: '',
    isPublic: false
  });

  useEffect(() => {
    loadStrategies();
  }, []);

  const loadStrategies = async () => {
    try {
      const saved = await AsyncStorage.getItem('mapStrategies');
      if (saved) {
        setStrategies(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading strategies:', error);
    }
  };

  const saveStrategy = async () => {
    if (!newStrategy.name.trim() || !newStrategy.landingZone) {
      Alert.alert('Error', 'Completa todos los campos requeridos');
      return;
    }

    const strategy: Strategy = {
      id: Date.now().toString(),
      mapId: selectedMap.id,
      name: newStrategy.name.trim(),
      landingZone: newStrategy.landingZone,
      rotationPlan: newStrategy.rotationPlan,
      notes: newStrategy.notes,
      isPublic: newStrategy.isPublic,
      createdAt: new Date().toISOString()
    };

    const updated = [...strategies, strategy];
    setStrategies(updated);
    await AsyncStorage.setItem('mapStrategies', JSON.stringify(updated));
    
    setShowStrategyModal(false);
    setNewStrategy({ name: '', landingZone: '', rotationPlan: '', notes: '', isPublic: false });
    Alert.alert('Éxito', 'Estrategia guardada correctamente');
  };

  const shareStrategy = async (strategy: Strategy) => {
    try {
      await Share.share({
        message: `Estrategia para ${selectedMap.name}:\n\nNombre: ${strategy.name}\nZona: ${strategy.landingZone}\nPlan: ${strategy.rotationPlan}\nNotas: ${strategy.notes}`,
        title: `Estrategia: ${strategy.name}`
      });
    } catch (error) {
      console.error('Error sharing strategy:', error);
    }
  };

  const deleteStrategy = async (strategyId: string) => {
    Alert.alert(
      'Confirmar',
      '¿Estás seguro de que quieres eliminar esta estrategia?',
      [
        { text: 'Cancelar', style: 'cancel' as const },
        {
          text: 'Eliminar',
          style: 'destructive' as const,
          onPress: async () => {
            const updated = strategies.filter(s => s.id !== strategyId);
            setStrategies(updated);
            await AsyncStorage.setItem('mapStrategies', JSON.stringify(updated));
          }
        }
      ]
    );
  };

  const renderLandingZone = (zone: LandingZone) => {
    const isSelected = selectedZone?.id === zone.id;
    return (
      <TouchableOpacity
        key={zone.id}
        onPress={() => setSelectedZone(isSelected ? null : zone)}
        style={{
          position: 'absolute' as const,
          left: `${zone.coordinates.x}%`,
          top: `${zone.coordinates.y}%`,
          transform: [{ translateX: -12 }, { translateY: -12 }],
          width: 24,
          height: 24,
          borderRadius: 12,
          backgroundColor: isSelected ? '#FFD700' : getRiskColor(zone.risk),
          borderWidth: 2,
          borderColor: '#fff',
          justifyContent: 'center' as const,
          alignItems: 'center' as const
        }}
      >
        <View style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: '#fff'
        }} />
      </TouchableOpacity>
    );
  };

  const mapStrategies = strategies.filter(s => s.mapId === selectedMap.id);

  return (
    <LinearGradient
      colors={['#0f0f23', '#1a1a2e', '#16213e']}
      style={{ flex: 1 }}
    >
      <ScrollView style={{ flex: 1, padding: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>Estrategias de Mapas</Text>
          <TouchableOpacity
            onPress={() => setShowStrategyModal(true)}
            style={{ backgroundColor: '#4CAF50', padding: 12, borderRadius: 8 }}
          >
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* PUBG Mobile Features */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>Características PUBG Mobile</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <TouchableOpacity
              onPress={() => setShowWeaponStats(true)}
              style={{
                flex: 1,
                backgroundColor: '#1f2937',
                padding: 16,
                borderRadius: 12,
                marginRight: 8,
                alignItems: 'center'
              }}
            >
              <LinearGradient
                colors={['#3b82f6', '#1d4ed8']}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 8
                }}
              >
                <Ionicons name="flash" size={20} color="white" />
              </LinearGradient>
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600', textAlign: 'center' }}>Estadísticas de Armas</Text>
              <Text style={{ color: '#9ca3af', fontSize: 12, textAlign: 'center', marginTop: 4 }}>Daño, alcance y accesorios</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowRankings(true)}
              style={{
                flex: 1,
                backgroundColor: '#1f2937',
                padding: 16,
                borderRadius: 12,
                marginLeft: 8,
                alignItems: 'center'
              }}
            >
              <LinearGradient
                colors={['#f59e0b', '#d97706']}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 8
                }}
              >
                <Ionicons name="trophy" size={20} color="white" />
              </LinearGradient>
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600', textAlign: 'center' }}>Rankings</Text>
              <Text style={{ color: '#9ca3af', fontSize: 12, textAlign: 'center', marginTop: 4 }}>Clasificaciones y estadísticas</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Selector de Mapas */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
          {mapsData.map((map) => (
            <TouchableOpacity
              key={map.id}
              onPress={() => {
                setSelectedMap(map);
                setSelectedZone(null);
              }}
              style={{
                marginRight: 12,
                padding: 12,
                borderRadius: 12,
                backgroundColor: selectedMap.id === map.id ? '#4CAF50' : '#1a1a1a',
                minWidth: 100
              }}
            >
              <Text style={{
                color: selectedMap.id === map.id ? '#fff' : '#ccc',
                textAlign: 'center',
                fontWeight: selectedMap.id === map.id ? 'bold' : 'normal'
              }}>
                {map.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Mapa Interactivo */}
        <View style={{ backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, marginBottom: 20 }}>
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>
            {selectedMap.name}
          </Text>
          <View style={{
            width: width - 64,
            height: width - 64,
            backgroundColor: '#333',
            borderRadius: 8,
            position: 'relative',
            overflow: 'hidden'
          }}>
            <Image
              source={{ uri: selectedMap.image }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
            {selectedMap.landingZones.map(renderLandingZone)}
          </View>
          
          {/* Leyenda */}
          <View style={{ marginTop: 16 }}>
            <Text style={{ color: '#fff', fontWeight: 'bold', marginBottom: 8 }}>Leyenda:</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#FF5252', marginRight: 6 }} />
                <Text style={{ color: '#ccc', fontSize: 12 }}>Alto Riesgo</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#FF9800', marginRight: 6 }} />
                <Text style={{ color: '#ccc', fontSize: 12 }}>Riesgo Medio</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#4CAF50', marginRight: 6 }} />
                <Text style={{ color: '#ccc', fontSize: 12 }}>Bajo Riesgo</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Información de Zona Seleccionada */}
        {selectedZone && (
          <View style={{ backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, marginBottom: 20 }}>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>
              {selectedZone.name}
            </Text>
            <Text style={{ color: '#ccc', marginBottom: 12 }}>{selectedZone.description}</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ color: '#ccc', fontSize: 12 }}>Riesgo</Text>
                <View style={{
                  backgroundColor: getRiskColor(selectedZone.risk),
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 4,
                  marginTop: 4
                }}>
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>
                    {selectedZone.risk.toUpperCase()}
                  </Text>
                </View>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ color: '#ccc', fontSize: 12 }}>Loot</Text>
                <View style={{
                  backgroundColor: getLootColor(selectedZone.loot),
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 4,
                  marginTop: 4
                }}>
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>
                    {selectedZone.loot.toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Estrategias Guardadas */}
        {mapStrategies.length > 0 && (
          <View style={{ backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16 }}>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>Estrategias para {selectedMap.name}</Text>
            {mapStrategies.map((strategy) => (
              <View key={strategy.id} style={{
                backgroundColor: '#333',
                padding: 12,
                borderRadius: 8,
                marginBottom: 12
              }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Text style={{ color: '#fff', fontWeight: 'bold', flex: 1 }}>{strategy.name}</Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity onPress={() => shareStrategy(strategy)}>
                      <Ionicons name="share" size={16} color="#4CAF50" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => deleteStrategy(strategy.id)}>
                      <Ionicons name="trash" size={16} color="#FF5252" />
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={{ color: '#4CAF50', fontSize: 12, marginBottom: 4 }}>Zona: {strategy.landingZone}</Text>
                {strategy.rotationPlan && (
                  <Text style={{ color: '#ccc', fontSize: 12, marginBottom: 4 }}>Plan: {strategy.rotationPlan}</Text>
                )}
                {strategy.notes && (
                  <Text style={{ color: '#ccc', fontSize: 12 }}>Notas: {strategy.notes}</Text>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Modal para Nueva Estrategia */}
      <Modal visible={showStrategyModal} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 }}>
          <View style={{ backgroundColor: '#1a1a1a', borderRadius: 12, padding: 20, maxHeight: '80%' }}>
            <ScrollView>
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>Nueva Estrategia para {selectedMap.name}</Text>
              
              <Text style={{ color: '#ccc', marginBottom: 8 }}>Nombre de la Estrategia *</Text>
              <TextInput
                style={{
                  backgroundColor: '#333',
                  color: '#fff',
                  padding: 12,
                  borderRadius: 8,
                  marginBottom: 16
                }}
                placeholder="Ej: Rush Pochinki"
                placeholderTextColor="#666"
                value={newStrategy.name}
                onChangeText={(text) => setNewStrategy(prev => ({ ...prev, name: text }))}
              />

              <Text style={{ color: '#ccc', marginBottom: 8 }}>Zona de Aterrizaje *</Text>
              <View style={{ marginBottom: 16 }}>
                {selectedMap.landingZones.map((zone) => (
                  <TouchableOpacity
                    key={zone.id}
                    onPress={() => setNewStrategy(prev => ({ ...prev, landingZone: zone.name }))}
                    style={{
                      backgroundColor: newStrategy.landingZone === zone.name ? '#4CAF50' : '#333',
                      padding: 12,
                      borderRadius: 8,
                      marginBottom: 8,
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <Text style={{ color: '#fff' }}>{zone.name}</Text>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <View style={{
                        backgroundColor: getRiskColor(zone.risk),
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        borderRadius: 4
                      }}>
                        <Text style={{ color: '#fff', fontSize: 10 }}>{zone.risk}</Text>
                      </View>
                      <View style={{
                        backgroundColor: getLootColor(zone.loot),
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        borderRadius: 4
                      }}>
                        <Text style={{ color: '#fff', fontSize: 10 }}>{zone.loot}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={{ color: '#ccc', marginBottom: 8 }}>Plan de Rotación</Text>
              <TextInput
                style={{
                  backgroundColor: '#333',
                  color: '#fff',
                  padding: 12,
                  borderRadius: 8,
                  marginBottom: 16,
                  height: 80
                }}
                placeholder="Describe tu plan de movimiento por el mapa"
                placeholderTextColor="#666"
                value={newStrategy.rotationPlan}
                onChangeText={(text) => setNewStrategy(prev => ({ ...prev, rotationPlan: text }))}
                multiline
                textAlignVertical="top"
              />

              <Text style={{ color: '#ccc', marginBottom: 8 }}>Notas Adicionales</Text>
              <TextInput
                style={{
                  backgroundColor: '#333',
                  color: '#fff',
                  padding: 12,
                  borderRadius: 8,
                  marginBottom: 16,
                  height: 80
                }}
                placeholder="Consejos, equipamiento recomendado, etc."
                placeholderTextColor="#666"
                value={newStrategy.notes}
                onChangeText={(text) => setNewStrategy(prev => ({ ...prev, notes: text }))}
                multiline
                textAlignVertical="top"
              />

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
                <TouchableOpacity
                  onPress={() => setShowStrategyModal(false)}
                  style={{ backgroundColor: '#666', padding: 12, borderRadius: 8, flex: 1, marginRight: 8 }}
                >
                  <Text style={{ color: '#fff', textAlign: 'center' }}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={saveStrategy}
                  style={{ backgroundColor: '#4CAF50', padding: 12, borderRadius: 8, flex: 1, marginLeft: 8 }}
                >
                  <Text style={{ color: '#fff', textAlign: 'center' }}>Guardar</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Weapon Stats Modal */}
      <WeaponStats 
        visible={showWeaponStats} 
        onClose={() => setShowWeaponStats(false)} 
      />

      {/* Rankings Modal */}
      <RankingSystem 
        visible={showRankings} 
        onClose={() => setShowRankings(false)} 
      />
    </LinearGradient>
  );
}