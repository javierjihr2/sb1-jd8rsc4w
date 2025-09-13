'use client';

import { useState } from 'react';
import { usePermissions } from '@/hooks/use-permissions';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, AlertCircle, CheckCircle, Loader2, RefreshCw, Navigation } from 'lucide-react';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  locationInfo?: {
    city?: string;
    region?: string;
    country?: string;
  } | null;
  source?: 'gps' | 'network' | 'manual' | 'cached';
  timestamp?: number;
}

export function LocationStatus() {
  const { 
    permissions, 
    requestLocationPermission, 
    getCurrentLocation
  } = usePermissions();
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);

  const handleRequestPermission = async () => {
    try {
      const granted = await requestLocationPermission();
      if (granted) {
        console.log('Permiso de ubicación concedido');
      }
    } catch (error) {
      console.error('Error solicitando permiso:', error);
    }
  };

  const handleGetLocation = async () => {
    setIsGettingLocation(true);
    setLocationError(null);
    
    try {
      console.log('🔍 Iniciando obtención de ubicación...');
      
      // Verificar si geolocation está disponible
      if (!('geolocation' in navigator)) {
        throw new Error('Geolocalización no disponible en este navegador');
      }
      
      // Verificar primero si tenemos permisos
      if (!permissions.location) {
        console.log('📍 Solicitando permisos de ubicación...');
        const granted = await requestLocationPermission();
        if (!granted) {
          throw new Error('Se requiere permiso de ubicación para continuar');
        }
      }
      
      console.log('✅ Permisos concedidos, obteniendo ubicación...');
      const location = await getCurrentLocation();
      setCurrentLocation(location);
      setLocationError(null);
      console.log('🎯 Ubicación obtenida exitosamente:', location);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al obtener ubicación';
      console.error('❌ Error obteniendo ubicación:', errorMessage);
      setLocationError(errorMessage);
      setCurrentLocation(null);
    } finally {
      setIsGettingLocation(false);
    }
  };
  
  const startRealTimeLocation = () => {
    if (!('geolocation' in navigator)) {
      setLocationError('Geolocalización no disponible');
      return;
    }
    
    console.log('🔄 Iniciando ubicación en tiempo real...');
    
    const id = navigator.geolocation.watchPosition(
      (position) => {
        console.log('📍 Nueva ubicación en tiempo real:', position);
        const locationData: LocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          source: 'gps',
          timestamp: Date.now()
        };
        setCurrentLocation(locationData);
        setLocationError(null);
      },
      (error) => {
        let errorMessage = 'Error en ubicación en tiempo real';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Permiso de ubicación denegado';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Ubicación no disponible';
            break;
          case error.TIMEOUT:
            errorMessage = 'Tiempo de espera agotado';
            break;
        }
        console.error('❌ Error en tiempo real:', errorMessage);
        setLocationError(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000 // 1 minuto
      }
    );
    
    setWatchId(id);
  };
  
  const stopRealTimeLocation = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
      console.log('⏹️ Ubicación en tiempo real detenida');
    }
  };



  const getPermissionStatus = () => {
    if (permissions.isLoading) {
      return {
        icon: <Loader2 className="h-4 w-4 animate-spin text-blue-500" />,
        text: 'Verificando permisos...',
        badge: <Badge variant="secondary">Cargando</Badge>
      };
    }
    
    if (permissions.location) {
      return {
        icon: <CheckCircle className="h-4 w-4 text-green-500" />,
        text: 'Permiso concedido',
        badge: <Badge variant="default" className="bg-green-500">Activo</Badge>
      };
    }
    
    if (permissions.deniedPermanently.location) {
      return {
        icon: <AlertCircle className="h-4 w-4 text-red-500" />,
        text: 'Permiso denegado permanentemente',
        badge: <Badge variant="destructive">Bloqueado</Badge>
      };
    }
    
    return {
      icon: <AlertCircle className="h-4 w-4 text-orange-500" />,
      text: 'Permiso no concedido',
      badge: <Badge variant="outline">Pendiente</Badge>
    };
  };



  const status = getPermissionStatus();

  return (
    <Card className="w-full max-w-sm">
      <CardContent className="p-4 space-y-3">
        {/* Estado compacto */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {status.icon}
            <span className="text-sm font-medium">Localización</span>
          </div>
          {status.badge}
        </div>

        {/* Ubicación actual */}
         {currentLocation && (
           <div className="bg-green-50 border border-green-200 rounded-md p-2">
             <div className="flex items-center justify-between text-xs">
               <span className="font-medium text-green-800">
                 {currentLocation.locationInfo?.city || 'Localización obtenida'}
               </span>
               <div className="flex items-center gap-1">
                 <Navigation className="h-3 w-3 text-green-600" />
                 <span className="text-green-600">Localización</span>
               </div>
             </div>
           </div>
         )}

        {/* Error compacto */}
        {(permissions.error || locationError) && (
          <div className="text-xs text-red-600 bg-red-50 border border-red-200 p-3 rounded space-y-1">
            <div className="font-medium">⚠️ Problema de Ubicación</div>
            <div className="whitespace-pre-line">{locationError || permissions.error}</div>
            {permissions.deniedPermanently.location && (
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800">
                <div className="font-medium">💡 Solución rápida:</div>
                <div>1. Busca el ícono 🔒 o 📍 en la barra de direcciones</div>
                <div>2. Haz clic y selecciona "Permitir ubicación"</div>
                <div>3. Recarga la página (F5)</div>
              </div>
            )}
          </div>
        )}

        {/* Botones GPS únicamente */}
         <div className="space-y-2">
           <div className="flex gap-2">
             {!permissions.location && !permissions.deniedPermanently.location && (
               <Button 
                 onClick={handleRequestPermission}
                 disabled={permissions.isLoading}
                 size="sm"
                 className="flex-1"
               >
                 {permissions.isLoading ? (
                   <Loader2 className="h-3 w-3 animate-spin mr-1" />
                 ) : (
                   <MapPin className="h-3 w-3 mr-1" />
                 )}
                 Activar Ubicación
               </Button>
             )}
             
             {permissions.location && (
               <Button 
                 onClick={handleGetLocation}
                 disabled={isGettingLocation}
                 size="sm"
                 className="flex-1"
               >
                 {isGettingLocation ? (
                   <Loader2 className="h-3 w-3 animate-spin mr-1" />
                 ) : (
                   <Navigation className="h-3 w-3 mr-1" />
                 )}
                 {currentLocation ? 'Actualizar Ubicación' : 'Obtener Ubicación'}
               </Button>
             )}
           </div>
           
           {permissions.location && (
              <div className="flex gap-2">
                {watchId === null ? (
                  <Button 
                    onClick={startRealTimeLocation}
                    size="sm"
                    variant="outline"
                    className="flex-1"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Tiempo Real
                  </Button>
                ) : (
                  <Button 
                    onClick={stopRealTimeLocation}
                    size="sm"
                    variant="destructive"
                    className="flex-1"
                  >
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Detener
                  </Button>
                )}
              </div>
            )}
            
            {permissions.deniedPermanently.location && (
              <Button 
                onClick={() => window.location.reload()}
                size="sm"
                variant="outline"
                className="w-full"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Recargar Página
              </Button>
            )}
         </div>

         {/* Ayuda para permisos denegados */}
         {permissions.deniedPermanently.location && (
           <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 p-2 rounded">
             Ve a configuración del navegador para permitir localización
           </div>
         )}
      </CardContent>
    </Card>
  );
}