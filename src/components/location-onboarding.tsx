'use client';

import { useState, useEffect } from 'react';
import { usePermissions } from '@/hooks/use-permissions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  MapPin, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Navigation, 
  Settings,
  Info,
  ArrowRight,
  X
} from 'lucide-react';

interface LocationOnboardingProps {
  onComplete?: () => void;
  onSkip?: () => void;
  showSkip?: boolean;
}

type OnboardingStep = 'intro' | 'permission' | 'testing' | 'fallback' | 'complete';

export function LocationOnboarding({ 
  onComplete, 
  onSkip, 
  showSkip = true 
}: LocationOnboardingProps) {
  const {
    permissions,
    requestLocationPermission,
    getCurrentLocation,
    getLocationWithFallback,
    setManualLocationData
  } = usePermissions();
  
  const { isLoading, error } = permissions;
  
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('intro');
  const [isTestingLocation, setIsTestingLocation] = useState(false);
  const [locationTestResult, setLocationTestResult] = useState<any>(null);
  const [hasTriedPermission, setHasTriedPermission] = useState(false);

  const steps = {
    intro: { title: 'Configuración de Ubicación', progress: 20 },
    permission: { title: 'Permisos de Ubicación', progress: 40 },
    testing: { title: 'Probando Ubicación', progress: 60 },
    fallback: { title: 'Configuración Alternativa', progress: 80 },
    complete: { title: 'Configuración Completa', progress: 100 }
  };

  useEffect(() => {
    // Si ya tenemos permisos, saltar al paso de prueba
    if (permissions.location && currentStep === 'intro') {
      setCurrentStep('testing');
    }
  }, [permissions.location, currentStep]);

  const handleRequestPermission = async () => {
    setHasTriedPermission(true);
    try {
      await requestLocationPermission();
      if (permissions.location) {
        setCurrentStep('testing');
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
    }
  };

  const handleTestLocation = async () => {
    setIsTestingLocation(true);
    try {
      const location = await getCurrentLocation();
      setLocationTestResult({ success: true, data: location });
      setCurrentStep('complete');
    } catch (error) {
      setLocationTestResult({ success: false, error });
      setCurrentStep('fallback');
    } finally {
      setIsTestingLocation(false);
    }
  };

  const handleTestWithFallback = async () => {
    setIsTestingLocation(true);
    try {
      const location = await getLocationWithFallback();
      setLocationTestResult({ success: true, data: location });
      setCurrentStep('complete');
    } catch (error) {
      setLocationTestResult({ success: false, error });
    } finally {
      setIsTestingLocation(false);
    }
  };

  const handleComplete = () => {
    onComplete?.();
  };

  const handleSkip = () => {
    onSkip?.();
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'intro':
        return (
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <MapPin className="h-12 w-12 text-blue-500 mx-auto" />
              <h3 className="text-lg font-semibold">¡Bienvenido a SquadUp!</h3>
              <p className="text-sm text-muted-foreground">
                Para encontrar jugadores y partidos cerca de ti, necesitamos acceso a tu ubicación.
              </p>
            </div>
            
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Tu ubicación se usa únicamente para mostrarte contenido relevante de tu área.
                Nunca compartimos tu ubicación exacta con otros usuarios.
              </AlertDescription>
            </Alert>
            
            <div className="flex gap-2">
              <Button onClick={() => setCurrentStep('permission')} className="flex-1">
                <ArrowRight className="h-4 w-4 mr-2" />
                Continuar
              </Button>
              {showSkip && (
                <Button variant="outline" onClick={handleSkip}>
                  Omitir
                </Button>
              )}
            </div>
          </div>
        );

      case 'permission':
        return (
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center">
                {permissions.location ? (
                  <CheckCircle className="h-12 w-12 text-green-500" />
                ) : permissions.deniedPermanently.location ? (
                  <AlertCircle className="h-12 w-12 text-red-500" />
                ) : (
                  <MapPin className="h-12 w-12 text-orange-500" />
                )}
              </div>
              <h3 className="text-lg font-semibold">Permisos de Ubicación</h3>
              <p className="text-sm text-muted-foreground">
                {permissions.location 
                  ? '¡Perfecto! Ya tienes los permisos configurados.'
                  : permissions.deniedPermanently.location
                  ? 'Los permisos fueron denegados. Puedes habilitarlos en la configuración de tu dispositivo.'
                  : 'Necesitamos tu permiso para acceder a la ubicación.'
                }
              </p>
            </div>

            {permissions.deniedPermanently.location && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Para habilitar la ubicación, ve a la configuración de tu navegador o dispositivo
                  y permite el acceso a la ubicación para esta aplicación.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              {permissions.location ? (
                <Button onClick={() => setCurrentStep('testing')} className="flex-1">
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Probar Ubicación
                </Button>
              ) : permissions.deniedPermanently.location ? (
                <Button onClick={() => setCurrentStep('fallback')} className="flex-1">
                  <Settings className="h-4 w-4 mr-2" />
                  Configurar Manualmente
                </Button>
              ) : (
                <Button 
                  onClick={handleRequestPermission}
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <MapPin className="h-4 w-4 mr-2" />
                  )}
                  Solicitar Permiso
                </Button>
              )}
              
              {hasTriedPermission && !permissions.location && (
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentStep('fallback')}
                >
                  Configurar Manualmente
                </Button>
              )}
            </div>
          </div>
        );

      case 'testing':
        return (
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center">
                {isTestingLocation ? (
                  <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
                ) : locationTestResult?.success ? (
                  <CheckCircle className="h-12 w-12 text-green-500" />
                ) : locationTestResult ? (
                  <AlertCircle className="h-12 w-12 text-red-500" />
                ) : (
                  <Navigation className="h-12 w-12 text-blue-500" />
                )}
              </div>
              <h3 className="text-lg font-semibold">Probando Ubicación</h3>
              <p className="text-sm text-muted-foreground">
                {isTestingLocation 
                  ? 'Obteniendo tu ubicación actual...'
                  : locationTestResult?.success
                  ? '¡Ubicación obtenida correctamente!'
                  : locationTestResult
                  ? 'No pudimos obtener tu ubicación automáticamente.'
                  : 'Vamos a probar si podemos obtener tu ubicación.'
                }
              </p>
            </div>

            {locationTestResult?.success && locationTestResult.data && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm font-medium text-green-800 mb-1">Ubicación Detectada:</p>
                <p className="text-xs text-green-700">
                  {locationTestResult.data.locationInfo?.city || 'Ciudad no disponible'}
                </p>
                <p className="text-xs text-green-600">
                  Precisión: ±{Math.round(locationTestResult.data.accuracy)}m
                </p>
              </div>
            )}

            {locationTestResult && !locationTestResult.success && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Error: {locationTestResult.error?.message || 'No se pudo obtener la ubicación'}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              {!locationTestResult ? (
                <Button 
                  onClick={handleTestLocation}
                  disabled={isTestingLocation}
                  className="flex-1"
                >
                  {isTestingLocation ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Navigation className="h-4 w-4 mr-2" />
                  )}
                  Probar Ubicación
                </Button>
              ) : locationTestResult.success ? (
                <Button onClick={handleComplete} className="flex-1">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Finalizar
                </Button>
              ) : (
                <>
                  <Button 
                    onClick={handleTestWithFallback}
                    disabled={isTestingLocation}
                    className="flex-1"
                  >
                    {isTestingLocation ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Navigation className="h-4 w-4 mr-2" />
                    )}
                    Reintentar con Respaldo
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setCurrentStep('fallback')}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Manual
                  </Button>
                </>
              )}
            </div>
          </div>
        );

      case 'fallback':
        return (
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <Settings className="h-12 w-12 text-orange-500 mx-auto" />
              <h3 className="text-lg font-semibold">Configuración Manual</h3>
              <p className="text-sm text-muted-foreground">
                No te preocupes, puedes configurar tu ubicación manualmente.
              </p>
            </div>
            
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Puedes cambiar tu ubicación en cualquier momento desde la configuración.
              </AlertDescription>
            </Alert>
            
            <div className="flex gap-2">
              <Button onClick={() => setCurrentStep('complete')} className="flex-1">
                <ArrowRight className="h-4 w-4 mr-2" />
                Continuar sin Ubicación
              </Button>
              <Button variant="outline" onClick={handleSkip}>
                Configurar Después
              </Button>
            </div>
          </div>
        );

      case 'complete':
        return (
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
              <h3 className="text-lg font-semibold">¡Configuración Completa!</h3>
              <p className="text-sm text-muted-foreground">
                {locationTestResult?.success 
                  ? 'Tu ubicación está configurada y funcionando correctamente.'
                  : 'Puedes empezar a usar SquadUp. Recuerda que puedes configurar tu ubicación más tarde.'
                }
              </p>
            </div>
            
            <Button onClick={handleComplete} className="w-full">
              <CheckCircle className="h-4 w-4 mr-2" />
              Empezar a Usar SquadUp
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">{steps[currentStep].title}</CardTitle>
            <CardDescription className="text-xs">
              Paso {Object.keys(steps).indexOf(currentStep) + 1} de {Object.keys(steps).length}
            </CardDescription>
          </div>
          {showSkip && currentStep !== 'complete' && (
            <Button variant="ghost" size="sm" onClick={handleSkip}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <Progress value={steps[currentStep].progress} className="h-1" />
      </CardHeader>
      <CardContent>
        {renderStepContent()}
      </CardContent>
    </Card>
  );
}