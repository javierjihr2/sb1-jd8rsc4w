import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot, 
  serverTimestamp,
  GeoPoint,
  Timestamp
} from 'firebase/firestore'
import { db } from './firebase'
import { addRetryOperation } from './retry-system'
import { validateMatchingProfile, validateMatchRequest } from './validation'
import { sendMatchFoundNotification, sendFriendRequestNotification } from './push-notifications'

export interface MatchingProfile {
  id?: string
  userId: string
  username: string
  avatar?: string
  games: string[] // Lista de juegos que juega
  skillLevels: { [game: string]: 'beginner' | 'intermediate' | 'advanced' | 'pro' }
  preferredRoles: { [game: string]: string[] } // Roles preferidos por juego
  location?: {
    country: string
    city: string
    coordinates?: GeoPoint
  }
  availability: {
    timezone: string
    preferredTimes: string[] // ['morning', 'afternoon', 'evening', 'night']
    weekdays: boolean
    weekends: boolean
  }
  languages: string[]
  ageRange: {
    min: number
    max: number
  }
  communicationPrefs: {
    voiceChat: boolean
    textOnly: boolean
    discord: boolean
    inGame: boolean
  }
  lookingFor: 'casual' | 'competitive' | 'ranked' | 'tournaments' | 'any'
  teamSize: number // Tamaño de equipo preferido
  isActive: boolean
  lastActive: Timestamp
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface MatchRequest {
  id?: string
  fromUserId: string
  toUserId: string
  game: string
  message?: string
  status: 'pending' | 'accepted' | 'declined' | 'expired'
  matchType: 'duo' | 'team' | 'tournament'
  scheduledFor?: Timestamp
  createdAt: Timestamp
  expiresAt: Timestamp
}

export interface MatchResult {
  profile: MatchingProfile
  compatibility: number // 0-100
  commonGames: string[]
  reasons: string[] // Razones de compatibilidad
}

// Configuración de matching
const MATCH_CONFIG = {
  maxResults: 50, // Aumentado para más opciones
  minCompatibility: 50, // Reducido para más flexibilidad
  locationRadius: 100, // km
  requestExpiryHours: 24,
  // Nuevas configuraciones
  maxSkillLevelDiff: 2, // Máxima diferencia de nivel de habilidad
  timeZoneToleranceHours: 3, // Tolerancia de zona horaria
  recentActivityDays: 7, // Días para considerar actividad reciente
  priorityBoostMultiplier: 1.5 // Multiplicador para usuarios premium/activos
}

/**
 * Crear o actualizar perfil de matching
 */
export async function createMatchingProfile(profileData: Omit<MatchingProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean; profileId?: string; error?: string; retryId?: string }> {
  try {
    // Validar datos
    const validation = validateMatchingProfile(profileData)
    if (!validation.isValid) {
      return { success: false, error: validation.errors.join(', ') }
    }

    const sanitizedData = validation.sanitizedData as MatchingProfile
    
    // Agregar timestamps
    const profileWithTimestamps = {
      ...sanitizedData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastActive: serverTimestamp()
    }

    const docRef = await addDoc(collection(db, 'matchingProfiles'), profileWithTimestamps)
    
    return { 
      success: true, 
      profileId: docRef.id 
    }
  } catch (error: any) {
    console.error('Error creating matching profile:', error)
    
    // Agregar a cola de reintentos
    const retryId = addRetryOperation.profileUpdate(profileData.userId, profileData, 'medium')
    
    return { 
      success: false, 
      error: error.message,
      retryId 
    }
  }
}

/**
 * Actualizar perfil de matching
 */
export async function updateMatchingProfile(profileId: string, updates: Partial<MatchingProfile>): Promise<{ success: boolean; error?: string; retryId?: string }> {
  try {
    const validation = validateMatchingProfile(updates)
    if (!validation.isValid) {
      return { success: false, error: validation.errors.join(', ') }
    }

    const sanitizedUpdates = {
      ...validation.sanitizedData,
      updatedAt: serverTimestamp(),
      lastActive: serverTimestamp()
    }

    await updateDoc(doc(db, 'matchingProfiles', profileId), sanitizedUpdates)
    
    return { success: true }
  } catch (error: any) {
    console.error('Error updating matching profile:', error)
    
    const retryId = addRetryOperation.profileUpdate(updates.userId || 'unknown', {
      profileId,
      updates
    }, 'medium')
    
    return { 
      success: false, 
      error: error.message,
      retryId 
    }
  }
}

/**
 * Buscar matches compatibles
 */
export async function findMatches(userId: string, game?: string, filters?: {
  skillLevel?: string
  location?: string
  lookingFor?: string
  teamSize?: number
  ageRange?: { min: number; max: number }
  languages?: string[]
  onlineOnly?: boolean
  recentlyActive?: boolean
  communicationPrefs?: string[]
}): Promise<{ success: boolean; matches?: MatchResult[]; error?: string }> {
  try {
    // Obtener perfil del usuario
    const userProfileQuery = query(
      collection(db, 'matchingProfiles'),
      where('userId', '==', userId),
      where('isActive', '==', true)
    )
    
    const userProfileSnapshot = await getDocs(userProfileQuery)
    if (userProfileSnapshot.empty) {
      return { success: false, error: 'Perfil de matching no encontrado' }
    }
    
    const userProfile = { 
      id: userProfileSnapshot.docs[0].id, 
      ...userProfileSnapshot.docs[0].data() 
    } as MatchingProfile

    // Construir query base
    let matchQuery = query(
      collection(db, 'matchingProfiles'),
      where('isActive', '==', true),
      where('userId', '!=', userId)
    )

    // Aplicar filtros básicos en la query
    if (game) {
      matchQuery = query(matchQuery, where('games', 'array-contains', game))
    }
    
    if (filters?.lookingFor) {
      matchQuery = query(matchQuery, where('lookingFor', '==', filters.lookingFor))
    }

    // Filtro de actividad reciente
    if (filters?.recentlyActive) {
      const recentDate = new Date()
      recentDate.setDate(recentDate.getDate() - MATCH_CONFIG.recentActivityDays)
      matchQuery = query(matchQuery, where('lastActive', '>=', recentDate))
    }

    const matchSnapshot = await getDocs(matchQuery)
    let potentialMatches: MatchingProfile[] = matchSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as MatchingProfile[]

    // Aplicar filtros adicionales en memoria
    if (filters?.languages && filters.languages.length > 0) {
      potentialMatches = potentialMatches.filter(profile => 
        profile.languages.some(lang => filters.languages!.includes(lang))
      )
    }

    if (filters?.ageRange) {
      potentialMatches = potentialMatches.filter(profile => {
        const userAge = userProfile.ageRange
        const profileAge = profile.ageRange
        return (
          userAge.min <= profileAge.max && 
          userAge.max >= profileAge.min &&
          filters.ageRange!.min <= profileAge.max &&
          filters.ageRange!.max >= profileAge.min
        )
      })
    }

    if (filters?.communicationPrefs && filters.communicationPrefs.length > 0) {
      potentialMatches = potentialMatches.filter(profile => {
        const prefs = profile.communicationPrefs
        return filters.communicationPrefs!.some(pref => {
          switch (pref) {
            case 'voiceChat': return prefs.voiceChat
            case 'textOnly': return prefs.textOnly
            case 'discord': return prefs.discord
            case 'inGame': return prefs.inGame
            default: return false
          }
        })
      })
    }

    if (filters?.teamSize) {
      potentialMatches = potentialMatches.filter(profile => 
        Math.abs(profile.teamSize - filters.teamSize!) <= 1
      )
    }

    // Calcular compatibilidad y aplicar algoritmo mejorado
    const matches: MatchResult[] = potentialMatches
      .map(profile => calculateCompatibility(userProfile, profile))
      .filter(result => result.compatibility >= MATCH_CONFIG.minCompatibility)
      .sort((a, b) => {
        // Ordenamiento inteligente: compatibilidad + actividad reciente
        const scoreA = b.compatibility + (isRecentlyActive(b.profile) ? 5 : 0)
        const scoreB = a.compatibility + (isRecentlyActive(a.profile) ? 5 : 0)
        return scoreA - scoreB
      })
      .slice(0, MATCH_CONFIG.maxResults)

    return { success: true, matches }
  } catch (error: any) {
    console.error('Error finding matches:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Calcular compatibilidad entre dos perfiles
 */
function calculateCompatibility(profile1: MatchingProfile, profile2: MatchingProfile): MatchResult {
  let score = 0
  const reasons: string[] = []
  
  // Juegos en común (35% del score)
  const commonGames = profile1.games.filter(game => profile2.games.includes(game))
  if (commonGames.length > 0) {
    const gameScore = 35 * (commonGames.length / Math.max(profile1.games.length, profile2.games.length))
    score += gameScore
    reasons.push(`${commonGames.length} juego(s) en común`)
  }

  // Nivel de habilidad similar (20% del score)
  let skillCompatibility = 0
  let skillComparisons = 0
  commonGames.forEach(game => {
    const skill1 = profile1.skillLevels[game]
    const skill2 = profile2.skillLevels[game]
    if (skill1 && skill2) {
      const skillLevels = ['beginner', 'intermediate', 'advanced', 'pro']
      const diff = Math.abs(skillLevels.indexOf(skill1) - skillLevels.indexOf(skill2))
      if (diff <= MATCH_CONFIG.maxSkillLevelDiff) {
        skillCompatibility += Math.max(0, 1 - (diff / 3))
        skillComparisons++
      }
    }
  })
  if (skillComparisons > 0) {
    score += 20 * (skillCompatibility / skillComparisons)
    reasons.push('Nivel de habilidad compatible')
  }

  // Disponibilidad de tiempo (15% del score)
  const timeCompatibility = calculateTimeCompatibility(profile1.availability, profile2.availability)
  score += 15 * timeCompatibility
  if (timeCompatibility > 0.5) {
    reasons.push('Horarios compatibles')
  }

  // Idiomas en común (10% del score)
  const commonLanguages = profile1.languages.filter(lang => profile2.languages.includes(lang))
  if (commonLanguages.length > 0) {
    score += 10
    reasons.push(`Idioma(s) en común: ${commonLanguages.join(', ')}`)
  }

  // Preferencias de comunicación (10% del score)
  const commPrefs1 = profile1.communicationPrefs
  const commPrefs2 = profile2.communicationPrefs
  let commScore = 0
  if (commPrefs1.voiceChat && commPrefs2.voiceChat) commScore += 3
  if (commPrefs1.discord && commPrefs2.discord) commScore += 3
  if (commPrefs1.inGame && commPrefs2.inGame) commScore += 2
  if (commPrefs1.textOnly && commPrefs2.textOnly) commScore += 2
  
  score += commScore
  if (commScore > 0) {
    reasons.push('Preferencias de comunicación compatibles')
  }

  // Tipo de juego buscado (5% del score)
  if (profile1.lookingFor === profile2.lookingFor || 
      profile1.lookingFor === 'any' || 
      profile2.lookingFor === 'any') {
    score += 5
    reasons.push('Mismo tipo de juego buscado')
  }

  // Actividad reciente (5% del score)
  const now = new Date()
  const daysSinceActive1 = (now.getTime() - profile1.lastActive.toDate().getTime()) / (1000 * 60 * 60 * 24)
  const daysSinceActive2 = (now.getTime() - profile2.lastActive.toDate().getTime()) / (1000 * 60 * 60 * 24)
  
  if (daysSinceActive1 <= MATCH_CONFIG.recentActivityDays && daysSinceActive2 <= MATCH_CONFIG.recentActivityDays) {
    score += 5
    reasons.push('Ambos usuarios activos recientemente')
  }

  // Bonus por compatibilidad perfecta en múltiples áreas
  if (commonGames.length >= 3 && commonLanguages.length >= 2 && timeCompatibility > 0.8) {
    score *= 1.1 // 10% bonus
    reasons.push('Compatibilidad excepcional')
  }

  return {
    profile: profile2,
    compatibility: Math.round(Math.min(100, score)), // Cap at 100
    commonGames,
    reasons
  }
}

/**
 * Verificar si un usuario está activo recientemente
 */
function isRecentlyActive(profile: MatchingProfile): boolean {
  const now = new Date()
  const daysSinceActive = (now.getTime() - profile.lastActive.toDate().getTime()) / (1000 * 60 * 60 * 24)
  return daysSinceActive <= MATCH_CONFIG.recentActivityDays
}

/**
 * Calcular compatibilidad de horarios
 */
function calculateTimeCompatibility(avail1: MatchingProfile['availability'], avail2: MatchingProfile['availability']): number {
  let compatibility = 0
  
  // Días de la semana
  if ((avail1.weekdays && avail2.weekdays) || (avail1.weekends && avail2.weekends)) {
    compatibility += 0.5
  }
  
  // Horarios preferidos
  const commonTimes = avail1.preferredTimes.filter(time => avail2.preferredTimes.includes(time))
  if (commonTimes.length > 0) {
    compatibility += 0.5 * (commonTimes.length / Math.max(avail1.preferredTimes.length, avail2.preferredTimes.length))
  }
  
  return Math.min(1, compatibility)
}

/**
 * Enviar solicitud de match
 */
export async function sendMatchRequest(requestData: Omit<MatchRequest, 'id' | 'createdAt' | 'expiresAt'>): Promise<{ success: boolean; requestId?: string; error?: string; retryId?: string }> {
  try {
    const validation = validateMatchRequest(requestData)
    if (!validation.isValid) {
      return { success: false, error: validation.errors.join(', ') }
    }

    const sanitizedData = validation.sanitizedData as MatchRequest
    
    const requestWithTimestamps = {
      ...sanitizedData,
      createdAt: serverTimestamp(),
      expiresAt: new Date(Date.now() + MATCH_CONFIG.requestExpiryHours * 60 * 60 * 1000)
    }

    const docRef = await addDoc(collection(db, 'matchRequests'), requestWithTimestamps)
    
    // Send push notification to the target user
     try {
       // Get sender's username (you might want to pass this as a parameter)
       const senderName = 'Usuario'; // Replace with actual sender name
       await sendFriendRequestNotification(
         sanitizedData.toUserId,
         senderName,
         sanitizedData.fromUserId
       )
     } catch (notificationError) {
       console.error('Error sending match request notification:', notificationError)
       // Don't fail the request if notification fails
     }
    
    return { 
      success: true, 
      requestId: docRef.id 
    }
  } catch (error: any) {
    console.error('Error sending match request:', error)
    
    const retryId = addRetryOperation.messageSend(requestData.fromUserId, {
      operation: 'sendMatchRequest',
      data: requestData
    }, 'high')
    
    return { 
      success: false, 
      error: error.message,
      retryId 
    }
  }
}

/**
 * Responder a solicitud de match
 */
export async function respondToMatchRequest(requestId: string, response: 'accepted' | 'declined'): Promise<{ success: boolean; error?: string }> {
  try {
    await updateDoc(doc(db, 'matchRequests', requestId), {
      status: response,
      updatedAt: serverTimestamp()
    })
    
    return { success: true }
  } catch (error: any) {
    console.error('Error responding to match request:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Suscribirse a solicitudes de match en tiempo real
 */
export function subscribeToMatchRequests(userId: string, callback: (requests: MatchRequest[]) => void): () => void {
  const q = query(
    collection(db, 'matchRequests'),
    where('toUserId', '==', userId),
    where('status', '==', 'pending'),
    orderBy('createdAt', 'desc')
  )
  
  return onSnapshot(q, (snapshot) => {
    const requests: MatchRequest[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as MatchRequest[]
    
    callback(requests)
  })
}

/**
 * Obtener estadísticas de matching
 */
export async function getMatchingStats(userId: string): Promise<{
  totalMatches: number
  acceptedRequests: number
  sentRequests: number
  profileViews: number
}> {
  try {
    // Solicitudes recibidas y aceptadas
    const receivedQuery = query(
      collection(db, 'matchRequests'),
      where('toUserId', '==', userId)
    )
    const receivedSnapshot = await getDocs(receivedQuery)
    const acceptedRequests = receivedSnapshot.docs.filter(doc => doc.data().status === 'accepted').length
    
    // Solicitudes enviadas
    const sentQuery = query(
      collection(db, 'matchRequests'),
      where('fromUserId', '==', userId)
    )
    const sentSnapshot = await getDocs(sentQuery)
    
    return {
      totalMatches: receivedSnapshot.size,
      acceptedRequests,
      sentRequests: sentSnapshot.size,
      profileViews: 0 // TODO: Implementar tracking de vistas
    }
  } catch (error) {
    console.error('Error getting matching stats:', error)
    return {
      totalMatches: 0,
      acceptedRequests: 0,
      sentRequests: 0,
      profileViews: 0
    }
  }
}

/**
 * Limpiar solicitudes expiradas
 */
export async function cleanupExpiredRequests(): Promise<void> {
  try {
    const expiredQuery = query(
      collection(db, 'matchRequests'),
      where('expiresAt', '<', new Date()),
      where('status', '==', 'pending')
    )
    
    const expiredSnapshot = await getDocs(expiredQuery)
    
    const deletePromises = expiredSnapshot.docs.map(doc => 
      updateDoc(doc.ref, { status: 'expired' })
    )
    
    await Promise.all(deletePromises)
  } catch (error) {
    console.error('Error cleaning up expired requests:', error)
  }
}

/**
 * Buscar matches por ubicación
 */
export async function findMatchesByLocation(
  userId: string, 
  location: { lat: number; lng: number }, 
  radiusKm: number = MATCH_CONFIG.locationRadius
): Promise<{ success: boolean; matches?: MatchResult[]; error?: string }> {
  try {
    // Obtener perfil del usuario
    const userProfileQuery = query(
      collection(db, 'matchingProfiles'),
      where('userId', '==', userId),
      where('isActive', '==', true)
    )
    
    const userProfileSnapshot = await getDocs(userProfileQuery)
    if (userProfileSnapshot.empty) {
      return { success: false, error: 'Perfil de matching no encontrado' }
    }
    
    const userProfile = { 
      id: userProfileSnapshot.docs[0].id, 
      ...userProfileSnapshot.docs[0].data() 
    } as MatchingProfile

    // Buscar perfiles con ubicación
    const locationQuery = query(
      collection(db, 'matchingProfiles'),
      where('isActive', '==', true),
      where('userId', '!=', userId),
      where('location.coordinates', '!=', null)
    )

    const locationSnapshot = await getDocs(locationQuery)
    const nearbyProfiles: MatchingProfile[] = []

    locationSnapshot.docs.forEach(doc => {
      const profile = { id: doc.id, ...doc.data() } as MatchingProfile
      if (profile.location?.coordinates) {
        const distance = calculateDistance(
          location.lat, 
          location.lng,
          profile.location.coordinates.latitude,
          profile.location.coordinates.longitude
        )
        
        if (distance <= radiusKm) {
          nearbyProfiles.push(profile)
        }
      }
    })

    // Calcular compatibilidad
    const matches: MatchResult[] = nearbyProfiles
      .map(profile => {
        const result = calculateCompatibility(userProfile, profile)
        // Bonus por proximidad
        const distance = calculateDistance(
          location.lat, 
          location.lng,
          profile.location!.coordinates!.latitude,
          profile.location!.coordinates!.longitude
        )
        const proximityBonus = Math.max(0, 10 - (distance / radiusKm) * 10)
        result.compatibility += proximityBonus
        result.reasons.push(`A ${distance.toFixed(1)}km de distancia`)
        return result
      })
      .filter(result => result.compatibility >= MATCH_CONFIG.minCompatibility)
      .sort((a, b) => b.compatibility - a.compatibility)
      .slice(0, MATCH_CONFIG.maxResults)

    return { success: true, matches }
  } catch (error: any) {
    console.error('Error finding matches by location:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Calcular distancia entre dos puntos geográficos (fórmula de Haversine)
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Radio de la Tierra en km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

/**
 * Obtener recomendaciones inteligentes basadas en historial
 */
export async function getSmartRecommendations(
  userId: string
): Promise<{ success: boolean; recommendations?: MatchResult[]; error?: string }> {
  try {
    // Obtener historial de matches aceptados
    const acceptedRequestsQuery = query(
      collection(db, 'matchRequests'),
      where('toUserId', '==', userId),
      where('status', '==', 'accepted'),
      orderBy('createdAt', 'desc'),
      limit(10)
    )
    
    const acceptedSnapshot = await getDocs(acceptedRequestsQuery)
    const acceptedMatches = acceptedSnapshot.docs.map(doc => doc.data())
    
    // Analizar patrones de preferencias
    const gamePreferences: { [game: string]: number } = {}
    const skillPreferences: { [skill: string]: number } = {}
    
    acceptedMatches.forEach(match => {
      gamePreferences[match.game] = (gamePreferences[match.game] || 0) + 1
    })
    
    // Buscar matches similares a los aceptados anteriormente
    const preferredGames = Object.keys(gamePreferences)
      .sort((a, b) => gamePreferences[b] - gamePreferences[a])
      .slice(0, 3)
    
    if (preferredGames.length === 0) {
      // Si no hay historial, usar búsqueda normal
      return findMatches(userId)
    }
    
    // Buscar matches para los juegos preferidos
    const recommendations: MatchResult[] = []
    
    for (const game of preferredGames) {
      const gameMatches = await findMatches(userId, game, {
        recentlyActive: true
      })
      
      if (gameMatches.success && gameMatches.matches) {
        recommendations.push(...gameMatches.matches.slice(0, 5))
      }
    }
    
    // Eliminar duplicados y ordenar por compatibilidad
    const uniqueRecommendations = recommendations
      .filter((match, index, self) => 
        index === self.findIndex(m => m.profile.userId === match.profile.userId)
      )
      .sort((a, b) => b.compatibility - a.compatibility)
      .slice(0, MATCH_CONFIG.maxResults)
    
    return { success: true, recommendations: uniqueRecommendations }
  } catch (error: any) {
    console.error('Error getting smart recommendations:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Obtener estadísticas avanzadas de matching
 */
export async function getAdvancedMatchingStats(userId: string): Promise<{
  totalMatches: number
  acceptedRequests: number
  sentRequests: number
  profileViews: number
  averageCompatibility: number
  topGames: { game: string; matches: number }[]
  successRate: number
}> {
  try {
    const basicStats = await getMatchingStats(userId)
    
    // Obtener matches recientes para calcular compatibilidad promedio
    const recentMatchesQuery = query(
      collection(db, 'matchRequests'),
      where('fromUserId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(20)
    )
    
    const recentSnapshot = await getDocs(recentMatchesQuery)
    const recentMatches = recentSnapshot.docs.map(doc => doc.data())
    
    // Calcular estadísticas avanzadas
    const gameStats: { [game: string]: number } = {}
    let totalCompatibility = 0
    let acceptedCount = 0
    
    recentMatches.forEach(match => {
      gameStats[match.game] = (gameStats[match.game] || 0) + 1
      if (match.status === 'accepted') {
        acceptedCount++
      }
    })
    
    const topGames = Object.entries(gameStats)
      .map(([game, matches]) => ({ game, matches }))
      .sort((a, b) => b.matches - a.matches)
      .slice(0, 5)
    
    const successRate = recentMatches.length > 0 ? (acceptedCount / recentMatches.length) * 100 : 0
    
    return {
      ...basicStats,
      averageCompatibility: totalCompatibility / Math.max(1, recentMatches.length),
      topGames,
      successRate
    }
  } catch (error) {
    console.error('Error getting advanced stats:', error)
    return {
      totalMatches: 0,
      acceptedRequests: 0,
      sentRequests: 0,
      profileViews: 0,
      averageCompatibility: 0,
      topGames: [],
      successRate: 0
    }
  }
}