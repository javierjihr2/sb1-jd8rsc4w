/**
 * Sistema de validación y verificación de integridad de datos
 * Garantiza que los datos guardados sean válidos y consistentes
 */

import type { PlayerProfile, FeedPost } from '@/lib/types'
import { playerProfile } from '@/lib/data'

// Tipos para validación
interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  correctedData?: any
}

interface DataIntegrityReport {
  timestamp: number
  userId: string
  dataType: string
  isValid: boolean
  errors: string[]
  warnings: string[]
  autoFixed: boolean
  originalData?: any
  correctedData?: any
}

// Esquemas de validación
const PROFILE_SCHEMA = {
  required: ['id', 'name', 'email'],
  optional: ['bio', 'avatarUrl', 'coverPhotoUrl', 'countryCode', 'gameId', 'level', 'rank', 'stats', 'role', 'location', 'favoriteWeapons', 'playSchedule'],
  types: {
    id: 'string',
    name: 'string',
    email: 'string',
    bio: 'string',
    avatarUrl: 'string',
    coverPhotoUrl: 'string',
    countryCode: 'string',
    gameId: 'string',
    level: 'number',
    rank: 'string',
    role: 'string',
    location: 'string'
  },
  constraints: {
    name: { minLength: 1, maxLength: 50 },
    bio: { maxLength: 500 },
    email: { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
    level: { min: 1, max: 100 }
  }
}

const POST_SCHEMA = {
  required: ['id', 'content', 'authorId', 'timestamp'],
  optional: ['images', 'sentiment', 'achievement', 'likes', 'comments'],
  types: {
    id: 'string',
    content: 'string',
    authorId: 'string',
    timestamp: 'number'
  },
  constraints: {
    content: { minLength: 1, maxLength: 2000 }
  }
}

/**
 * Valida un perfil de usuario
 */
export function validateProfile(profile: any): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const correctedData = { ...profile }

  // Verificar campos requeridos
  for (const field of PROFILE_SCHEMA.required) {
    if (!profile[field]) {
      errors.push(`Campo requerido faltante: ${field}`)
    }
  }

  // Verificar tipos de datos
  for (const [field, expectedType] of Object.entries(PROFILE_SCHEMA.types)) {
    if (profile[field] !== undefined && profile[field] !== null) {
      const actualType = typeof profile[field]
      if (actualType !== expectedType) {
        errors.push(`Tipo incorrecto para ${field}: esperado ${expectedType}, recibido ${actualType}`)
        
        // Intentar corrección automática
        if (expectedType === 'string' && actualType !== 'object') {
          correctedData[field] = String(profile[field])
          warnings.push(`Auto-corregido ${field} a string`)
        } else if (expectedType === 'number' && !isNaN(Number(profile[field]))) {
          correctedData[field] = Number(profile[field])
          warnings.push(`Auto-corregido ${field} a number`)
        }
      }
    }
  }

  // Verificar restricciones
  if (profile.name) {
    const nameConstraints = PROFILE_SCHEMA.constraints.name
    if (profile.name.length < nameConstraints.minLength) {
      errors.push(`Nombre demasiado corto (mínimo ${nameConstraints.minLength} caracteres)`)
    }
    if (profile.name.length > nameConstraints.maxLength) {
      errors.push(`Nombre demasiado largo (máximo ${nameConstraints.maxLength} caracteres)`)
      correctedData.name = profile.name.substring(0, nameConstraints.maxLength)
      warnings.push('Nombre truncado automáticamente')
    }
  }

  if (profile.bio && profile.bio.length > PROFILE_SCHEMA.constraints.bio.maxLength) {
    errors.push(`Bio demasiado larga (máximo ${PROFILE_SCHEMA.constraints.bio.maxLength} caracteres)`)
    correctedData.bio = profile.bio.substring(0, PROFILE_SCHEMA.constraints.bio.maxLength)
    warnings.push('Bio truncada automáticamente')
  }

  if (profile.email && !PROFILE_SCHEMA.constraints.email.pattern.test(profile.email)) {
    errors.push('Formato de email inválido')
  }

  if (profile.level !== undefined) {
    const levelConstraints = PROFILE_SCHEMA.constraints.level
    if (profile.level < levelConstraints.min || profile.level > levelConstraints.max) {
      errors.push(`Nivel fuera de rango (${levelConstraints.min}-${levelConstraints.max})`)
      correctedData.level = Math.max(levelConstraints.min, Math.min(levelConstraints.max, profile.level))
      warnings.push('Nivel corregido automáticamente')
    }
  }

  // Verificar timestamps
  if (profile.lastModified && (typeof profile.lastModified !== 'number' || profile.lastModified > Date.now())) {
    warnings.push('Timestamp de modificación inválido')
    correctedData.lastModified = Date.now()
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    correctedData: warnings.length > 0 ? correctedData : undefined
  }
}

