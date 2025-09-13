'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePermissions } from '@/hooks/use-permissions';
import { MapPin, Camera, Mic, Shield, CheckCircle, XCircle, Loader2, Info, Users, MessageSquare, Settings, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PermissionPrimer } from './permission-primer';

interface PermissionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requiredPermissions?: string[];
  title?: string;
  description?: string;
  onComplete?: (allGranted: boolean) => void;
}

export function PermissionsDialog({ 
  open, 
  onOpenChange, 
  onComplete 
}: PermissionsDialogProps) {
  const { permissions, requestAllPermissions, requestLocationPermission, requestCameraPermission, requestMicrophonePermission } = usePermissions();
  const [isRequesting, setIsRequesting] = useState(false);
  const [step, setStep] = useState<'intro' | 'requesting' | 'complete'>('intro');
  const [showPrimer, setShowPrimer] = useState<{
    isOpen: boolean;
    type: 'location' | 'camera' | 'microphone' | 'all';
  }>({ isOpen: false, type: 'all' });

  const permissionItems = [
    {
      icon: MapPin,
      title: 'Ubicación Precisa',
      description: 'Encuentra jugadores cercanos y únete a partidas locales',
      benefit: 'Conecta con jugadores en tu área y descubre eventos locales',
      example: 'Como en Pokémon GO, te ayudamos a encontrar la comunidad gaming más cercana',
      status: permissions.location,
      request: requestLocationPermission,
      required: true,
      category: 'social'
    },
    {
      icon: Camera,
      title: 'Cámara',
      description: 'Captura y comparte tus mejores momentos de juego',
      benefit: 'Comparte capturas épicas y crea contenido para tu equipo',
      example: 'Igual que Instagram, pero para tus victorias gaming',
      status: permissions.camera,
      request: requestCameraPermission,
      required: false,
      category: 'content'
    },
    {
      icon: Mic,
      title: 'Micrófono',
      description: 'Comunícate con tu equipo mediante mensajes de voz',
      benefit: 'Coordinación rápida y efectiva durante las partidas',
      example: 'Como WhatsApp, pero optimizado para gaming',
      status: permissions.microphone,
      request: requestMicrophonePermission,
      required: false,
      category: 'communication'
    }
  ];

  const allPermissionsGranted = permissions.location && permissions.camera && permissions.microphone;

  useEffect(() => {
    if (allPermissionsGranted && step === 'requesting') {
      setStep('complete');
      const timeoutId = setTimeout(() => {
        onComplete?.(true);
        onOpenChange(false);
      }, 2000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [allPermissionsGranted, step, onComplete, onOpenChange]);

  const handleRequestAll = async () => {
    // Mostrar primer explicativo antes de solicitar todos los permisos
    if (!Object.values(permissions.hasAskedBefore || {}).some(asked => asked)) {
      setShowPrimer({ isOpen: true, type: 'all' });
      return;
    }
    
    setIsRequesting(true);
    setStep('requesting');
    
    try {
      const allGranted = await requestAllPermissions();
      if (!allGranted) {
        setStep('intro');
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
      setStep('intro');
    } finally {
      setIsRequesting(false);
    }
  };

  const handleRequestIndividual = async (type: 'location' | 'camera' | 'microphone') => {
    // Mostrar primer explicativo si es la primera vez que se solicita este permiso
    if (!permissions.hasAskedBefore?.[type]) {
      setShowPrimer({ isOpen: true, type });
      return;
    }
    
    setIsRequesting(true);
    
    switch (type) {
      case 'location':
        await requestLocationPermission();
        break;
      case 'camera':
        await requestCameraPermission();
        break;
      case 'microphone':
        await requestMicrophonePermission();
        break;
    }
    
    setIsRequesting(false);
  };

  const handlePrimerContinue = async () => {
    setShowPrimer({ isOpen: false, type: 'all' });
    
    if (showPrimer.type === 'all') {
      setIsRequesting(true);
      setStep('requesting');
      
      try {
        const allGranted = await requestAllPermissions();
        if (!allGranted) {
          setStep('intro');
        }
      } catch (error) {
        console.error('Error requesting permissions:', error);
        setStep('intro');
      } finally {
        setIsRequesting(false);
      }
    } else {
      setIsRequesting(true);
      
      switch (showPrimer.type) {
        case 'location':
          await requestLocationPermission();
          break;
        case 'camera':
          await requestCameraPermission();
          break;
        case 'microphone':
          await requestMicrophonePermission();
          break;
      }
      
      setIsRequesting(false);
    }
  };

  const handlePrimerClose = () => {
    setShowPrimer({ isOpen: false, type: 'all' });
  };

  const openAppSettings = () => {
    if (typeof window !== 'undefined') {
      // En web, mostrar instrucciones para habilitar permisos
      alert('Para habilitar permisos:\n\n1. Haz clic en el ícono de candado en la barra de direcciones\n2. Selecciona "Permitir" para los permisos necesarios\n3. Recarga la página');
    }
    // En móvil, Capacitor puede abrir la configuración de la app
  };

  const handleSkip = () => {
    onComplete?.(false);
    onOpenChange(false);
  };

  if (step === 'requesting') {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
            <DialogTitle>Configurando Permisos</DialogTitle>
            <DialogDescription className="text-center">
            Configurando tus preferencias de privacidad...
          </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3">
            {permissionItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.title}</p>
                  </div>
                  {item.status ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (step === 'complete') {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <DialogTitle>¡Permisos Configurados!</DialogTitle>
            <DialogDescription>
              Todos los permisos han sido configurados correctamente. ¡Ya puedes disfrutar de todas las funciones de SquadGO!
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <PermissionPrimer
        isOpen={showPrimer.isOpen}
        onClose={handlePrimerClose}
        onContinue={handlePrimerContinue}
        permissionType={showPrimer.type}
      />
      
      <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center text-xl font-bold">Personaliza tu Experiencia</DialogTitle>
          <DialogDescription className="text-center text-base">
            Elige qué funciones quieres activar para una experiencia gaming optimizada
          </DialogDescription>
        </DialogHeader>

        <Alert className="border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Solo pedimos lo que necesitas:</strong> Puedes usar SquadGO sin todos los permisos, pero algunas funciones estarán limitadas.
          </AlertDescription>
        </Alert>

        {permissions.error && (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              {permissions.error}
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          {permissionItems.map((item, index) => {
            const Icon = item.icon;
            const categoryIcons = {
              social: Users,
              content: Camera,
              communication: MessageSquare
            };
            const CategoryIcon = categoryIcons[item.category as keyof typeof categoryIcons];
            
            return (
              <div key={index} className={`group relative overflow-hidden rounded-xl border-2 transition-all duration-200 ${
                item.status 
                  ? 'border-green-200 bg-green-50/50' 
                  : 'border-gray-200 bg-white hover:border-primary/30 hover:shadow-md'
              }`}>
                <div className="flex items-start gap-4 p-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl transition-colors ${
                    item.status 
                      ? 'bg-green-100 text-green-600' 
                      : 'bg-primary/10 text-primary group-hover:bg-primary/20'
                  }`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-gray-900">{item.title}</h4>
                      <CategoryIcon className="h-4 w-4 text-gray-400" />
                      {item.required ? (
                        <Badge variant="destructive" className="text-xs">
                          Esencial
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          Opcional
                        </Badge>
                      )}
                      {item.status ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600">{item.description}</p>
                    <p className="text-xs text-primary font-medium">{item.benefit}</p>
                    <p className="text-xs text-gray-500 italic">{item.example}</p>
                    
                    {!item.status && (
                      (() => {
                         const typeMap: Record<string, 'location' | 'camera' | 'microphone'> = {
                           'Ubicación Precisa': 'location',
                           'Cámara': 'camera',
                           'Micrófono': 'microphone'
                         };
                         return permissions.deniedPermanently?.[typeMap[item.title]];
                       })() ? (
                        <Button
                          onClick={openAppSettings}
                          size="sm"
                          variant="outline"
                          className="mt-3 w-full sm:w-auto"
                        >
                          <Settings className="h-3 w-3 mr-2" />
                          Configuración
                        </Button>
                      ) : (
                        <Button
                          variant={item.required ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                             const typeMap: Record<string, 'location' | 'camera' | 'microphone'> = {
                               'Ubicación Precisa': 'location',
                               'Cámara': 'camera',
                               'Micrófono': 'microphone'
                             };
                             handleRequestIndividual(typeMap[item.title]);
                           }}
                          disabled={isRequesting}
                          className="mt-3 w-full sm:w-auto"
                        >
                          {isRequesting ? (
                            <Loader2 className="h-3 w-3 animate-spin mr-2" />
                          ) : (
                            <Icon className="h-3 w-3 mr-2" />
                          )}
                          {(() => {
                             const typeMap: Record<string, 'location' | 'camera' | 'microphone'> = {
                               'Ubicación Precisa': 'location',
                               'Cámara': 'camera',
                               'Micrófono': 'microphone'
                             };
                             return permissions.hasAskedBefore?.[typeMap[item.title]] ? 'Reintentar' : (item.required ? 'Activar Ahora' : 'Activar (Opcional)');
                           })()}
                        </Button>
                      )
                    )}
                    
                    {item.status && (
                      <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                        <CheckCircle className="h-4 w-4" />
                        ¡Activado! Ya puedes usar esta función
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="space-y-3 pt-4">
          {!allPermissionsGranted && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.values(permissions.deniedPermanently || {}).some(denied => denied) ? (
                <Button
                  onClick={openAppSettings}
                  className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Abrir Configuración
                </Button>
              ) : (
                <Button
                  onClick={handleRequestAll}
                  disabled={isRequesting}
                  className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                >
                  {isRequesting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Shield className="h-4 w-4 mr-2" />
                  )}
                  {Object.values(permissions.hasAskedBefore || {}).some(asked => asked) ? 'Reintentar Todos' : 'Activar Todo'}
                </Button>
              )}
              
              <Button
                variant="outline"
                onClick={handleSkip}
                disabled={isRequesting}
                className="w-full"
              >
                Continuar sin permisos
              </Button>
            </div>
          )}
          
          {allPermissionsGranted && (
            <Button
              disabled
              className="w-full bg-green-100 text-green-800 hover:bg-green-100"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              ¡Configuración Completa!
            </Button>
          )}
        </div>

        <div className="bg-gray-50 rounded-lg p-3 mt-4">
          <div className="flex items-start gap-2">
            <Shield className="h-4 w-4 text-gray-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-gray-600">
              <p className="font-medium mb-1">Tu privacidad es nuestra prioridad</p>
              <p>• Los permisos se pueden cambiar en cualquier momento</p>
              <p>• Solo accedemos cuando usas la función específica</p>
              <p>• Nunca compartimos tu información personal</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}