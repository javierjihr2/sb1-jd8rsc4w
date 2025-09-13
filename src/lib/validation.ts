// Sistema de validación robusto para datos de usuario
import type { PlayerProfile, FeedPost, Message } from './types';
import DOMPurify from 'isomorphic-dompurify';

// Rate limiting simple (en memoria)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export const checkRateLimit = (identifier: string, maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000): boolean => {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (record.count >= maxAttempts) {
    return false;
  }
  
  record.count++;
  return true;
};

// Sanitización de entrada
export const sanitizeInput = (input: string): string => {
  if (!input) return '';
  
  // Remover caracteres peligrosos
  let sanitized = input.trim();
  
  // Escapar HTML
  sanitized = DOMPurify.sanitize(sanitized, { ALLOWED_TAGS: [] });
  
  // Remover caracteres de control
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');
  
  return sanitized;
};

// Esquemas de validación
interface ValidationResult<T = unknown> {
  isValid: boolean;
  errors: string[];
  sanitizedData?: T;
}

// Validador para perfil de usuario
export const validateUserProfile = (data: Partial<PlayerProfile>): ValidationResult<Partial<PlayerProfile>> => {
  const errors: string[] = [];
  const sanitized: Partial<PlayerProfile> = {};

  // Validar nombre
  if (data.name !== undefined) {
    if (typeof data.name !== 'string') {
      errors.push('El nombre debe ser una cadena de texto');
    } else if (data.name.trim().length < 2) {
      errors.push('El nombre debe tener al menos 2 caracteres');
    } else if (data.name.trim().length > 50) {
      errors.push('El nombre no puede exceder 50 caracteres');
    } else if (!/^[a-zA-ZÀ-ÿ\u00f1\u00d1\s0-9_-]+$/.test(data.name.trim())) {
      errors.push('El nombre contiene caracteres no válidos');
    } else {
      sanitized.name = data.name.trim();
    }
  }

  // Validar biografía
  if (data.bio !== undefined) {
    if (typeof data.bio !== 'string') {
      errors.push('La biografía debe ser una cadena de texto');
    } else if (data.bio.length > 500) {
      errors.push('La biografía no puede exceder 500 caracteres');
    } else {
      sanitized.bio = data.bio.trim();
    }
  }

  // Validar ID del juego
  if (data.gameId !== undefined) {
    if (typeof data.gameId !== 'string') {
      errors.push('El ID del juego debe ser una cadena de texto');
    } else if (data.gameId.trim() && !/^[0-9]+$/.test(data.gameId.trim())) {
      errors.push('El ID del juego debe contener solo números');
    } else if (data.gameId.trim().length > 20) {
      errors.push('El ID del juego no puede exceder 20 caracteres');
    } else {
      sanitized.gameId = data.gameId.trim();
    }
  }

  // Validar código de país
  if (data.countryCode !== undefined) {
    const validCountries = ['AR', 'BO', 'BR', 'CA', 'CL', 'CO', 'CR', 'EC', 'SV', 'US', 'GT', 'HN', 'MX', 'PA', 'PY', 'PE', 'PR', 'DO', 'UY', 'VE'];
    if (typeof data.countryCode !== 'string') {
      errors.push('El código de país debe ser una cadena de texto');
    } else if (!validCountries.includes(data.countryCode)) {
      errors.push('Código de país no válido');
    } else {
      sanitized.countryCode = data.countryCode;
    }
  }

  // Validar URLs de imágenes
  if (data.avatarUrl !== undefined) {
    if (data.avatarUrl && typeof data.avatarUrl !== 'string') {
      errors.push('La URL del avatar debe ser una cadena de texto');
    } else if (data.avatarUrl && data.avatarUrl.length > 2000) {
      errors.push('La URL del avatar es demasiado larga');
    } else {
      sanitized.avatarUrl = data.avatarUrl;
    }
  }

  if (data.coverPhotoUrl !== undefined) {
    if (data.coverPhotoUrl && typeof data.coverPhotoUrl !== 'string') {
      errors.push('La URL de la foto de portada debe ser una cadena de texto');
    } else if (data.coverPhotoUrl && data.coverPhotoUrl.length > 2000) {
      errors.push('La URL de la foto de portada es demasiado larga');
    } else {
      sanitized.coverPhotoUrl = data.coverPhotoUrl;
    }
  }

  // Validar estadísticas
  if (data.stats !== undefined) {
    if (typeof data.stats !== 'object' || data.stats === null) {
      errors.push('Las estadísticas deben ser un objeto');
    } else {
      const stats: any = {};
      
      if (data.stats.wins !== undefined) {
        if (typeof data.stats.wins !== 'number' || data.stats.wins < 0 || data.stats.wins > 1000000) {
          errors.push('Las victorias deben ser un número entre 0 y 1,000,000');
        } else {
          stats.wins = Math.floor(data.stats.wins);
        }
      }
      
      if (data.stats.kda !== undefined) {
        if (typeof data.stats.kda !== 'number' || data.stats.kda < 0 || data.stats.kda > 100) {
          errors.push('El KDA debe ser un número entre 0 y 100');
        } else {
          stats.kda = Math.round(data.stats.kda * 100) / 100; // Redondear a 2 decimales
        }
      }
      
      if (data.stats.matches !== undefined) {
        if (typeof data.stats.matches !== 'number' || data.stats.matches < 0 || data.stats.matches > 10000000) {
          errors.push('Las partidas deben ser un número entre 0 y 10,000,000');
        } else {
          stats.matches = Math.floor(data.stats.matches);
        }
      }
      
      if (Object.keys(stats).length > 0) {
        sanitized.stats = stats;
      }
    }
  }

  // Validar nivel
  if (data.level !== undefined) {
    if (typeof data.level !== 'number' || data.level < 1 || data.level > 100) {
      errors.push('El nivel debe ser un número entre 1 y 100');
    } else {
      sanitized.level = Math.floor(data.level);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData: errors.length === 0 ? sanitized : undefined
  };
};

// Validador para posts del feed
export const validateFeedPost = (data: Partial<FeedPost>): ValidationResult<Partial<FeedPost>> => {
  const errors: string[] = [];
  const sanitized: Partial<FeedPost> = {};

  // Validar contenido
  if (data.content !== undefined) {
    if (typeof data.content !== 'string') {
      errors.push('El contenido debe ser una cadena de texto');
    } else if (data.content.trim().length === 0) {
      errors.push('El contenido no puede estar vacío');
    } else if (data.content.length > 2000) {
      errors.push('El contenido no puede exceder 2000 caracteres');
    } else {
      sanitized.content = data.content.trim();
    }
  }

  // Validar imágenes
  if (data.images !== undefined) {
    if (!Array.isArray(data.images)) {
      errors.push('Las imágenes deben ser un array');
    } else if (data.images.length > 4) {
      errors.push('No se pueden subir más de 4 imágenes');
    } else {
      const validImages = data.images.filter(img => 
        typeof img === 'string' && img.length > 0 && img.length <= 2000
      );
      sanitized.images = validImages;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData: errors.length === 0 ? sanitized : undefined
  };
};

// Validador para mensajes de chat
export const validateChatMessage = (data: Partial<Message>): ValidationResult<Partial<Message>> => {
  const errors: string[] = [];
  const sanitized: Partial<Message> = {};

  // Validar contenido
  if (data.content !== undefined) {
    if (typeof data.content !== 'string') {
      errors.push('El mensaje debe ser una cadena de texto');
    } else if (data.content.trim().length === 0) {
      errors.push('El mensaje no puede estar vacío');
    } else if (data.content.length > 1000) {
      errors.push('El mensaje no puede exceder 1000 caracteres');
    } else {
      sanitized.content = data.content.trim();
    }
  }

  // Validar tipo
  if (data.type !== undefined) {
    const validTypes = ['text', 'image', 'audio', 'location', 'voice'];
    if (!validTypes.includes(data.type)) {
      errors.push('Tipo de mensaje no válido');
    } else {
      sanitized.type = data.type;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData: errors.length === 0 ? sanitized : undefined
  };
};

// Función de sanitización general ya definida arriba

// Validador de email
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validador de URL
export const validateUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Función para validar datos antes de guardar
export const validateBeforeSave = <T>(data: T, validator: (data: T) => ValidationResult<T>): T => {
  const result = validator(data);
  if (!result.isValid) {
    throw new Error(`Validation failed: ${result.errors.join(', ')}`);
  }
  return result.sanitizedData || data;
};

// Validador para perfil de matching
export const validateMatchingProfile = (data: any): ValidationResult<any> => {
  const errors: string[] = [];
  const sanitized: any = {};

  // Validar userId
  if (!data.userId || typeof data.userId !== 'string') {
    errors.push('ID de usuario requerido');
  } else {
    sanitized.userId = data.userId.trim();
  }

  // Validar username
  if (!data.username || typeof data.username !== 'string') {
    errors.push('Nombre de usuario requerido');
  } else if (data.username.trim().length < 2 || data.username.trim().length > 30) {
    errors.push('El nombre de usuario debe tener entre 2 y 30 caracteres');
  } else {
    sanitized.username = data.username.trim();
  }

  // Validar juegos
  if (!data.games || !Array.isArray(data.games) || data.games.length === 0) {
    errors.push('Debe seleccionar al menos un juego');
  } else if (data.games.length > 10) {
    errors.push('No puede seleccionar más de 10 juegos');
  } else {
    const validGames = data.games.filter((game: any) => typeof game === 'string' && game.trim().length > 0);
    if (validGames.length === 0) {
      errors.push('Debe seleccionar al menos un juego válido');
    } else {
      sanitized.games = validGames.map((game: string) => game.trim());
    }
  }

  // Validar niveles de habilidad
  if (data.skillLevels && typeof data.skillLevels === 'object') {
    const validLevels = ['beginner', 'intermediate', 'advanced', 'pro'];
    const skillLevels: any = {};
    
    Object.keys(data.skillLevels).forEach(game => {
      if (validLevels.includes(data.skillLevels[game])) {
        skillLevels[game] = data.skillLevels[game];
      }
    });
    
    sanitized.skillLevels = skillLevels;
  }

  // Validar idiomas
  if (data.languages && Array.isArray(data.languages)) {
    const validLanguages = data.languages.filter((lang: any) => typeof lang === 'string' && lang.trim().length > 0);
    sanitized.languages = validLanguages.slice(0, 5); // Máximo 5 idiomas
  } else {
    sanitized.languages = ['es']; // Español por defecto
  }

  // Validar disponibilidad
  if (data.availability && typeof data.availability === 'object') {
    const availability: any = {};
    
    if (typeof data.availability.timezone === 'string') {
      availability.timezone = data.availability.timezone;
    }
    
    if (Array.isArray(data.availability.preferredTimes)) {
      const validTimes = ['morning', 'afternoon', 'evening', 'night'];
      availability.preferredTimes = data.availability.preferredTimes.filter((time: any) => validTimes.includes(time));
    }
    
    availability.weekdays = Boolean(data.availability.weekdays);
    availability.weekends = Boolean(data.availability.weekends);
    
    sanitized.availability = availability;
  }

  // Validar lookingFor
  if (data.lookingFor) {
    const validOptions = ['casual', 'competitive', 'ranked', 'tournaments', 'any'];
    if (validOptions.includes(data.lookingFor)) {
      sanitized.lookingFor = data.lookingFor;
    }
  }

  // Validar teamSize
  if (data.teamSize !== undefined) {
    const size = Number(data.teamSize);
    if (size >= 1 && size <= 10) {
      sanitized.teamSize = size;
    }
  }

  // Validar isActive
  sanitized.isActive = Boolean(data.isActive !== false);

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData: sanitized
  };
};

// Validador para solicitud de match
export const validateMatchRequest = (data: any): ValidationResult<any> => {
  const errors: string[] = [];
  const sanitized: any = {};

  // Validar fromUserId
  if (!data.fromUserId || typeof data.fromUserId !== 'string') {
    errors.push('ID de usuario origen requerido');
  } else {
    sanitized.fromUserId = data.fromUserId.trim();
  }

  // Validar toUserId
  if (!data.toUserId || typeof data.toUserId !== 'string') {
    errors.push('ID de usuario destino requerido');
  } else {
    sanitized.toUserId = data.toUserId.trim();
  }

  // Validar que no sea el mismo usuario
  if (data.fromUserId === data.toUserId) {
    errors.push('No puedes enviarte una solicitud a ti mismo');
  }

  // Validar juego
  if (!data.game || typeof data.game !== 'string') {
    errors.push('Juego requerido');
  } else {
    sanitized.game = data.game.trim();
  }

  // Validar mensaje opcional
  if (data.message !== undefined) {
    if (typeof data.message !== 'string') {
      errors.push('El mensaje debe ser texto');
    } else if (data.message.length > 500) {
      errors.push('El mensaje no puede exceder 500 caracteres');
    } else {
      sanitized.message = data.message.trim();
    }
  }

  // Validar tipo de match
  const validMatchTypes = ['duo', 'team', 'tournament'];
  if (!data.matchType || !validMatchTypes.includes(data.matchType)) {
    errors.push('Tipo de match inválido');
  } else {
    sanitized.matchType = data.matchType;
  }

  // Validar status
  sanitized.status = 'pending';

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData: sanitized
  };
};

// Notification validation
export function validateNotification(data: any): ValidationResult {
  const errors: string[] = [];

  // Validate notification data
  if (data.subscription) {
    if (!data.userId || typeof data.userId !== 'string') {
      errors.push('ID de usuario es requerido para la suscripción');
    }
    
    if (!data.subscription.endpoint || typeof data.subscription.endpoint !== 'string') {
      errors.push('Endpoint de suscripción es requerido');
    }
    
    if (!data.subscription.keys || !data.subscription.keys.p256dh || !data.subscription.keys.auth) {
      errors.push('Claves de suscripción son requeridas');
    }
  } else {
    // Validate notification object
    if (!data.userId || typeof data.userId !== 'string') {
      errors.push('ID de usuario es requerido');
    }
    
    if (!data.type || typeof data.type !== 'string') {
      errors.push('Tipo de notificación es requerido');
    }
    
    const validTypes = ['message', 'friend_request', 'friend_accepted', 'match_found', 'tournament_invite', 'tournament_reminder', 'feed_like', 'feed_comment'];
    if (data.type && !validTypes.includes(data.type)) {
      errors.push('Tipo de notificación no válido');
    }
    
    if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
      errors.push('Título de notificación es requerido');
    }
    
    if (!data.body || typeof data.body !== 'string' || data.body.trim().length === 0) {
      errors.push('Cuerpo de notificación es requerido');
    }
    
    if (data.title && data.title.length > 100) {
      errors.push('Título de notificación no puede exceder 100 caracteres');
    }
    
    if (data.body && data.body.length > 500) {
      errors.push('Cuerpo de notificación no puede exceder 500 caracteres');
    }
    
    if (data.priority && !['low', 'normal', 'high'].includes(data.priority)) {
      errors.push('Prioridad de notificación no válida');
    }
    
    if (data.actionUrl && typeof data.actionUrl !== 'string') {
      errors.push('URL de acción debe ser una cadena válida');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Validador para registro de torneos
export function validateTournamentRegistration(data: any): ValidationResult {
  const errors: string[] = [];
  const sanitized: any = {};

  // Validar tournamentId
  if (!data.tournamentId || typeof data.tournamentId !== 'string') {
    errors.push('ID de torneo es requerido');
  } else {
    sanitized.tournamentId = data.tournamentId.trim();
  }

  // Validar userId
  if (!data.userId || typeof data.userId !== 'string') {
    errors.push('ID de usuario es requerido');
  } else {
    sanitized.userId = data.userId.trim();
  }

  // Validar username
  if (!data.username || typeof data.username !== 'string' || data.username.trim().length === 0) {
    errors.push('Nombre de usuario es requerido');
  } else if (data.username.length > 50) {
    errors.push('El nombre de usuario no puede exceder 50 caracteres');
  } else {
    sanitized.username = data.username.trim();
  }

  // Validar teamName (opcional)
  if (data.teamName && typeof data.teamName === 'string') {
    if (data.teamName.length > 100) {
      errors.push('El nombre del equipo no puede exceder 100 caracteres');
    } else {
      sanitized.teamName = data.teamName.trim();
    }
  }

  // Validar teamMembers (opcional)
  if (data.teamMembers && Array.isArray(data.teamMembers)) {
    if (data.teamMembers.length > 10) {
      errors.push('El equipo no puede tener más de 10 miembros');
    } else {
      const validMembers = data.teamMembers.filter((member: any) => 
        typeof member === 'string' && member.trim().length > 0
      );
      sanitized.teamMembers = validMembers.map((member: string) => member.trim());
    }
  } else {
    sanitized.teamMembers = [];
  }

  // Validar gameId
  if (!data.gameId || typeof data.gameId !== 'string') {
    errors.push('ID del juego es requerido');
  } else {
    sanitized.gameId = data.gameId.trim();
  }

  // Validar skillLevel (opcional)
  if (data.skillLevel) {
    const validLevels = ['beginner', 'intermediate', 'advanced', 'pro'];
    if (!validLevels.includes(data.skillLevel)) {
      errors.push('Nivel de habilidad no válido');
    } else {
      sanitized.skillLevel = data.skillLevel;
    }
  }

  // Establecer status por defecto
  sanitized.status = 'registered';
  sanitized.registeredAt = new Date().toISOString();

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData: errors.length === 0 ? sanitized : undefined
  };
}

// Validador para solicitud de amistad
export function validateFriendRequest(data: any): ValidationResult {
  const errors: string[] = [];
  const sanitized: any = {};

  // Validar fromUserId
  if (!data.fromUserId || typeof data.fromUserId !== 'string') {
    errors.push('ID de usuario remitente es requerido');
  } else {
    sanitized.fromUserId = data.fromUserId.trim();
  }

  // Validar toUserId
  if (!data.toUserId || typeof data.toUserId !== 'string') {
    errors.push('ID de usuario destinatario es requerido');
  } else {
    sanitized.toUserId = data.toUserId.trim();
  }

  // Validar que no sea el mismo usuario
  if (data.fromUserId === data.toUserId) {
    errors.push('No puedes enviarte una solicitud de amistad a ti mismo');
  }

  // Validar fromUsername
  if (!data.fromUsername || typeof data.fromUsername !== 'string' || data.fromUsername.trim().length === 0) {
    errors.push('Nombre de usuario remitente es requerido');
  } else {
    sanitized.fromUsername = data.fromUsername.trim();
  }

  // Validar toUsername
  if (!data.toUsername || typeof data.toUsername !== 'string' || data.toUsername.trim().length === 0) {
    errors.push('Nombre de usuario destinatario es requerido');
  } else {
    sanitized.toUsername = data.toUsername.trim();
  }

  // Validar mensaje opcional
  if (data.message !== undefined) {
    if (typeof data.message !== 'string') {
      errors.push('El mensaje debe ser texto');
    } else if (data.message.length > 500) {
      errors.push('El mensaje no puede exceder 500 caracteres');
    } else {
      sanitized.message = data.message.trim();
    }
  }

  // Establecer status por defecto
  sanitized.status = 'pending';

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData: errors.length === 0 ? sanitized : undefined
  };
}