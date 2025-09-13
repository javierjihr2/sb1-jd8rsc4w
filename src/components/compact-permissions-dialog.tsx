'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { usePermissions } from '@/hooks/use-permissions';
import { MapPin, Camera, Mic, X, CheckCircle, XCircle, Loader2, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CompactPermissionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: (allGranted: boolean) => void;
  onClose?: () => void;
}

export function CompactPermissionsDialog({ 
  open, 
  onOpenChange, 
  onComplete,
  onClose
}: CompactPermissionsDialogProps) {
  const { 
    permissions, 
    requestLocationPermission, 
    requestCameraPermission, 
    requestMicrophonePermission 
  } = usePermissions();
  
  const [isRequesting, setIsRequesting] = useState<{
    location: boolean;
    camera: boolean;
    microphone: boolean;
  }>({ location: false, camera: false, microphone: false });
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const permissionItems = [
    {
      icon: MapPin,
      title: 'Ubicación',
      description: 'Encuentra jugadores cercanos',
      status: permissions.location,
      request: requestLocationPermission,
      key: 'location' as const,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 hover:bg-blue-100'
    },
    {
      icon: Camera,
      title: 'Cámara',
      description: 'Comparte capturas épicas',
      status: permissions.camera,
      request: requestCameraPermission,
      key: 'camera' as const,
      color: 'text-green-500',
      bgColor: 'bg-green-50 hover:bg-green-100'
    },
    {
      icon: Mic,
      title: 'Micrófono',
      description: 'Coordinación rápida',
      status: permissions.microphone,
      request: requestMicrophonePermission,
      key: 'microphone' as const,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50 hover:bg-orange-100'
    }
  ];

  const handleRequestPermission = async (item: typeof permissionItems[0]) => {
    setIsRequesting(prev => ({ ...prev, [item.key]: true }));
    
    try {
      const granted = await item.request();
      if (granted) {
        // Verificar si todos los permisos están otorgados
        const allGranted = permissions.location && permissions.camera && permissions.microphone;
        if (allGranted) {
          timeoutRef.current = setTimeout(() => {
            onComplete?.(true);
            onOpenChange(false);
          }, 1000) as unknown as number;
        }
      }
    } catch (error) {
      console.error(`Error requesting ${item.key} permission:`, error);
    } finally {
      setIsRequesting(prev => ({ ...prev, [item.key]: false }));
    }
  };

  const handleClose = () => {
    onClose?.();
    onOpenChange(false);
  };

  const openAppSettings = () => {
    if (typeof window !== 'undefined') {
      alert('Para habilitar permisos:\n\n1. Haz clic en el ícono de candado en la barra de direcciones\n2. Selecciona "Permitir" para los permisos necesarios\n3. Recarga la página');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 gap-0">
        {/* Header compacto con botón X */}
        <DialogHeader className="p-4 pb-2 relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="absolute right-2 top-2 h-8 w-8 p-0 hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </Button>
          <DialogTitle className="text-lg font-semibold text-center pr-8">
            Permisos para Match PUBGM
          </DialogTitle>
        </DialogHeader>

        {/* Mensaje informativo compacto */}
        <div className="px-4 pb-2">
          <Alert className="border-blue-200 bg-blue-50 py-2">
            <AlertTriangle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800 text-sm">
              <strong>Solo lo necesario:</strong> Puedes usar SquadGO sin todos los permisos, pero algunas funciones estarán limitadas.
            </AlertDescription>
          </Alert>
        </div>

        {/* Lista compacta de permisos */}
        <div className="px-4 space-y-2">
          {permissionItems.map((item) => {
            const Icon = item.icon;
            const isDeniedPermanently = permissions.deniedPermanently?.[item.key];
            
            return (
              <div key={item.key} className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                item.status 
                  ? 'border-green-200 bg-green-50' 
                  : `border-gray-200 ${item.bgColor}`
              }`}>
                <div className="flex items-center gap-3 flex-1">
                  <div className={`p-2 rounded-lg ${
                    item.status 
                      ? 'bg-green-100 text-green-600' 
                      : `bg-white ${item.color}`
                  }`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{item.title}</h4>
                    <p className="text-xs text-gray-600">{item.description}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {item.status ? (
                    <div className="flex items-center gap-1 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-xs font-medium">Activo</span>
                    </div>
                  ) : (
                    <>
                      {isDeniedPermanently ? (
                        <Button
                          onClick={openAppSettings}
                          size="sm"
                          variant="outline"
                          className="h-8 px-3 text-xs"
                        >
                          Configurar
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleRequestPermission(item)}
                          disabled={isRequesting[item.key]}
                          size="sm"
                          className={`h-8 px-3 text-xs ${item.color.replace('text-', 'bg-').replace('-500', '-500')} hover:${item.color.replace('text-', 'bg-').replace('-500', '-600')} text-white`}
                        >
                          {isRequesting[item.key] ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            'Activar'
                          )}
                        </Button>
                      )}
                      <XCircle className="h-4 w-4 text-gray-400" />
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer compacto */}
        <div className="p-4 pt-2">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1 h-9 text-sm"
            >
              Continuar sin permisos
            </Button>
            {(permissions.location || permissions.camera || permissions.microphone) && (
              <Button
                onClick={() => {
                  onComplete?.(true);
                  onOpenChange(false);
                }}
                className="flex-1 h-9 text-sm bg-green-500 hover:bg-green-600"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Continuar
              </Button>
            )}
          </div>
          
          <p className="text-xs text-gray-500 text-center mt-2">
            🔒 Puedes cambiar estos permisos en cualquier momento
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}