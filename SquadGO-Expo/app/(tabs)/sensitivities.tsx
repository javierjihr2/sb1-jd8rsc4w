import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
  Share,
  Clipboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContextSimple';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ScopeSettings {
  tpp: number;
  fpp: number;
  redDot: number;
  scope2x: number;
  scope3x: number;
  scope4x: number;
  scope6x: number;
  scope8x: number;
}

interface Sensitivity {
  camera: ScopeSettings;
  ads: ScopeSettings;
  gyroscope: ScopeSettings;
  code: string;
}

interface SavedSensitivity {
  id: string;
  userGivenName: string;
  isPublic: boolean;
  settings: Sensitivity;
  analysis: {
    suggestedName: string;
    playStyle: string;
    tacticalAnalysis: string;
    recommendedWeapons: string[];
  };
  code: string;
}

const emptyScope: ScopeSettings = {
  tpp: 0,
  fpp: 0,
  redDot: 0,
  scope2x: 0,
  scope3x: 0,
  scope4x: 0,
  scope6x: 0,
  scope8x: 0
};

const initialSettings: Sensitivity = {
  camera: { ...emptyScope },
  ads: { ...emptyScope },
  gyroscope: { ...emptyScope },
  code: ''
};

const scopeLabels: { [key: string]: string } = {
  tpp: "3ra Persona (TPP)",
  fpp: "1ra Persona (FPP)",
  redDot: "Punto Rojo, Holo",
  scope2x: "Mira 2x",
  scope3x: "Mira 3x",
  scope4x: "Mira 4x",
  scope6x: "Mira 6x",
  scope8x: "Mira 8x",
};

