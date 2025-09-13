import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { analyticsManager } from '../../lib/analytics';
import { useAnalytics } from '../../hooks/useAnalytics';
import { useMonitoring } from '../../hooks/useMonitoring';

interface AnalyticsConfigProps {
  onConfigChange?: (config: any) => void;
}

interface AnalyticsSettings {
  enabled: boolean;
  debugMode: boolean;
  autoTrackScreenViews: boolean;
  autoTrackAppLifecycle: boolean;
  collectCrashReports: boolean;
  collectPerformanceData: boolean;
  dataRetentionDays: number;
  batchSize: number;
  uploadInterval: number;
  enableUserTracking: boolean;
  enableLocationTracking: boolean;
  enableDeviceInfo: boolean;
}

const AnalyticsConfig: React.FC<AnalyticsConfigProps> = ({ onConfigChange }) => {
  const [settings, setSettings] = useState<AnalyticsSettings>({
    enabled: true,
    debugMode: false,
    autoTrackScreenViews: true,
    autoTrackAppLifecycle: true,
    collectCrashReports: true,
    collectPerformanceData: true,
    dataRetentionDays: 30,
    batchSize: 50,
    uploadInterval: 60,
    enableUserTracking: true,
    enableLocationTracking: false,
    enableDeviceInfo: true
  });

  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState<any>(null);

  const { trackEvent, getUserMetrics, getAnalyticsStatus } = useAnalytics({
    screenName: 'AnalyticsConfig',
    autoTrackScreenView: true
  });

  const { trackError } = useMonitoring({ screenName: 'AnalyticsConfig' });

  useEffect(() => {
    loadCurrentSettings();
    loadAnalyticsStatus();
    loadMetrics();
  }, []);

  const loadCurrentSettings = async () => {
    try {
      setLoading(true);
      // Aquí cargarías la configuración actual desde AsyncStorage o API
      // Por ahora usamos valores por defecto
      trackEvent('analytics_config_loaded');
    } catch (error) {
      console.error('Error loading analytics settings:', error);
      trackError(error as Error, 'load_analytics_settings');
    } finally {
      setLoading(false);
    }
  };

  const loadAnalyticsStatus = async () => {
    try {
      const currentStatus = getAnalyticsStatus();
      setStatus(currentStatus);
    } catch (error) {
      console.error('Error loading analytics status:', error);
      trackError(error as Error, 'load_analytics_status');
    }
  };

  const loadMetrics = async () => {
    try {
      const userMetrics = await getUserMetrics();
      setMetrics(userMetrics);
    } catch (error) {
      console.error('Error loading metrics:', error);
      trackError(error as Error, 'load_metrics');
    }
  };

  const updateSetting = (key: keyof AnalyticsSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    onConfigChange?.(newSettings);
    
    trackEvent('analytics_setting_changed', {
      setting: key,
      value: value,
      previous_value: settings[key]
    });
  };

  const saveSettings = async () => {
    try {
      setLoading(true);
      
      // Aquí guardarías la configuración en AsyncStorage o API
      // await AsyncStorage.setItem('analytics_settings', JSON.stringify(settings));
      
      // Aplicar configuración al analytics manager
      if (settings.enabled) {
        await analyticsManager.initialize();
      }
      
      Alert.alert('Éxito', 'Configuración de analytics guardada correctamente');
      trackEvent('analytics_config_saved', settings);
      
    } catch (error) {
      console.error('Error saving analytics settings:', error);
      trackError(error as Error, 'save_analytics_settings');
      Alert.alert('Error', 'No se pudo guardar la configuración');
    } finally {
      setLoading(false);
    }
  };

  const resetToDefaults = () => {
    Alert.alert(
      'Restablecer configuración',
      '¿Estás seguro de que quieres restablecer la configuración a los valores por defecto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Restablecer',
          style: 'destructive',
          onPress: () => {
            const defaultSettings: AnalyticsSettings = {
              enabled: true,
              debugMode: false,
              autoTrackScreenViews: true,
              autoTrackAppLifecycle: true,
              collectCrashReports: true,
              collectPerformanceData: true,
              dataRetentionDays: 30,
              batchSize: 50,
              uploadInterval: 60,
              enableUserTracking: true,
              enableLocationTracking: false,
              enableDeviceInfo: true
            };
            setSettings(defaultSettings);
            trackEvent('analytics_config_reset');
          }
        }
      ]
    );
  };

  const exportData = async () => {
    try {
      setLoading(true);
      const data = {
        settings,
        status,
        metrics,
        exportDate: new Date().toISOString()
      };
      
      // Aquí implementarías la exportación de datos
      console.log('Exported analytics data:', data);
      
      Alert.alert('Éxito', 'Datos de analytics exportados correctamente');
      trackEvent('analytics_data_exported');
      
    } catch (error) {
      console.error('Error exporting analytics data:', error);
      trackError(error as Error, 'export_analytics_data');
      Alert.alert('Error', 'No se pudieron exportar los datos');
    } finally {
      setLoading(false);
    }
  };

  const clearData = () => {
    Alert.alert(
      'Limpiar datos',
      '¿Estás seguro de que quieres eliminar todos los datos de analytics? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              // Aquí implementarías la limpieza de datos
              await analyticsManager.clearAllData();
              
              Alert.alert('Éxito', 'Datos de analytics eliminados correctamente');
              trackEvent('analytics_data_cleared');
              
              // Recargar métricas
              await loadMetrics();
              
            } catch (error) {
              console.error('Error clearing analytics data:', error);
              trackError(error as Error, 'clear_analytics_data');
              Alert.alert('Error', 'No se pudieron eliminar los datos');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const renderToggleSetting = (key: keyof AnalyticsSettings, title: string, description: string) => {
    if (typeof settings[key] !== 'boolean') return null;
    
    return (
      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>{title}</Text>
          <Text style={styles.settingDescription}>{description}</Text>
        </View>
        <Switch
          value={settings[key] as boolean}
          onValueChange={(value) => updateSetting(key, value)}
          trackColor={{ false: '#767577', true: '#007AFF' }}
          thumbColor={settings[key] ? '#fff' : '#f4f3f4'}
        />
      </View>
    );
  };

  const renderNumberSetting = (key: keyof AnalyticsSettings, title: string, description: string, unit?: string) => {
    if (typeof settings[key] !== 'number') return null;
    
    return (
      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>{title}</Text>
          <Text style={styles.settingDescription}>{description}</Text>
        </View>
        <View style={styles.numberInputContainer}>
          <TextInput
            style={styles.numberInput}
            value={String(settings[key])}
            onChangeText={(text) => {
              const value = parseInt(text) || 0;
              updateSetting(key, value);
            }}
            keyboardType="numeric"
            placeholder="0"
          />
          {unit && <Text style={styles.unitText}>{unit}</Text>}
        </View>
      </View>
    );
  };

  const renderStatusCard = () => {
    if (!status) return null;

    return (
      <View style={styles.statusCard}>
        <Text style={styles.sectionTitle}>Estado del Sistema</Text>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Estado:</Text>
          <View style={[styles.statusBadge, { backgroundColor: status.initialized ? '#4CAF50' : '#F44336' }]}>
            <Text style={styles.statusBadgeText}>
              {status.initialized ? 'Activo' : 'Inactivo'}
            </Text>
          </View>
        </View>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Eventos pendientes:</Text>
          <Text style={styles.statusValue}>{status.pendingEvents || 0}</Text>
        </View>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Última sincronización:</Text>
          <Text style={styles.statusValue}>
            {status.lastSync ? new Date(status.lastSync).toLocaleString() : 'Nunca'}
          </Text>
        </View>
      </View>
    );
  };

  const renderMetricsCard = () => {
    if (!metrics) return null;

    return (
      <View style={styles.metricsCard}>
        <Text style={styles.sectionTitle}>Métricas de Usuario</Text>
        <View style={styles.metricsGrid}>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{metrics.totalSessions || 0}</Text>
            <Text style={styles.metricLabel}>Sesiones totales</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{metrics.totalEvents || 0}</Text>
            <Text style={styles.metricLabel}>Eventos totales</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{metrics.averageSessionDuration || 0}s</Text>
            <Text style={styles.metricLabel}>Duración promedio</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{metrics.crashCount || 0}</Text>
            <Text style={styles.metricLabel}>Crashes</Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Cargando configuración...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Configuración de Analytics</Text>
        <Text style={styles.subtitle}>Gestiona la recopilación y análisis de datos</Text>
      </View>

      {renderStatusCard()}
      {renderMetricsCard()}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Configuración General</Text>
        
        {renderToggleSetting('enabled', 'Habilitar Analytics', 'Activa o desactiva la recopilación de datos')}
        {renderToggleSetting('debugMode', 'Modo Debug', 'Muestra logs detallados en desarrollo')}
        {renderToggleSetting('autoTrackScreenViews', 'Auto-tracking de pantallas', 'Rastrea automáticamente las vistas de pantalla')}
        {renderToggleSetting('autoTrackAppLifecycle', 'Auto-tracking del ciclo de vida', 'Rastrea eventos de apertura y cierre de la app')}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recopilación de Datos</Text>
        
        {renderToggleSetting('collectCrashReports', 'Reportes de crashes', 'Recopila información sobre errores y crashes')}
        {renderToggleSetting('collectPerformanceData', 'Datos de rendimiento', 'Recopila métricas de rendimiento de la app')}
        {renderToggleSetting('enableUserTracking', 'Tracking de usuarios', 'Rastrea comportamiento de usuarios individuales')}
        {renderToggleSetting('enableLocationTracking', 'Tracking de ubicación', 'Recopila datos de ubicación (requiere permisos)')}
        {renderToggleSetting('enableDeviceInfo', 'Información del dispositivo', 'Recopila información básica del dispositivo')}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Configuración Avanzada</Text>
        
        {renderNumberSetting('dataRetentionDays', 'Retención de datos', 'Días que se mantienen los datos localmente', 'días')}
        {renderNumberSetting('batchSize', 'Tamaño de lote', 'Número de eventos por lote de envío', 'eventos')}
        {renderNumberSetting('uploadInterval', 'Intervalo de subida', 'Frecuencia de envío de datos al servidor', 'segundos')}
      </View>

      <View style={styles.actionSection}>
        <TouchableOpacity style={styles.primaryButton} onPress={saveSettings} disabled={loading}>
          <Ionicons name="save-outline" size={20} color="white" />
          <Text style={styles.primaryButtonText}>Guardar Configuración</Text>
        </TouchableOpacity>

        <View style={styles.secondaryActions}>
          <TouchableOpacity style={styles.secondaryButton} onPress={resetToDefaults} disabled={loading}>
            <Ionicons name="refresh-outline" size={18} color="#007AFF" />
            <Text style={styles.secondaryButtonText}>Restablecer</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={exportData} disabled={loading}>
            <Ionicons name="download-outline" size={18} color="#007AFF" />
            <Text style={styles.secondaryButtonText}>Exportar</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.secondaryButton, styles.dangerButton]} onPress={clearData} disabled={loading}>
            <Ionicons name="trash-outline" size={18} color="#F44336" />
            <Text style={[styles.secondaryButtonText, styles.dangerButtonText]}>Limpiar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa'
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center'
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22
  },
  statusCard: {
    margin: 16,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  metricsCard: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  metricItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center'
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  statusLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500'
  },
  statusValue: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '600'
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12
  },
  statusBadgeText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600'
  },
  section: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  settingInfo: {
    flex: 1,
    marginRight: 16
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18
  },
  numberInputContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  numberInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    minWidth: 80,
    textAlign: 'center'
  },
  unitText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666'
  },
  actionSection: {
    margin: 16,
    marginTop: 0
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8
  },
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    marginHorizontal: 4
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4
  },
  dangerButton: {
    borderColor: '#F44336'
  },
  dangerButtonText: {
    color: '#F44336'
  }
});

export default AnalyticsConfig;