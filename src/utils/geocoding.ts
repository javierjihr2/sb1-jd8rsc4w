// Función para obtener la ciudad/comuna usando geocodificación inversa
export interface LocationInfo {
  city: string;
  state: string;
  country: string;
  fullAddress: string;
}

export const getCityFromCoordinates = async (
  latitude: number,
  longitude: number
): Promise<LocationInfo | null> => {
  try {
    // Usar la API de geocodificación inversa de OpenStreetMap (gratuita)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'SquadGO-Battle-App/1.0'
        }
      }
    );

    if (!response.ok) {
      throw new Error('Error en la respuesta de geocodificación');
    }

    const data = await response.json();
    
    if (!data || !data.address) {
      return null;
    }

    const address = data.address;
    
    // Extraer información de la ciudad/comuna
    const city = address.city || 
                address.town || 
                address.village || 
                address.municipality || 
                address.county || 
                'Ciudad no disponible';
    
    const state = address.state || 
                 address.province || 
                 address.region || 
                 'Estado no disponible';
    
    const country = address.country || 'País no disponible';
    
    const fullAddress = data.display_name || 'Dirección no disponible';

    return {
      city,
      state,
      country,
      fullAddress
    };
  } catch (error) {
    console.error('Error obteniendo información de ubicación:', error);
    return null;
  }
};

// Función alternativa usando Google Geocoding API (requiere API key)
export const getCityFromCoordinatesGoogle = async (
  latitude: number,
  longitude: number,
  apiKey: string
): Promise<LocationInfo | null> => {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}&language=es`
    );

    if (!response.ok) {
      throw new Error('Error en la respuesta de Google Geocoding');
    }

    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
      return null;
    }

    const result = data.results[0];
    let city = 'Ciudad no disponible';
    let state = 'Estado no disponible';
    let country = 'País no disponible';

    // Buscar componentes específicos
    for (const component of result.address_components) {
      const types = component.types;
      
      if (types.includes('locality') || types.includes('administrative_area_level_2')) {
        city = component.long_name;
      } else if (types.includes('administrative_area_level_1')) {
        state = component.long_name;
      } else if (types.includes('country')) {
        country = component.long_name;
      }
    }

    return {
      city,
      state,
      country,
      fullAddress: result.formatted_address
    };
  } catch (error) {
    console.error('Error obteniendo información de ubicación con Google:', error);
    return null;
  }
};