export default function Sensitivities() {
  const { user, profile } = useAuth();
  const [currentSettings, setCurrentSettings] = useState<Sensitivity>(initialSettings);
  const [savedSensitivities, setSavedSensitivities] = useState<SavedSensitivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'camera' | 'ads' | 'gyroscope'>('camera');
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [codeInput, setCodeInput] = useState('');

  useEffect(() => {
    loadSavedSensitivities();
  }, []);

  const loadSavedSensitivities = async () => {
    try {
      const saved = await AsyncStorage.getItem('savedSensitivities');
      if (saved) {
        setSavedSensitivities(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading sensitivities:', error);
    }
  };

  const saveSensitivities = async () => {
    try {
      await AsyncStorage.setItem('savedSensitivities', JSON.stringify(savedSensitivities));
    } catch (error) {
      console.error('Error saving sensitivities:', error);
    }
  };

  const determinePlayStyle = (settings: Sensitivity): string => {
    const avgCamera = Object.values(settings.camera).reduce((a, b) => a + b, 0) / Object.values(settings.camera).length;
    const avgAds = Object.values(settings.ads).reduce((a, b) => a + b, 0) / Object.values(settings.ads).length;
    
    if (avgCamera > 80 && avgAds > 60) return "Agresivo/Rusheo";
    if (avgCamera < 40 && avgAds < 30) return "Defensivo/Sniper";
    if (avgCamera > 60 && avgAds < 40) return "Híbrido";
    return "Balanceado";
  };

  const generateDetailedAnalysis = (settings: Sensitivity): string => {
    const avgCamera = Object.values(settings.camera).reduce((a, b) => a + b, 0) / Object.values(settings.camera).length;
    const avgAds = Object.values(settings.ads).reduce((a, b) => a + b, 0) / Object.values(settings.ads).length;
    
    let analysis = "Esta configuración ";
    
    if (avgCamera > 70) {
      analysis += "favorece movimientos rápidos de cámara, ideal para combates CQC y rotaciones dinámicas. ";
    } else if (avgCamera < 40) {
      analysis += "prioriza la precisión con movimientos de cámara controlados, perfecta para combates a larga distancia. ";
    } else {
      analysis += "mantiene un equilibrio entre velocidad y precisión en los movimientos de cámara. ";
    }
    
    if (avgAds > 50) {
      analysis += "Las sensibilidades ADS permiten seguimiento rápido de objetivos en movimiento.";
    } else {
      analysis += "Las sensibilidades ADS están optimizadas para máxima precisión en tiros de larga distancia.";
    }
    
    return analysis;
  };

  const getRecommendedWeapons = (settings: Sensitivity): string[] => {
    const avgCamera = Object.values(settings.camera).reduce((a, b) => a + b, 0) / Object.values(settings.camera).length;
    const avgAds = Object.values(settings.ads).reduce((a, b) => a + b, 0) / Object.values(settings.ads).length;
    
    if (avgCamera > 70 && avgAds > 50) {
      return ["AKM", "Beryl M762", "UMP45", "Vector"];
    } else if (avgCamera < 40 && avgAds < 30) {
      return ["Kar98k", "M24", "AWM", "Mini14"];
    } else {
      return ["M416", "SCAR-L", "M16A4", "QBZ"];
    }
  };

  const generateCode = (settings: Sensitivity): string => {
    const allValues = [
      ...Object.values(settings.camera),
      ...Object.values(settings.ads),
      ...Object.values(settings.gyroscope)
    ];
    return allValues.join('-');
  };

  const parseCode = (code: string): Sensitivity | null => {
    try {
      const values = code.split('-').map(Number);
      if (values.length !== 24) return null;
      
      const camera = {
        tpp: values[0], fpp: values[1], redDot: values[2], scope2x: values[3],
        scope3x: values[4], scope4x: values[5], scope6x: values[6], scope8x: values[7]
      };
      const ads = {
        tpp: values[8], fpp: values[9], redDot: values[10], scope2x: values[11],
        scope3x: values[12], scope4x: values[13], scope6x: values[14], scope8x: values[15]
      };
      const gyroscope = {
        tpp: values[16], fpp: values[17], redDot: values[18], scope2x: values[19],
        scope3x: values[20], scope4x: values[21], scope6x: values[22], scope8x: values[23]
      };
      
      return { camera, ads, gyroscope, code };
    } catch {
      return null;
    }
  };

  const handleSaveSensitivity = async () => {
    if (!saveName.trim()) {
      Alert.alert('Error', 'Ingresa un nombre para la configuración');
      return;
    }

    const code = generateCode(currentSettings);
    const newSensitivity: SavedSensitivity = {
      id: Date.now().toString(),
      userGivenName: saveName.trim(),
      isPublic,
      settings: { ...currentSettings, code },
      analysis: {
        suggestedName: `Config ${determinePlayStyle(currentSettings)}`,
        playStyle: determinePlayStyle(currentSettings),
        tacticalAnalysis: generateDetailedAnalysis(currentSettings),
        recommendedWeapons: getRecommendedWeapons(currentSettings)
      },
      code
    };

    const updated = [...savedSensitivities, newSensitivity];
    setSavedSensitivities(updated);
    await AsyncStorage.setItem('savedSensitivities', JSON.stringify(updated));
    
    setShowSaveModal(false);
    setSaveName('');
    setIsPublic(false);
    Alert.alert('Éxito', 'Configuración guardada correctamente');
  };

  const handleLoadCode = () => {
    const parsed = parseCode(codeInput);
    if (parsed) {
      setCurrentSettings(parsed);
      setShowCodeModal(false);
      setCodeInput('');
      Alert.alert('Éxito', 'Configuración cargada correctamente');
    } else {
      Alert.alert('Error', 'Código inválido');
    }
  };

  const handleShareCode = async () => {
    const code = generateCode(currentSettings);
    try {
      await Share.share({
        message: `Mi configuración de sensibilidades PUBG Mobile: ${code}`,
        title: 'Configuración de Sensibilidades'
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const updateSetting = (category: 'camera' | 'ads' | 'gyroscope', scope: string, value: string) => {
    const numValue = Math.max(0, Math.min(100, parseInt(value) || 0));
    setCurrentSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [scope]: numValue
      }
    }));
  };

  const renderScopeTable = (category: 'camera' | 'ads' | 'gyroscope') => {
    const data = currentSettings[category];
    const categoryTitles = {
      camera: 'Cámara',
      ads: 'ADS (Apuntar)',
      gyroscope: 'Giroscopio'
    };

    return (
      <View style={{ backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>
          {categoryTitles[category]}
        </Text>
        {Object.entries(data).map(([scope, value]) => (
          <View key={scope} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ color: '#ccc', flex: 1 }}>{scopeLabels[scope]}</Text>
            <TextInput
              style={{
                backgroundColor: '#333',
                color: '#fff',
                padding: 8,
                borderRadius: 8,
                width: 80,
                textAlign: 'center'
              }}
              value={value.toString()}
              onChangeText={(text) => updateSetting(category, scope, text)}
              keyboardType="numeric"
              maxLength={3}
              accessibilityLabel={`Sensibilidad ${scopeLabels[scope]}`}
              accessibilityHint={`Ajusta el valor de sensibilidad para ${scopeLabels[scope]}`}
            />
          </View>
        ))}
      </View>
    );
  };

  return (
    <LinearGradient
      colors={['#0f0f23', '#1a1a2e', '#16213e']}
      style={{ flex: 1 }}
    >
      <ScrollView style={{ flex: 1, padding: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>Sensibilidades</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              onPress={() => setShowCodeModal(true)}
              accessibilityRole="button"
              accessibilityLabel="Cargar código"
              accessibilityHint="Abre el modal para cargar configuración desde código"
              style={{ backgroundColor: '#4CAF50', padding: 12, borderRadius: 8 }}
            >
              <Ionicons name="code" size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleShareCode}
              accessibilityRole="button"
              accessibilityLabel="Compartir código"
              accessibilityHint="Comparte el código de tu configuración actual"
              style={{ backgroundColor: '#2196F3', padding: 12, borderRadius: 8 }}
            >
              <Ionicons name="share" size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowSaveModal(true)}
              accessibilityRole="button"
              accessibilityLabel="Guardar configuración"
              accessibilityHint="Abre el modal para guardar la configuración actual"
              style={{ backgroundColor: '#FF9800', padding: 12, borderRadius: 8 }}
            >
              <Ionicons name="save" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Tabs */}
        <View style={{ flexDirection: 'row', marginBottom: 20, backgroundColor: '#1a1a1a', borderRadius: 12, padding: 4 }}>
          {(['camera', 'ads', 'gyroscope'] as const).map((category) => (
            <TouchableOpacity
              key={category}
              onPress={() => setActiveCategory(category)}
              accessibilityRole="tab"
              accessibilityLabel={category === 'camera' ? 'Cámara' : category === 'ads' ? 'ADS' : 'Giroscopio'}
              accessibilityHint={`Cambia a la configuración de ${category === 'camera' ? 'cámara' : category === 'ads' ? 'ADS' : 'giroscopio'}`}
              accessibilityState={{ selected: activeCategory === category }}
              style={{
                flex: 1,
                padding: 12,
                borderRadius: 8,
                backgroundColor: activeCategory === category ? '#4CAF50' : 'transparent'
              }}
            >
              <Text style={{
                color: activeCategory === category ? '#fff' : '#ccc',
                textAlign: 'center',
                fontWeight: activeCategory === category ? 'bold' : 'normal'
              }}>
                {category === 'camera' ? 'Cámara' : category === 'ads' ? 'ADS' : 'Giroscopio'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {renderScopeTable(activeCategory)}

        {/* Análisis */}
        <View style={{ backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>Análisis</Text>
          <Text style={{ color: '#4CAF50', fontSize: 16, marginBottom: 8 }}>Estilo: {determinePlayStyle(currentSettings)}</Text>
          <Text style={{ color: '#ccc', lineHeight: 20, marginBottom: 12 }}>{generateDetailedAnalysis(currentSettings)}</Text>
          <Text style={{ color: '#fff', fontWeight: 'bold', marginBottom: 8 }}>Armas Recomendadas:</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {getRecommendedWeapons(currentSettings).map((weapon, index) => (
              <View key={index} style={{ backgroundColor: '#333', padding: 8, borderRadius: 6 }}>
                <Text style={{ color: '#fff', fontSize: 12 }}>{weapon}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Configuraciones Guardadas */}
        {savedSensitivities.length > 0 && (
          <View style={{ backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16 }}>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>Configuraciones Guardadas</Text>
            {savedSensitivities.map((sensitivity) => (
              <TouchableOpacity
                key={sensitivity.id}
                onPress={() => setCurrentSettings(sensitivity.settings)}
                accessibilityRole="button"
                accessibilityLabel={`Cargar configuración ${sensitivity.userGivenName}`}
                accessibilityHint={`Carga la configuración guardada con estilo ${sensitivity.analysis.playStyle}`}
                style={{
                  backgroundColor: '#333',
                  padding: 12,
                  borderRadius: 8,
                  marginBottom: 8,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#fff', fontWeight: 'bold' }}>{sensitivity.userGivenName}</Text>
                  <Text style={{ color: '#4CAF50', fontSize: 12 }}>{sensitivity.analysis.playStyle}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Modal para guardar */}
      <Modal visible={showSaveModal} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 }}>
          <View style={{ backgroundColor: '#1a1a1a', borderRadius: 12, padding: 20 }}>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>Guardar Configuración</Text>
            <TextInput
              style={{
                backgroundColor: '#333',
                color: '#fff',
                padding: 12,
                borderRadius: 8,
                marginBottom: 16
              }}
              placeholder="Nombre de la configuración"
              placeholderTextColor="#666"
              value={saveName}
              onChangeText={setSaveName}
              accessibilityLabel="Nombre de la configuración"
              accessibilityHint="Ingresa un nombre para guardar esta configuración"
            />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
              <TouchableOpacity
                onPress={() => setShowSaveModal(false)}
                accessibilityRole="button"
                accessibilityLabel="Cancelar"
                accessibilityHint="Cierra el modal sin guardar"
                style={{ backgroundColor: '#666', padding: 12, borderRadius: 8, flex: 1, marginRight: 8 }}
              >
                <Text style={{ color: '#fff', textAlign: 'center' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveSensitivity}
                accessibilityRole="button"
                accessibilityLabel="Guardar"
                accessibilityHint="Guarda la configuración actual con el nombre especificado"
                style={{ backgroundColor: '#4CAF50', padding: 12, borderRadius: 8, flex: 1, marginLeft: 8 }}
              >
                <Text style={{ color: '#fff', textAlign: 'center' }}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal para código */}
      <Modal visible={showCodeModal} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 }}>
          <View style={{ backgroundColor: '#1a1a1a', borderRadius: 12, padding: 20 }}>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>Cargar desde Código</Text>
            <TextInput
              style={{
                backgroundColor: '#333',
                color: '#fff',
                padding: 12,
                borderRadius: 8,
                marginBottom: 16
              }}
              placeholder="Pega el código aquí"
              placeholderTextColor="#666"
              value={codeInput}
              accessibilityLabel="Código de configuración"
              accessibilityHint="Pega aquí el código de configuración que quieres cargar"
              onChangeText={setCodeInput}
              multiline
            />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
              <TouchableOpacity
                onPress={() => setShowCodeModal(false)}
                accessibilityRole="button"
                accessibilityLabel="Cancelar"
                accessibilityHint="Cierra el modal sin cargar código"
                style={{ backgroundColor: '#666', padding: 12, borderRadius: 8, flex: 1, marginRight: 8 }}
              >
                <Text style={{ color: '#fff', textAlign: 'center' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleLoadCode}
                accessibilityRole="button"
                accessibilityLabel="Cargar"
                accessibilityHint="Carga la configuración desde el código ingresado"
                style={{ backgroundColor: '#4CAF50', padding: 12, borderRadius: 8, flex: 1, marginLeft: 8 }}
              >
                <Text style={{ color: '#fff', textAlign: 'center' }}>Cargar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}