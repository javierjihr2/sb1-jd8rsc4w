"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  createMatchingProfile, 
  updateMatchingProfile,
  findMatches, 
  findMatchesByLocation,
  getSmartRecommendations,
  getAdvancedMatchingStats,
  sendMatchRequest,
  subscribeToMatchRequests,
  respondToMatchRequest,
  getMatchingStats,
  type MatchingProfile,
  type MatchResult,
  type MatchRequest
} from "@/lib/matching-system"
import { 
  Users, 
  Search, 
  Settings, 
  Star, 
  Clock, 
  MapPin, 
  MessageSquare, 
  Check, 
  X, 
  Trophy,
  Gamepad2,
  Heart,
  Filter,
  Sparkles,
  Loader2
} from "lucide-react"
import { useAuth } from "@/app/auth-provider"

const GAMES = [
  'League of Legends',
  'Valorant', 
  'Counter-Strike 2',
  'Dota 2',
  'Overwatch 2',
  'Apex Legends',
  'Fortnite',
  'Rocket League',
  'Call of Duty',
  'FIFA 24'
]

const SKILL_LEVELS = [
  { value: 'beginner', label: 'Principiante' },
  { value: 'intermediate', label: 'Intermedio' },
  { value: 'advanced', label: 'Avanzado' },
  { value: 'pro', label: 'Profesional' }
]

const LANGUAGES = [
  { id: 'es', name: 'Español' },
  { id: 'en', name: 'Inglés' },
  { id: 'pt', name: 'Portugués' },
  { id: 'fr', name: 'Francés' }
]

const PREFERRED_TIMES = [
  { value: 'morning', label: 'Mañana (6-12)' },
  { value: 'afternoon', label: 'Tarde (12-18)' },
  { value: 'evening', label: 'Noche (18-24)' },
  { value: 'night', label: 'Madrugada (0-6)' }
]

const LOOKING_FOR_OPTIONS = [
  { value: 'casual', label: 'Casual' },
  { value: 'competitive', label: 'Competitivo' },
  { value: 'ranked', label: 'Ranked' },
  { value: 'tournaments', label: 'Torneos' },
  { value: 'any', label: 'Cualquiera' }
]

