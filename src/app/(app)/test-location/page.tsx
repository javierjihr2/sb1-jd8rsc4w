'use client';

import { useState } from 'react';
import { usePermissions } from '@/hooks/use-permissions';
import { LocationSettings } from '@/components/location-settings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, AlertCircle, CheckCircle, Loader2, RefreshCw, TestTube, Navigation, Clock, Info, Settings, ArrowLeft } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';

interface LocationTest {
  id: string;
  name: string;
  status: 'pending' | 'success' | 'error';
  result?: any;
  error?: string;
  duration?: number;
}

export default function TestLocationPage() {
  const { permissions, requestLocationPermission, getCurrentLocation } = usePermissions();
  const [tests, setTests] = useState<LocationTest[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [activeTab, setActiveTab] = useState('settings');

  const addTest = (test: Omit<LocationTest, 'id'>) => {
    const newTest = { ...test, id: Date.now().toString() };
    setTests(prev => [...prev, newTest]);
    return newTest.id;
  };

  const updateTest = (id: string, updates: Partial<LocationTest>) => {
    setTests(prev => prev.map(test => 
      test.id === id ? { ...test, ...updates } : test
    ));
  };

  const runPermissionTest = async () => {
    const testId = addTest({
      name: 'Solicitar Permiso de Ubicación',
      status: 'pending'
    });

    const startTime = Date.now();
    try {
      const granted = await requestLocationPermission();
      const duration = Date.now() - startTime;
      
      updateTest(testId, {
        status: granted ? 'success' : 'error',
        result: { granted, permissions },
        duration,
        error: granted ? undefined : 'Permiso denegado'
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      updateTest(testId, {
        status: 'error',
        error: error instanceof Error ? error.message : 'Error desconocido',
        duration
      });
    }
  };

  const runLocationTest = async () => {
    const testId = addTest({
      name: 'Obtener Ubicación Actual',
      status: 'pending'
    });

    const startTime = Date.now();
    try {
      const location = await getCurrentLocation();
      const duration = Date.now() - startTime;
      
      updateTest(testId, {
        status: 'success',
        result: location,
        duration
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      updateTest(testId, {
        status: 'error',
        error: error instanceof Error ? error.message : 'Error desconocido',
        duration
      });
    }
  };

  const runBrowserLocationTest = async () => {
    const testId = addTest({
      name: 'Prueba Directa del Navegador',
      status: 'pending'
    });

    const startTime = Date.now();
    try {
      if (!('geolocation' in navigator)) {
        throw new Error('Geolocalización no disponible');
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 300000 }
        );
      });

      const duration = Date.now() - startTime;
      updateTest(testId, {
        status: 'success',
        result: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        },
        duration
      });
    } catch (error: any) {
      const duration = Date.now() - startTime;
      let errorMessage = 'Error desconocido';
      
      if (error.code) {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Permiso denegado';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Posición no disponible';
            break;
          case error.TIMEOUT:
            errorMessage = 'Tiempo de espera agotado';
            break;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      updateTest(testId, {
        status: 'error',
        error: errorMessage,
        duration
      });
    }
  };

  const runAllTests = async () => {
    setIsRunningTests(true);
    setTests([]);
    
    try {
      await runPermissionTest();
      await new Promise(resolve => setTimeout(resolve, 1000));
      await runLocationTest();
      await new Promise(resolve => setTimeout(resolve, 1000));
      await runBrowserLocationTest();
    } finally {
      setIsRunningTests(false);
    }
  };

  const clearTests = () => {
    setTests([]);
  };

  const getStatusIcon = (status: LocationTest['status']) => {
    switch (status) {
      case 'pending':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusBadge = (status: LocationTest['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Ejecutando...</Badge>;
      case 'success':
        return <Badge variant="default" className="bg-green-500">Éxito</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Link href="/" className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <TestTube className="h-5 w-5" />
                Diagnóstico de Ubicación
              </h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Herramientas para diagnosticar y configurar la geolocalización
            </p>
          </div>
        </div>
      </div>

      {/* Tabs principales */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Configuración
          </TabsTrigger>
          <TabsTrigger value="diagnostics">
            <TestTube className="h-4 w-4 mr-2" />
            Diagnósticos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-4">
          <LocationSettings showOnboarding={false} />
        </TabsContent>

        <TabsContent value="diagnostics" className="space-y-4">
          {/* Estado actual de permisos */}
          <Card>
            <CardHeader>
              <CardTitle>Estado Actual de Permisos</CardTitle>
              <CardDescription>
                Información sobre el estado actual de los permisos de ubicación
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium mb-1">Permiso de Ubicación:</p>
                  <Badge variant={permissions.location ? "default" : "destructive"}>
                    {permissions.location ? "Concedido" : "Denegado"}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Cargando:</p>
                  <Badge variant={permissions.isLoading ? "secondary" : "outline"}>
                    {permissions.isLoading ? "Sí" : "No"}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Denegado Permanentemente:</p>
                  <Badge variant={permissions.deniedPermanently.location ? "destructive" : "outline"}>
                    {permissions.deniedPermanently.location ? "Sí" : "No"}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Ha Preguntado Antes:</p>
                  <Badge variant={permissions.hasAskedBefore.location ? "secondary" : "outline"}>
                    {permissions.hasAskedBefore.location ? "Sí" : "No"}
                  </Badge>
                </div>
              </div>
              
              {permissions.error && (
                <Alert className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{permissions.error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

      {/* Controles de prueba */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Controles de Prueba</CardTitle>
          <CardDescription>
            Ejecuta pruebas individuales o todas las pruebas a la vez
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={runPermissionTest}
              disabled={isRunningTests}
              variant="outline"
            >
              Probar Permiso
            </Button>
            <Button 
              onClick={runLocationTest}
              disabled={isRunningTests}
              variant="outline"
            >
              Probar Ubicación
            </Button>
            <Button 
              onClick={runBrowserLocationTest}
              disabled={isRunningTests}
              variant="outline"
            >
              Prueba Directa
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <Button 
              onClick={runAllTests}
              disabled={isRunningTests}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isRunningTests ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Ejecutar Todas
            </Button>
            <Button 
              onClick={clearTests}
              disabled={isRunningTests}
              variant="ghost"
            >
              Limpiar
            </Button>
          </div>
        </CardContent>
      </Card>

          {/* Resultados de pruebas */}
          {tests.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Resultados de Pruebas</CardTitle>
                <CardDescription>
                  Resultados detallados de las pruebas ejecutadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tests.map((test) => (
                    <div key={test.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(test.status)}
                          <h3 className="font-medium">{test.name}</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          {test.duration && (
                            <span className="text-sm text-muted-foreground">
                              {test.duration}ms
                            </span>
                          )}
                          {getStatusBadge(test.status)}
                        </div>
                      </div>
                      
                      {test.error && (
                        <Alert className="mb-2">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{test.error}</AlertDescription>
                        </Alert>
                      )}
                      
                      {test.result && (
                        <div className="bg-muted rounded p-3">
                          <p className="text-sm font-medium mb-1">Resultado:</p>
                          <pre className="text-xs overflow-auto">
                            {JSON.stringify(test.result, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}