/**
 * Valida un post del feed
 */
export function validatePost(post: any): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const correctedData = { ...post }

  // Verificar campos requeridos
  for (const field of POST_SCHEMA.required) {
    if (!post[field]) {
      errors.push(`Campo requerido faltante: ${field}`)
    }
  }

  // Verificar tipos de datos
  for (const [field, expectedType] of Object.entries(POST_SCHEMA.types)) {
    if (post[field] !== undefined && typeof post[field] !== expectedType) {
      errors.push(`Tipo incorrecto para ${field}: esperado ${expectedType}, recibido ${typeof post[field]}`)
    }
  }

  // Verificar restricciones de contenido
  if (post.content) {
    const contentConstraints = POST_SCHEMA.constraints.content
    if (post.content.length < contentConstraints.minLength) {
      errors.push(`Contenido demasiado corto (mínimo ${contentConstraints.minLength} caracteres)`)
    }
    if (post.content.length > contentConstraints.maxLength) {
      errors.push(`Contenido demasiado largo (máximo ${contentConstraints.maxLength} caracteres)`)
      correctedData.content = post.content.substring(0, contentConstraints.maxLength)
      warnings.push('Contenido truncado automáticamente')
    }
  }

  // Verificar timestamp
  if (post.timestamp && (typeof post.timestamp !== 'number' || post.timestamp > Date.now())) {
    warnings.push('Timestamp inválido')
    correctedData.timestamp = Date.now()
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    correctedData: warnings.length > 0 ? correctedData : undefined
  }
}

/**
 * Sanitiza y limpia datos de entrada
 */
export function sanitizeData(data: any, type: 'profile' | 'post'): any {
  if (!data || typeof data !== 'object') {
    return null
  }

  const sanitized = { ...data }

  // Limpiar strings
  for (const [key, value] of Object.entries(sanitized)) {
    if (typeof value === 'string') {
      // Remover caracteres peligrosos
      sanitized[key] = value
        .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remover scripts
        .replace(/<[^>]*>/g, '') // Remover HTML tags
        .trim() // Remover espacios
    }
  }

  // Aplicar valores por defecto según el tipo
  if (type === 'profile') {
    sanitized.lastModified = sanitized.lastModified || Date.now()
    sanitized.syncStatus = sanitized.syncStatus || 'sanitized'
    
    // Asegurar que tenga valores por defecto del playerProfile
    for (const [key, defaultValue] of Object.entries(playerProfile)) {
      if (sanitized[key] === undefined || sanitized[key] === null) {
        sanitized[key] = defaultValue
      }
    }
  }

  return sanitized
}

/**
 * Verifica la integridad de los datos almacenados
 */
export async function verifyDataIntegrity(userId: string, data: any, dataType: 'profile' | 'post'): Promise<DataIntegrityReport> {
  const timestamp = Date.now()
  
  // Sanitizar datos primero
  const sanitizedData = sanitizeData(data, dataType)
  
  // Validar según el tipo
  const validation = dataType === 'profile' 
    ? validateProfile(sanitizedData)
    : validatePost(sanitizedData)

  const report: DataIntegrityReport = {
    timestamp,
    userId,
    dataType,
    isValid: validation.isValid,
    errors: validation.errors,
    warnings: validation.warnings,
    autoFixed: !!validation.correctedData,
    originalData: data,
    correctedData: validation.correctedData
  }

  // Log del reporte
  if (!validation.isValid) {
    console.warn('⚠️ Problemas de integridad detectados:', report)
  } else if (validation.warnings.length > 0) {
    console.log('✅ Datos válidos con correcciones menores:', report)
  } else {
    console.log('✅ Datos completamente válidos:', { userId, dataType, timestamp })
  }

  return report
}

