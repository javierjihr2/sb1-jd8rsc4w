'use client';

import { useState } from 'react';
import { usePermissions, ManualLocationData } from '@/hooks/use-permissions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin, Search, CheckCircle, AlertCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ManualLocationSetupProps {
  onLocationSet?: (location: ManualLocationData) => void;
  onCancel?: () => void;
}

// Ciudades principales de Chile para sugerencias
const CHILE_CITIES = [
  { name: 'Santiago', region: 'Region Metropolitana', coordinates: { latitude: -33.4489, longitude: -70.6693 } },
  { name: 'Valparaiso', region: 'Region de Valparaiso', coordinates: { latitude: -33.0472, longitude: -71.6127 } },
  { name: 'Concepcion', region: 'Region del Biobio', coordinates: { latitude: -36.8201, longitude: -73.0444 } },
  { name: 'La Serena', region: 'Region de Coquimbo', coordinates: { latitude: -29.9027, longitude: -71.2519 } },
  { name: 'Antofagasta', region: 'Region de Antofagasta', coordinates: { latitude: -23.6509, longitude: -70.3975 } },
  { name: 'Temuco', region: 'Region de La Araucania', coordinates: { latitude: -38.7359, longitude: -72.5904 } },
  { name: 'Rancagua', region: 'Region de OHiggins', coordinates: { latitude: -34.1708, longitude: -70.7394 } },
  { name: 'Talca', region: 'Region del Maule', coordinates: { latitude: -35.4264, longitude: -71.6554 } },
  { name: 'Arica', region: 'Region de Arica y Parinacota', coordinates: { latitude: -18.4783, longitude: -70.3126 } },
  { name: 'Iquique', region: 'Region de Tarapaca', coordinates: { latitude: -20.2307, longitude: -70.1355 } },
  { name: 'Puerto Montt', region: 'Region de Los Lagos', coordinates: { latitude: -41.4693, longitude: -72.9424 } },
  { name: 'Punta Arenas', region: 'Region de Magallanes', coordinates: { latitude: -53.1638, longitude: -70.9171 } }
];

export function ManualLocationSetup({ onLocationSet, onCancel }: ManualLocationSetupProps) {
  const { setManualLocationData } = usePermissions();
  const [formData, setFormData] = useState<{
    city: string;
    region: string;
    useCoordinates: boolean;
    latitude: string;
    longitude: string;
  }>({
    city: '',
    region: '',
    useCoordinates: false,
    latitude: '',
    longitude: ''
  });
  const [filteredCities, setFilteredCities] = useState(CHILE_CITIES);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleCitySearch = (searchTerm: string) => {
    setFormData(prev => ({ ...prev, city: searchTerm }));
    
    if (searchTerm.trim() === '') {
      setFilteredCities(CHILE_CITIES);
      return;
    }

    const filtered = CHILE_CITIES.filter(city =>
      city.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      city.region.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCities(filtered);
  };

  const handleCitySelect = (cityName: string) => {
    const selectedCity = CHILE_CITIES.find(city => city.name === cityName);
    if (selectedCity) {
      setFormData(prev => ({
        ...prev,
        city: selectedCity.name,
        region: selectedCity.region,
        latitude: selectedCity.coordinates.latitude.toString(),
        longitude: selectedCity.coordinates.longitude.toString(),
        useCoordinates: true
      }));
    }
  };

  const validateForm = () => {
    if (!formData.city.trim()) {
      setError('La ciudad es requerida');
      return false;
    }

    if (!formData.region.trim()) {
      setError('La region es requerida');
      return false;
    }

    if (formData.useCoordinates) {
      const lat = parseFloat(formData.latitude);
      const lng = parseFloat(formData.longitude);
      
      if (isNaN(lat) || lat < -90 || lat > 90) {
        setError('La latitud debe estar entre -90 y 90');
        return false;
      }
      
      if (isNaN(lng) || lng < -180 || lng > 180) {
        setError('La longitud debe estar entre -180 y 180');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    setError(null);
    setSuccess(false);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const locationData: ManualLocationData = {
        city: formData.city.trim(),
        region: formData.region.trim(),
        coordinates: formData.useCoordinates ? {
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude)
        } : undefined,
        timestamp: Date.now(),
        source: 'manual'
      };

      await setManualLocationData(locationData);
      setSuccess(true);
      
      // Llamar callback si existe
      onLocationSet?.(locationData);
      
      // Auto-cerrar despues de 2 segundos
      setTimeout(() => {
        onCancel?.();
      }, 2000);
      
    } catch (err) {
      setError('Error al guardar la ubicacion manual');
      console.error('Error setting manual location:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center space-x-2 text-green-600">
            <CheckCircle className="h-6 w-6" />
            <span className="font-medium">Ubicacion guardada exitosamente</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MapPin className="h-5 w-5" />
          <span>Configurar Ubicacion Manual</span>
        </CardTitle>
        <CardDescription>
          Establece tu ubicacion manualmente como respaldo cuando el GPS no este disponible.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="city">Ciudad</Label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="city"
              placeholder="Buscar ciudad..."
              value={formData.city}
              onChange={(e) => handleCitySearch(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {filteredCities.length > 0 && formData.city && (
            <div className="border rounded-md max-h-32 overflow-y-auto">
              {filteredCities.slice(0, 5).map((city) => (
                <button
                  key={city.name}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 border-b last:border-b-0"
                  onClick={() => handleCitySelect(city.name)}
                >
                  <div className="font-medium">{city.name}</div>
                  <div className="text-sm text-gray-500">{city.region}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="region">Region</Label>
          <Input
            id="region"
            placeholder="Ej: Region Metropolitana"
            value={formData.region}
            onChange={(e) => setFormData(prev => ({ ...prev, region: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="useCoordinates"
              checked={formData.useCoordinates}
              onChange={(e) => setFormData(prev => ({ ...prev, useCoordinates: e.target.checked }))}
              className="rounded"
            />
            <Label htmlFor="useCoordinates">Incluir coordenadas (opcional)</Label>
          </div>
          
          {formData.useCoordinates && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="latitude">Latitud</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  placeholder="-33.4489"
                  value={formData.latitude}
                  onChange={(e) => setFormData(prev => ({ ...prev, latitude: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="longitude">Longitud</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  placeholder="-70.6693"
                  value={formData.longitude}
                  onChange={(e) => setFormData(prev => ({ ...prev, longitude: e.target.value }))}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex space-x-2 pt-4">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1"
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            className="flex-1"
            disabled={isSubmitting || !formData.city || !formData.region}
          >
            {isSubmitting ? 'Guardando...' : 'Guardar Ubicacion'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}