export default function MatchingPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  
  // Estados del perfil
  const [profile, setProfile] = useState<MatchingProfile | null>(null)
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [profileForm, setProfileForm] = useState({
    games: [] as string[],
    skillLevels: {} as { [key: string]: string },
    languages: ['es'],
    availability: {
      timezone: 'America/Argentina/Buenos_Aires',
      preferredTimes: [] as string[],
      weekdays: true,
      weekends: true
    },
    lookingFor: 'any' as string,
    teamSize: 2,
    communicationPrefs: {
      voiceChat: true,
      textOnly: false,
      discord: true,
      inGame: true
    }
  })
  
  // Estados de búsqueda
  const [matches, setMatches] = useState<MatchResult[]>([])
  const [recommendations, setRecommendations] = useState<MatchResult[]>([])
  const [searchFilters, setSearchFilters] = useState({
    game: '',
    skillLevel: '',
    lookingFor: '',
    ageRange: { min: 18, max: 35 },
    languages: [] as string[],
    onlineOnly: false,
    recentlyActive: true,
    communicationPrefs: [] as string[],
    useLocation: false,
    location: { lat: 0, lng: 0 },
    radiusKm: 50
  })
  const [isSearching, setIsSearching] = useState(false)
  const [searchMode, setSearchMode] = useState<'normal' | 'location' | 'smart'>('normal')
  
  // Estados de solicitudes
  const [matchRequests, setMatchRequests] = useState<MatchRequest[]>([])
  const [selectedMatch, setSelectedMatch] = useState<MatchResult | null>(null)
  const [requestMessage, setRequestMessage] = useState('')
  
  // Estados de estadísticas
  const [stats, setStats] = useState({
    totalMatches: 0,
    acceptedRequests: 0,
    sentRequests: 0,
    profileViews: 0,
    averageCompatibility: 0,
    topGames: [] as { game: string; matches: number }[],
    successRate: 0
  })

  useEffect(() => {
    if (user) {
      loadUserStats()
      
      // Suscribirse a solicitudes de match
      const unsubscribe = subscribeToMatchRequests(user.uid, (requests) => {
        setMatchRequests(requests)
      })
      
      return unsubscribe
    }
  }, [user])

  const loadUserStats = async () => {
    if (!user) return
    
    try {
      const result = await getAdvancedMatchingStats(user.uid)
      setStats({
        totalMatches: result.totalMatches || 0,
        acceptedRequests: result.acceptedRequests || 0,
        sentRequests: result.sentRequests || 0,
        profileViews: result.profileViews || 0,
        averageCompatibility: result.averageCompatibility || 0,
        topGames: result.topGames || [],
        successRate: result.successRate || 0
      })
    } catch (error) {
      console.error('Error loading stats:', error)
      // Fallback a estadísticas básicas si falla
      try {
        const basicResult = await getMatchingStats(user.uid)
        setStats({
          totalMatches: basicResult.totalMatches || 0,
          acceptedRequests: basicResult.acceptedRequests || 0,
          sentRequests: basicResult.sentRequests || 0,
          profileViews: basicResult.profileViews || 0,
          averageCompatibility: 0,
          topGames: [],
          successRate: 0
        })
      } catch (fallbackError) {
        console.error('Error loading basic stats:', fallbackError)
      }
    }
  }

  const handleCreateProfile = async () => {
    if (!user) return
    
    try {
      const profileData: Omit<MatchingProfile, 'id' | 'createdAt' | 'updatedAt'> = {
        userId: user.uid,
        username: user.displayName || 'Usuario',
        avatar: user.photoURL || undefined,
        ...profileForm,
        skillLevels: profileForm.skillLevels as { [game: string]: 'beginner' | 'intermediate' | 'advanced' | 'pro' },
        preferredRoles: {}, // Roles preferidos por juego
        lookingFor: profileForm.lookingFor as 'casual' | 'competitive' | 'ranked' | 'tournaments' | 'any',
        ageRange: { min: 18, max: 35 }, // Valores por defecto
        location: undefined, // Opcional
        isActive: true,
        lastActive: new Date() as any // Se reemplazará por serverTimestamp
      }
      
      const result = await createMatchingProfile(profileData)
      
      if (result.success) {
        toast({
          title: "Perfil creado",
          description: "Tu perfil de matching ha sido creado exitosamente"
        })
        setIsEditingProfile(false)
        // Recargar perfil
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudo crear el perfil",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error creating profile:', error)
      toast({
        title: "Error",
        description: "Error inesperado al crear el perfil",
        variant: "destructive"
      })
    }
  }

  const handleSearchMatches = async () => {
    if (!user) return
    
    setIsSearching(true)
    
    try {
      let result: { success: boolean; matches?: MatchResult[]; recommendations?: MatchResult[]; error?: string }
      
      switch (searchMode) {
        case 'location':
          if (searchFilters.useLocation) {
            result = await findMatchesByLocation(
              user.uid, 
              searchFilters.location, 
              searchFilters.radiusKm
            )
          } else {
            // Solicitar ubicación del usuario
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(async (position) => {
                const location = {
                  lat: position.coords.latitude,
                  lng: position.coords.longitude
                }
                const locationResult = await findMatchesByLocation(user.uid, location, searchFilters.radiusKm)
                if (locationResult.success && locationResult.matches) {
                  setMatches(locationResult.matches)
                  toast({
                    title: "Búsqueda por ubicación completada",
                    description: `Se encontraron ${locationResult.matches.length} jugadores cercanos`
                  })
                }
                setIsSearching(false)
              })
              return
            } else {
              throw new Error('Geolocalización no disponible')
            }
          }
          break
          
        case 'smart':
          result = await getSmartRecommendations(user.uid)
          if (result.success && result.recommendations) {
            setRecommendations(result.recommendations)
            setMatches(result.recommendations)
            toast({
              title: "Recomendaciones inteligentes",
              description: `Se encontraron ${result.recommendations.length} recomendaciones personalizadas`
            })
          }
          break
          
        default:
          result = await findMatches(user.uid, searchFilters.game || undefined, {
            skillLevel: searchFilters.skillLevel || undefined,
            lookingFor: searchFilters.lookingFor || undefined,
            ageRange: searchFilters.ageRange,
            languages: searchFilters.languages.length > 0 ? searchFilters.languages : undefined,
            onlineOnly: searchFilters.onlineOnly,
            recentlyActive: searchFilters.recentlyActive,
            communicationPrefs: searchFilters.communicationPrefs.length > 0 ? searchFilters.communicationPrefs : undefined
          })
      }
      
      if (result && result.success && (result.matches || result.recommendations)) {
        const foundMatches = result.matches || result.recommendations || []
        setMatches(foundMatches)
        toast({
          title: "Búsqueda completada",
          description: `Se encontraron ${foundMatches.length} jugadores compatibles`
        })
      } else {
        toast({
          title: "Error en búsqueda",
          description: result?.error || "No se pudo realizar la búsqueda",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error searching matches:', error)
      toast({
        title: "Error",
        description: "Error inesperado en la búsqueda",
        variant: "destructive"
      })
    } finally {
      setIsSearching(false)
    }
  }

  const handleSendMatchRequest = async (targetUserId: string, game: string) => {
    if (!user) return
    
    try {
      const result = await sendMatchRequest({
        fromUserId: user.uid,
        toUserId: targetUserId,
        game,
        message: requestMessage,
        status: 'pending',
        matchType: 'duo'
      })
      
      if (result.success) {
        toast({
          title: "Solicitud enviada",
          description: "Tu solicitud de match ha sido enviada"
        })
        setSelectedMatch(null)
        setRequestMessage('')
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudo enviar la solicitud",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error sending match request:', error)
      toast({
        title: "Error",
        description: "Error inesperado al enviar solicitud",
        variant: "destructive"
      })
    }
  }

  const handleRespondToRequest = async (requestId: string, response: 'accepted' | 'declined') => {
    try {
      const result = await respondToMatchRequest(requestId, response)
      
      if (result.success) {
        toast({
          title: response === 'accepted' ? "Solicitud aceptada" : "Solicitud rechazada",
          description: response === 'accepted' 
            ? "¡Genial! Ahora pueden jugar juntos" 
            : "Solicitud rechazada"
        })
        
        // Actualizar lista de solicitudes
        setMatchRequests(prev => prev.filter(req => req.id !== requestId))
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudo procesar la respuesta",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error responding to request:', error)
      toast({
        title: "Error",
        description: "Error inesperado al responder",
        variant: "destructive"
      })
    }
  }

  const addGameToProfile = (game: string) => {
    if (!profileForm.games.includes(game)) {
      setProfileForm(prev => ({
        ...prev,
        games: [...prev.games, game]
      }))
    }
  }

  const removeGameFromProfile = (game: string) => {
    setProfileForm(prev => ({
      ...prev,
      games: prev.games.filter(g => g !== game)
    }))
  }

  const updateSkillLevel = (game: string, level: string) => {
    setProfileForm(prev => ({
      ...prev,
      skillLevels: {
        ...prev.skillLevels,
        [game]: level
      }
    }))
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Matching de Jugadores</h1>
          <p className="text-muted-foreground">Encuentra compañeros de equipo perfectos</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge variant="secondary">
            <Trophy className="w-4 h-4 mr-1" />
            {stats.acceptedRequests} matches
          </Badge>
          <Badge variant="outline">
            <Users className="w-4 h-4 mr-1" />
            {stats.totalMatches} solicitudes
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="search" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="search">Buscar</TabsTrigger>
          <TabsTrigger value="profile">Mi Perfil</TabsTrigger>
          <TabsTrigger value="requests">Solicitudes ({matchRequests.length})</TabsTrigger>
          <TabsTrigger value="stats">Estadísticas</TabsTrigger>
        </TabsList>

        {/* Pestaña de Búsqueda */}
        <TabsContent value="search" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Search className="w-5 h-5 mr-2" />
                Buscar Compañeros
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Selector de modo de búsqueda */}
              <div className="flex gap-2 mb-4">
                <Button
                  variant={searchMode === 'normal' ? 'default' : 'outline'}
                  onClick={() => setSearchMode('normal')}
                  size="sm"
                >
                  <Search className="mr-2 h-4 w-4" />
                  Búsqueda Normal
                </Button>
                <Button
                  variant={searchMode === 'location' ? 'default' : 'outline'}
                  onClick={() => setSearchMode('location')}
                  size="sm"
                >
                  <MapPin className="mr-2 h-4 w-4" />
                  Por Ubicación
                </Button>
                <Button
                  variant={searchMode === 'smart' ? 'default' : 'outline'}
                  onClick={() => setSearchMode('smart')}
                  size="sm"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Recomendaciones
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Juego</Label>
                  <Select value={searchFilters.game} onValueChange={(value) => 
                    setSearchFilters(prev => ({ ...prev, game: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar juego" />
                    </SelectTrigger>
                    <SelectContent>
                      {GAMES.map(game => (
                        <SelectItem key={game} value={game}>{game}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Nivel de Habilidad</Label>
                  <Select value={searchFilters.skillLevel} onValueChange={(value) => 
                    setSearchFilters(prev => ({ ...prev, skillLevel: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Cualquier nivel" />
                    </SelectTrigger>
                    <SelectContent>
                      {SKILL_LEVELS.map(level => (
                        <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Tipo de Juego</Label>
                  <Select value={searchFilters.lookingFor} onValueChange={(value) => 
                    setSearchFilters(prev => ({ ...prev, lookingFor: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Cualquier tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {LOOKING_FOR_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Filtros avanzados */}
              <div className="border rounded-lg p-4 space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground">Filtros Avanzados</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Rango de edad */}
                  <div>
                    <Label>Rango de edad: {searchFilters.ageRange.min} - {searchFilters.ageRange.max}</Label>
                    <div className="flex gap-2 mt-2">
                      <input
                        type="range"
                        min="18"
                        max="50"
                        value={searchFilters.ageRange.min}
                        onChange={(e) => setSearchFilters(prev => ({
                          ...prev,
                          ageRange: { ...prev.ageRange, min: parseInt(e.target.value) }
                        }))}
                        className="flex-1"
                      />
                      <input
                        type="range"
                        min="18"
                        max="50"
                        value={searchFilters.ageRange.max}
                        onChange={(e) => setSearchFilters(prev => ({
                          ...prev,
                          ageRange: { ...prev.ageRange, max: parseInt(e.target.value) }
                        }))}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  {/* Idiomas */}
                  <div>
                    <Label>Idiomas</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {LANGUAGES.map(lang => (
                        <div key={lang.id} className="flex items-center space-x-2">
                          <Checkbox 
                            checked={searchFilters.languages.includes(lang.id)}
                            onCheckedChange={(checked) => {
                              setSearchFilters(prev => ({
                                ...prev,
                                languages: checked 
                                  ? [...prev.languages, lang.id]
                                  : prev.languages.filter(l => l !== lang.id)
                              }))
                            }}
                          />
                          <Label className="text-sm">{lang.name}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Checkboxes */}
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={searchFilters.onlineOnly}
                      onCheckedChange={(checked) => setSearchFilters(prev => ({
                        ...prev,
                        onlineOnly: !!checked
                      }))}
                    />
                    <Label className="text-sm">Solo jugadores en línea</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={searchFilters.recentlyActive}
                      onCheckedChange={(checked) => setSearchFilters(prev => ({
                        ...prev,
                        recentlyActive: !!checked
                      }))}
                    />
                    <Label className="text-sm">Activos recientemente</Label>
                  </div>
                </div>

                {/* Radio de ubicación (solo para modo ubicación) */}
                {searchMode === 'location' && (
                  <div>
                    <Label>Radio de búsqueda: {searchFilters.radiusKm} km</Label>
                    <input
                      type="range"
                      min="5"
                      max="100"
                      value={searchFilters.radiusKm}
                      onChange={(e) => setSearchFilters(prev => ({
                        ...prev,
                        radiusKm: parseInt(e.target.value)
                      }))}
                      className="w-full mt-2"
                    />
                  </div>
                )}
              </div>
              
              <Button onClick={handleSearchMatches} disabled={isSearching} className="w-full">
                {isSearching ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Buscando...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    {searchMode === 'location' ? 'Buscar por ubicación' : 
                     searchMode === 'smart' ? 'Obtener recomendaciones' : 
                     'Buscar jugadores'}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Resultados de búsqueda */}
          {isSearching ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-3">
                      <div className="flex gap-1">
                        <Skeleton className="h-5 w-16 rounded-full" />
                        <Skeleton className="h-5 w-20 rounded-full" />
                        <Skeleton className="h-5 w-14 rounded-full" />
                      </div>
                      <Skeleton className="h-3 w-full" />
                    </div>
                    
                    <Skeleton className="h-8 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : matches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {matches.map((match, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <Avatar>
                        <AvatarImage src={match.profile.avatar} />
                        <AvatarFallback>{match.profile.username[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-semibold">{match.profile.username}</h3>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Star className="w-3 h-3 mr-1 fill-yellow-400 text-yellow-400" />
                          {match.compatibility}% compatible
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-3">
                      <div className="flex flex-wrap gap-1">
                        {match.commonGames.slice(0, 3).map(game => (
                          <Badge key={game} variant="secondary" className="text-xs">
                            {game}
                          </Badge>
                        ))}
                      </div>
                      
                      <div className="text-xs text-muted-foreground">
                        {match.reasons.slice(0, 2).join(', ')}
                      </div>
                    </div>
                    
                    <Button 
                      size="sm" 
                      className="w-full"
                      onClick={() => setSelectedMatch(match)}
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Enviar Solicitud
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : null}
        </TabsContent>

        {/* Pestaña de Perfil */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  Mi Perfil de Matching
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditingProfile(!isEditingProfile)}
                >
                  {isEditingProfile ? 'Cancelar' : 'Editar'}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {isEditingProfile ? (
                <div className="space-y-6">
                  {/* Selección de juegos */}
                  <div>
                    <Label className="text-base font-semibold">Juegos que juegas</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                      {GAMES.map(game => (
                        <div key={game} className="flex items-center space-x-2">
                          <Checkbox 
                            checked={profileForm.games.includes(game)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                addGameToProfile(game)
                              } else {
                                removeGameFromProfile(game)
                              }
                            }}
                          />
                          <Label className="text-sm">{game}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Niveles de habilidad */}
                  {profileForm.games.length > 0 && (
                    <div>
                      <Label className="text-base font-semibold">Niveles de Habilidad</Label>
                      <div className="space-y-3 mt-2">
                        {profileForm.games.map(game => (
                          <div key={game} className="flex items-center justify-between">
                            <span className="text-sm">{game}</span>
                            <Select 
                              value={profileForm.skillLevels[game] || ''}
                              onValueChange={(value) => updateSkillLevel(game, value)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue placeholder="Nivel" />
                              </SelectTrigger>
                              <SelectContent>
                                {SKILL_LEVELS.map(level => (
                                  <SelectItem key={level.value} value={level.value}>
                                    {level.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Disponibilidad */}
                  <div>
                    <Label className="text-base font-semibold">Disponibilidad</Label>
                    <div className="space-y-3 mt-2">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            checked={profileForm.availability.weekdays}
                            onCheckedChange={(checked) => 
                              setProfileForm(prev => ({
                                ...prev,
                                availability: {
                                  ...prev.availability,
                                  weekdays: !!checked
                                }
                              }))
                            }
                          />
                          <Label>Días de semana</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            checked={profileForm.availability.weekends}
                            onCheckedChange={(checked) => 
                              setProfileForm(prev => ({
                                ...prev,
                                availability: {
                                  ...prev.availability,
                                  weekends: !!checked
                                }
                              }))
                            }
                          />
                          <Label>Fines de semana</Label>
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm">Horarios preferidos</Label>
                        <div className="grid grid-cols-2 gap-2 mt-1">
                          {PREFERRED_TIMES.map(time => (
                            <div key={time.value} className="flex items-center space-x-2">
                              <Checkbox 
                                checked={profileForm.availability.preferredTimes.includes(time.value)}
                                onCheckedChange={(checked) => {
                                  setProfileForm(prev => ({
                                    ...prev,
                                    availability: {
                                      ...prev.availability,
                                      preferredTimes: checked 
                                        ? [...prev.availability.preferredTimes, time.value]
                                        : prev.availability.preferredTimes.filter(t => t !== time.value)
                                    }
                                  }))
                                }}
                              />
                              <Label className="text-xs">{time.label}</Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-4">
                    <Button onClick={handleCreateProfile} className="flex-1">
                      Guardar Perfil
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsEditingProfile(false)}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Gamepad2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Configura tu perfil</h3>
                  <p className="text-muted-foreground mb-4">
                    Crea tu perfil de matching para encontrar compañeros de equipo
                  </p>
                  <Button onClick={() => setIsEditingProfile(true)}>
                    Crear Perfil
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pestaña de Solicitudes */}
        <TabsContent value="requests" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Heart className="w-5 h-5 mr-2" />
                Solicitudes de Match
              </CardTitle>
            </CardHeader>
            <CardContent>
              {matchRequests.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay solicitudes</h3>
                  <p className="text-muted-foreground">
                    Cuando recibas solicitudes de match aparecerán aquí
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {matchRequests.map((request) => (
                    <Card key={request.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Avatar>
                              <AvatarFallback>U</AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className="font-semibold">Solicitud de Match</h4>
                              <p className="text-sm text-muted-foreground">
                                Juego: {request.game}
                              </p>
                              {request.message && (
                                <p className="text-sm mt-1">"{request.message}"</p>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              onClick={() => handleRespondToRequest(request.id!, 'accepted')}
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Aceptar
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleRespondToRequest(request.id!, 'declined')}
                            >
                              <X className="w-4 h-4 mr-1" />
                              Rechazar
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pestaña de Estadísticas */}
        <TabsContent value="stats" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Users className="w-8 h-8 text-blue-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Total Matches</p>
                    <p className="text-2xl font-bold">{stats.totalMatches}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Check className="w-8 h-8 text-green-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Aceptadas</p>
                    <p className="text-2xl font-bold">{stats.acceptedRequests}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <MessageSquare className="w-8 h-8 text-purple-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Enviadas</p>
                    <p className="text-2xl font-bold">{stats.sentRequests}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Trophy className="w-8 h-8 text-yellow-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Tasa de Éxito</p>
                    <p className="text-2xl font-bold">
                      {stats.totalMatches > 0 
                        ? Math.round((stats.acceptedRequests / stats.totalMatches) * 100)
                        : 0
                      }%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Estadísticas avanzadas */}
          {stats?.successRate !== undefined && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Estadísticas Avanzadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-xl font-bold text-cyan-600">
                      {Math.round(stats.averageCompatibility)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Compatibilidad promedio</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-indigo-600">
                      {stats.profileViews}
                    </div>
                    <div className="text-sm text-muted-foreground">Vistas de perfil</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-pink-600">
                      {Math.round(stats.successRate)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Tasa de éxito</div>
                  </div>
                </div>

                {/* Compatibilidad promedio */}
                <div className="mb-4">
                  <h5 className="font-medium mb-2 text-sm">Compatibilidad Promedio</h5>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full" 
                        style={{ width: `${stats.averageCompatibility}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">{Math.round(stats.averageCompatibility)}%</span>
                  </div>
                </div>

                {/* Juegos más populares */}
                {stats.topGames && stats.topGames.length > 0 && (
                  <div>
                    <h5 className="font-medium mb-2 text-sm">Juegos Más Populares</h5>
                    <div className="flex flex-wrap gap-1">
                      {stats.topGames.slice(0, 5).map((gameData) => (
                        <Badge key={gameData.game} variant="outline" className="text-xs">
                          {gameData.game} ({gameData.matches})
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog para enviar solicitud */}
      <Dialog open={!!selectedMatch} onOpenChange={() => setSelectedMatch(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar Solicitud de Match</DialogTitle>
          </DialogHeader>
          
          {selectedMatch && (
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarImage src={selectedMatch.profile.avatar} />
                  <AvatarFallback>{selectedMatch.profile.username[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{selectedMatch.profile.username}</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedMatch.compatibility}% compatible
                  </p>
                </div>
              </div>
              
              <div>
                <Label>Juego</Label>
                <Select defaultValue={selectedMatch.commonGames[0]}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedMatch.commonGames.map(game => (
                      <SelectItem key={game} value={game}>{game}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Mensaje (opcional)</Label>
                <Textarea 
                  placeholder="¡Hola! Me gustaría jugar contigo..."
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  maxLength={500}
                />
              </div>
              
              <div className="flex space-x-2">
                <Button 
                  onClick={() => handleSendMatchRequest(
                    selectedMatch.profile.userId, 
                    selectedMatch.commonGames[0]
                  )}
                  className="flex-1"
                >
                  Enviar Solicitud
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedMatch(null)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}