/**
 * Repara datos corruptos automáticamente
 */
export function repairCorruptedData(data: any, dataType: 'profile' | 'post'): any {
  if (!data) {
    // Crear datos básicos si no existen
    if (dataType === 'profile') {
      return {
        ...playerProfile,
        lastModified: Date.now(),
        syncStatus: 'repaired'
      }
    }
    return null
  }

  // Sanitizar y validar
  const sanitized = sanitizeData(data, dataType)
  const validation = dataType === 'profile' 
    ? validateProfile(sanitized)
    : validatePost(sanitized)

  // Retornar datos corregidos o originales
  return validation.correctedData || sanitized
}

/**
 * Compara dos versiones de datos para detectar cambios
 */
export function compareDataVersions(oldData: any, newData: any): {
  hasChanges: boolean
  changes: string[]
  conflicts: string[]
} {
  const changes: string[] = []
  const conflicts: string[] = []

  if (!oldData && !newData) {
    return { hasChanges: false, changes, conflicts }
  }

  if (!oldData || !newData) {
    return { 
      hasChanges: true, 
      changes: ['Datos completamente nuevos o eliminados'],
      conflicts 
    }
  }

  // Comparar campos
  const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)])
  
  for (const key of allKeys) {
    const oldValue = oldData[key]
    const newValue = newData[key]

    if (oldValue !== newValue) {
      changes.push(`${key}: ${oldValue} → ${newValue}`)
      
      // Detectar conflictos (cambios simultáneos)
      if (oldValue && newValue && 
          oldData.lastModified && newData.lastModified &&
          Math.abs(oldData.lastModified - newData.lastModified) < 1000) {
        conflicts.push(`Conflicto en ${key}: cambios simultáneos detectados`)
      }
    }
  }

  return {
    hasChanges: changes.length > 0,
    changes,
    conflicts
  }
}

/**
 * Genera un hash de verificación para los datos
 */
export function generateDataHash(data: any): string {
  if (!data) return ''
  
  // Crear una representación estable del objeto
  const sortedKeys = Object.keys(data).sort()
  const stableString = sortedKeys
    .map(key => `${key}:${JSON.stringify(data[key])}`)
    .join('|')
  
  // Generar hash simple (para verificación básica)
  let hash = 0
  for (let i = 0; i < stableString.length; i++) {
    const char = stableString.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convertir a 32-bit integer
  }
  
  return hash.toString(36)
}

/**
 * Valida la consistencia de un conjunto de datos
 */
export function validateDataConsistency(datasets: { [key: string]: any }): {
  isConsistent: boolean
  inconsistencies: string[]
  recommendations: string[]
} {
  const inconsistencies: string[] = []
  const recommendations: string[] = []

  // Verificar que todos los datasets tengan el mismo userId
  const userIds = Object.values(datasets)
    .map(data => data?.id || data?.userId || data?.authorId)
    .filter(Boolean)
  
  const uniqueUserIds = new Set(userIds)
  if (uniqueUserIds.size > 1) {
    inconsistencies.push('Múltiples IDs de usuario detectados en los datos')
    recommendations.push('Verificar que todos los datos pertenezcan al mismo usuario')
  }

  // Verificar timestamps
  const timestamps = Object.values(datasets)
    .map(data => data?.lastModified || data?.timestamp)
    .filter(Boolean)
  
  if (timestamps.length > 1) {
    const maxTimestamp = Math.max(...timestamps)
    const minTimestamp = Math.min(...timestamps)
    const timeDiff = maxTimestamp - minTimestamp
    
    // Si hay más de 24 horas de diferencia, puede ser inconsistente
    if (timeDiff > 24 * 60 * 60 * 1000) {
      inconsistencies.push('Grandes diferencias de tiempo entre datasets')
      recommendations.push('Sincronizar datos con la fuente más reciente')
    }
  }

  return {
    isConsistent: inconsistencies.length === 0,
    inconsistencies,
    recommendations
  }
}