/**
 * Utilidades para validación de datos y acceso seguro a propiedades
 * Previene errores de "Cannot read properties of undefined"
 */

// Tipos para validación
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedData?: any;
}

export interface ValidationRule {
  field: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required?: boolean;
  defaultValue?: any;
  validator?: (value: any) => boolean;
}

/**
 * Acceso seguro a propiedades anidadas de objetos
 * @param obj - Objeto del cual extraer la propiedad
 * @param path - Ruta de la propiedad (ej: 'user.profile.name')
 * @param defaultValue - Valor por defecto si la propiedad no existe
 */
export function safeGet<T = any>(obj: any, path: string, defaultValue: T = undefined as T): T {
  if (!obj || typeof obj !== 'object') {
    return defaultValue;
  }

  const keys = path.split('.');
  let current = obj;

  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return defaultValue;
    }
    current = current[key];
  }

  return current !== undefined ? current : defaultValue;
}

/**
 * Validar estructura de datos según reglas definidas
 * @param data - Datos a validar
 * @param rules - Reglas de validación
 */
export function validateData(data: any, rules: ValidationRule[]): ValidationResult {
  const errors: string[] = [];
  const sanitizedData: any = {};

  // Verificar que data es un objeto válido
  if (!data || typeof data !== 'object') {
    return {
      isValid: false,
      errors: ['Data must be a valid object'],
      sanitizedData: {}
    };
  }

  for (const rule of rules) {
    const value = data[rule.field];
    const hasValue = value !== undefined && value !== null;

    // Verificar campos requeridos
    if (rule.required && !hasValue) {
      errors.push(`Field '${rule.field}' is required`);
      if (rule.defaultValue !== undefined) {
        sanitizedData[rule.field] = rule.defaultValue;
      }
      continue;
    }

    // Si no hay valor y no es requerido, usar valor por defecto
    if (!hasValue) {
      if (rule.defaultValue !== undefined) {
        sanitizedData[rule.field] = rule.defaultValue;
      }
      continue;
    }

    // Validar tipo
    let isValidType = false;
    let sanitizedValue = value;

    switch (rule.type) {
      case 'string':
        isValidType = typeof value === 'string';
        sanitizedValue = isValidType ? value : String(value);
        break;
      case 'number':
        isValidType = typeof value === 'number' && !isNaN(value);
        if (!isValidType && typeof value === 'string') {
          const parsed = parseFloat(value);
          if (!isNaN(parsed)) {
            isValidType = true;
            sanitizedValue = parsed;
          }
        }
        break;
      case 'boolean':
        isValidType = typeof value === 'boolean';
        if (!isValidType) {
          sanitizedValue = Boolean(value);
          isValidType = true;
        }
        break;
      case 'array':
        isValidType = Array.isArray(value);
        sanitizedValue = isValidType ? value : [];
        break;
      case 'object':
        isValidType = typeof value === 'object' && value !== null && !Array.isArray(value);
        sanitizedValue = isValidType ? value : {};
        break;
    }

    if (!isValidType) {
      errors.push(`Field '${rule.field}' must be of type ${rule.type}`);
    }

    // Validación personalizada
    if (rule.validator && !rule.validator(sanitizedValue)) {
      errors.push(`Field '${rule.field}' failed custom validation`);
    }

    sanitizedData[rule.field] = sanitizedValue;
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData
  };
}

/**
 * Validar datos de usuario
 */
export function validateUserData(userData: any): ValidationResult {
  const rules: ValidationRule[] = [
    { field: 'userId', type: 'string', required: true },
    { field: 'username', type: 'string', required: true },
    { field: 'displayName', type: 'string', required: false, defaultValue: 'Usuario' },
    { field: 'email', type: 'string', required: false },
    { field: 'photoURL', type: 'string', required: false },
    { field: 'isVerified', type: 'boolean', required: false, defaultValue: false }
  ];

  return validateData(userData, rules);
}

/**
 * Validar datos de configuración de Firebase
 */
export function validateFirebaseData(data: any): ValidationResult {
  const rules: ValidationRule[] = [
    { field: 'totalUsers', type: 'number', required: false, defaultValue: 0 },
    { field: 'serverUsers', type: 'number', required: false, defaultValue: 0 },
    { field: 'targetReached', type: 'boolean', required: false, defaultValue: false }
  ];

  return validateData(data, rules);
}

/**
 * Validar datos de monetización
 */
export function validateMonetizationConfig(config: any): ValidationResult {
  const rules: ValidationRule[] = [
    { field: 'ownerAccountId', type: 'string', required: true },
    { field: 'stripeAccountId', type: 'string', required: true },
    { 
      field: 'commissionRate', 
      type: 'number', 
      required: true, 
      defaultValue: 0.03,
      validator: (value: number) => value >= 0 && value <= 1
    },
    { 
      field: 'minimumPayout', 
      type: 'number', 
      required: true, 
      defaultValue: 50.00,
      validator: (value: number) => value > 0
    }
  ];

  return validateData(config, rules);
}

/**
 * Wrapper para acceso seguro a propiedades de documentos de Firestore
 */
export function safeDocData<T = any>(doc: any, defaultValue: T = {} as T): T {
  if (!doc || !doc.exists || !doc.exists()) {
    return defaultValue;
  }

  const data = doc.data();
  if (!data || typeof data !== 'object') {
    return defaultValue;
  }

  return data as T;
}

/**
 * Validar array de usuarios para componentes de chat
 */
export function validateTypingUsers(users: any[]): any[] {
  if (!Array.isArray(users)) {
    return [];
  }

  return users.filter(user => {
    return user && 
           typeof user === 'object' && 
           typeof user.userId === 'string' && 
           typeof user.userName === 'string';
  });
}

/**
 * Crear un proxy para acceso seguro a objetos
 */
export function createSafeProxy<T extends object>(obj: T, defaultValue: any = undefined): T {
  return new Proxy(obj, {
    get(target, prop) {
      const value = target[prop as keyof T];
      if (value === undefined || value === null) {
        return defaultValue;
      }
      return value;
    }
  });
}