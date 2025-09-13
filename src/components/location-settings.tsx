'use client';

import { useState, useEffect } from 'react';
import { usePermissions } from '@/hooks/use-permissions';
import { LocationStatus } from '@/components/location-status';
import { LocationOnboarding } from '@/components/location-onboarding';
import { ManualLocationSetup } from '@/components/manual-location-setup';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  MapPin, 
  Settings, 
  TestTube, 
  Info,
  CheckCircle,
  AlertCircle,
  Navigation,
  Clock,
  RefreshCw
} from 'lucide-react';

interface LocationSettingsProps {
  showOnboarding?: boolean;
  onOnboardingComplete?: () => void;
}

export function LocationSettings({ 
  showOnboarding = false, 
  onOnboardingComplete 
}: LocationSettingsProps) {
  const {
    permissions,
    requestLocationPermission,
    getCurrentLocation,
    getLocationWithFallback,
    setManualLocationData,
    getManualLocation,
    getCachedLocation,
    clearLocationCache,
    cachedLocation,
    manualLocation
  } = usePermissions();
  
  const { isLoading, error } = permissions;
  
  const [activeTab, setActiveTab] = useState('status');
  const [showOnboardingDialog, setShowOnboardingDialog] = useState(showOnboarding);
  const [locationHistory, setLocationHistory] = useState<any[]>([]);

  useEffect(() => {
    // Cargar historial de ubicaciones desde localStorage
    const savedHistory = localStorage.getItem('squadup_location_history');
    if (savedHistory) {
      try {
        setLocationHistory(JSON.parse(savedHistory));
      } catch (error) {
        console.error('Error loading location history:', error);
      }
    }
  }, []);

  const saveLocationToHistory = (location: any) => {
    const newEntry = {
      ...location,
      timestamp: Date.now(),
      id: Math.random().toString(36).substr(2, 9)
    };
    
    const updatedHistory = [newEntry, ...locationHistory.slice(0, 9)]; // Mantener solo 10 entradas
    setLocationHistory(updatedHistory);
    localStorage.setItem('squadup_location_history', JSON.stringify(updatedHistory));
  };

  const handleOnboardingComplete = () => {
    setShowOnboardingDialog(false);
    onOnboardingComplete?.();
  };

  const getLocationStatusSummary = () => {
    if (permissions.location) {
      const hasRecentLocation = cachedLocation && 
        cachedLocation.timestamp && 
        (Date.now() - cachedLocation.timestamp) < 3600000; // 1 hora
      
      return {
        status: 'good',
        icon: <CheckCircle className="h-4 w-4 text-green-500" />,
        title: 'Ubicación Configurada',
        description: hasRecentLocation 
          ? 'Ubicación reciente disponible'
          : 'Permisos concedidos, ubicación disponible'
      };
    }
    
    if (permissions.deniedPermanently.location) {
      const hasManual = manualLocation && manualLocation.city;
      return {
        status: 'warning',
        icon: <AlertCircle className="h-4 w-4 text-orange-500" />,
        title: 'Permisos Denegados',
        description: hasManual 
          ? 'Usando ubicación manual configurada'
          : 'Se requiere configuración manual'
      };
    }
    
    return {
      status: 'pending',
      icon: <MapPin className="h-4 w-4 text-blue-500" />,
      title: 'Configuración Pendiente',
      description: 'Permisos de ubicación no configurados'
    };
  };

  const formatLocationAge = (timestamp?: number) => {
    if (!timestamp) return 'Desconocido';
    const ageMs = Date.now() - timestamp;
    const ageMinutes = Math.floor(ageMs / 60000);
    
    if (ageMinutes < 1) return 'Ahora mismo';
    if (ageMinutes < 60) return `Hace ${ageMinutes} minutos`;
    const ageHours = Math.floor(ageMinutes / 60);
    if (ageHours < 24) return `Hace ${ageHours} horas`;
    const ageDays = Math.floor(ageHours / 24);
    return `Hace ${ageDays} días`;
  };

  const statusSummary = getLocationStatusSummary();

  if (showOnboardingDialog) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <LocationOnboarding 
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingComplete}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumen de estado */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {statusSummary.icon}
              <div>
                <CardTitle className="text-base">{statusSummary.title}</CardTitle>
                <CardDescription className="text-xs">
                  {statusSummary.description}
                </CardDescription>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowOnboardingDialog(true)}
            >
              <Settings className="h-4 w-4 mr-1" />
              Configurar
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs de configuración */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="status" className="text-xs">
            <MapPin className="h-3 w-3 mr-1" />
            Estado
          </TabsTrigger>
          <TabsTrigger value="manual" className="text-xs">
            <Settings className="h-3 w-3 mr-1" />
            Manual
          </TabsTrigger>
          <TabsTrigger value="test" className="text-xs">
            <TestTube className="h-3 w-3 mr-1" />
            Pruebas
          </TabsTrigger>
          <TabsTrigger value="history" className="text-xs">
            <Clock className="h-3 w-3 mr-1" />
            Historial
          </TabsTrigger>
        </TabsList>

        <TabsContent value="status" className="space-y-4">
          <LocationStatus />
        </TabsContent>

        <TabsContent value="manual" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Configuración Manual</CardTitle>
              <CardDescription className="text-xs">
                Configura tu ubicación manualmente cuando el GPS no esté disponible
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ManualLocationSetup />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pruebas de Ubicación</CardTitle>
              <CardDescription className="text-xs">
                Herramientas para diagnosticar problemas de ubicación
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={async () => {
                    try {
                      const location = await getCurrentLocation();
                      saveLocationToHistory(location);
                    } catch (error) {
                      console.error('Test failed:', error);
                    }
                  }}
                  disabled={isLoading}
                >
                  <Navigation className="h-3 w-3 mr-1" />
                  GPS
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={async () => {
                    try {
                      const location = await getLocationWithFallback();
                      saveLocationToHistory(location);
                    } catch (error) {
                      console.error('Fallback test failed:', error);
                    }
                  }}
                  disabled={isLoading}
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Respaldo
                </Button>
              </div>
              
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    {error}
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="text-xs text-muted-foreground">
                <p>• GPS: Prueba la ubicación directa</p>
                <p>• Respaldo: Prueba con mecanismos de respaldo</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Historial de Ubicaciones</CardTitle>
              <CardDescription className="text-xs">
                Últimas ubicaciones obtenidas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {locationHistory.length === 0 ? (
                <div className="text-center py-4">
                  <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">
                    No hay historial de ubicaciones
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {locationHistory.map((entry) => (
                    <div 
                      key={entry.id}
                      className="flex items-center justify-between p-2 bg-muted rounded text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          {entry.source === 'gps' && <Navigation className="h-3 w-3 text-green-500" />}
                          {entry.source === 'manual' && <Settings className="h-3 w-3 text-orange-500" />}
                          {entry.source === 'cached' && <Clock className="h-3 w-3 text-gray-500" />}
                          {entry.source === 'network' && <MapPin className="h-3 w-3 text-blue-500" />}
                        </div>
                        <div>
                          <p className="font-medium">
                            {entry.locationInfo?.city || 'Ciudad desconocida'}
                          </p>
                          <p className="text-muted-foreground">
                            ±{Math.round(entry.accuracy)}m
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-muted-foreground">
                          {formatLocationAge(entry.timestamp)}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {entry.source || 'unknown'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  
                  {locationHistory.length > 0 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        setLocationHistory([]);
                        localStorage.removeItem('squadup_location_history');
                      }}
                      className="w-full text-xs"
                    >
                      Limpiar Historial
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Información adicional */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription className="text-xs">
          Tu ubicación se usa para encontrar jugadores y partidos cerca de ti. 
          Puedes cambiar estos ajustes en cualquier momento.
        </AlertDescription>
      </Alert>
    </div>
  );
}