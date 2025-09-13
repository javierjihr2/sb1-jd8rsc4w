
"use client"

import { useState, useMemo, useCallback, memo, useEffect } from "react"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Search, Filter, Users, Wifi, X, MessageSquare, Sparkles, Swords, UserPlus, Heart, MapPin, AlertTriangle, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { AddFriendDialog } from "@/components/add-friend-dialog"
import { MatchModal } from "@/components/match-modal"
import type { PlayerProfile, Match, MatchStatus } from "@/lib/types"
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { usePermissions } from "@/hooks/use-permissions"
import { CompactPermissionsDialog } from "@/components/compact-permissions-dialog"
import { LocationStatus } from "@/components/location-status"
import { useStartMatchmaking, useMatchmakingStatus, useCancelMatchmaking } from "@/hooks/use-matchmaking"
import { useUserStore } from "@/store"
import type { IcebreakerOutput } from "@/ai/schemas"


// --- Helper Functions ---

// Función para calcular la distancia usando la fórmula de Haversine
const getDistance = (coords1: {lat: number, lon: number}, coords2: {lat: number, lon: number}) => {
  const R = 6371; // Radio de la Tierra en kilómetros
  const dLat = (coords2.lat - coords1.lat) * Math.PI / 180;
  const dLon = (coords2.lon - coords1.lon) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(coords1.lat * Math.PI / 180) * Math.cos(coords2.lat * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distancia en kilómetros
  return Math.round(distance * 10) / 10; // Redondear a 1 decimal
}

// Función para barajar un array
const shuffleArray = (array: any[]) => {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
}

// --- Componente Principal ---

export default function MatchmakingPage() {
  const { user } = useUserStore()
  const router = useRouter();
  const { toast } = useToast();
  const { permissions, requestLocationPermission, checkAllPermissions } = usePermissions();
  const startMatchmakingMutation = useStartMatchmaking();
  const { currentTicket, isSearching, isLoading: isMatchmakingLoading, error: matchmakingError } = useMatchmakingStatus();
  const cancelMatchmakingMutation = useCancelMatchmaking();
  
  // Mock data temporales para compilación
  const players: PlayerProfile[] = [];
  const sendConnectionRequest = { mutateAsync: async (params: any) => ({ type: 'pending', match: null }) };
  const isLoading = false;
  
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerProfile & { compatibility: number, distance: number } | null>(null);
  const [newMatch, setNewMatch] = useState<Match | null>(null);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [isMatched, setIsMatched] = useState(false);
  const [icebreaker, setIcebreaker] = useState<IcebreakerOutput | null>(null);
  const [isIcebreakerLoading, setIsIcebreakerLoading] = useState(false);
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [connectionStatuses, setConnectionStatuses] = useState<Record<string, 'sent' | 'matched'>>({});
  
  // Verificar permisos de ubicación al cargar la página
  useEffect(() => {
    const checkLocationPermission = async () => {
      try {
        await checkAllPermissions();
        if (permissions.location) {
          setLocationEnabled(true);
        } else {
          setShowPermissionsDialog(true);
        }
      } catch (error) {
        console.error('Error checking location permission:', error);
      }
    };
    
    checkLocationPermission();
  }, [checkAllPermissions, permissions.location]);
  
  const allPlayers = useMemo(() => {
    if (!user || !players) return [];
    return shuffleArray(players.filter(p => p.id !== user.uid)).map(p => ({
      ...p,
      distance: locationEnabled ? getDistance({lat: 0, lon: 0}, {lat: 0, lon: 0}) : Math.random() * 50,
      compatibility: Math.floor(Math.random() * (95 - 75 + 1)) + 75, // Simulated score
    }));
  }, [locationEnabled, players, user]);

  // Lógica de ordenamiento y agrupación
  const playersByDistance = useMemo(() => [...allPlayers].sort((a, b) => a.distance - b.distance), [allPlayers]);
  
  const playersByCountry = useMemo(() => {
      const grouped: { [key: string]: typeof allPlayers } = {};
      allPlayers.forEach(p => {
          if (!grouped[p.countryCode]) {
              grouped[p.countryCode] = [];
          }
          grouped[p.countryCode].push(p);
      });
      return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));
  }, [allPlayers]);


  const handleLike = useCallback(async (player: PlayerProfile) => {
    if (!user) return;
    
    try {
      const result = await sendConnectionRequest.mutateAsync({
        targetUserId: player.id
      });
      
      if (result.type === 'match') {
        // ¡Match mutuo!
        setNewMatch(result.match!);
        setShowMatchModal(true);
        toast({
          title: "¡MATCH! 🎉",
          description: `¡Ambos se conectaron! Ahora pueden chatear.`,
        });
      } else if (result.type === 'request_sent') {
        // Solicitud enviada
        setConnectionStatuses(prev => ({
          ...prev,
          [player.id]: 'sent'
        }));
        toast({
          title: "Solicitud enviada 📤",
          description: `Solicitud de conexión enviada a ${player.name}.`,
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo enviar la solicitud de conexión.",
        variant: "destructive"
      });
    }
  }, [user, sendConnectionRequest, toast]);

  const handleOpenDialog = useCallback((player: PlayerProfile & { compatibility: number, distance: number }) => {
    setSelectedPlayer(player);
    setIsMatched(false);
    setIcebreaker(null);
  }, []);
  
  const handleCloseDialog = useCallback(() => {
      setSelectedPlayer(null);
  }, []);

  const handleStartChat = useCallback(() => {
    if (!newMatch || !user) return;
    
    const otherUser = newMatch.user1.id === user.uid ? newMatch.user2 : newMatch.user1;
    
    // Navigate to chat with the matched user
    setShowMatchModal(false);
    router.push(`/chats/${otherUser.id}`);
  }, [newMatch, user, router]);
  
  const handleRequestLocationPermission = async () => {
    try {
      const permission = await requestLocationPermission();
      if (permission) {
        setLocationEnabled(true);
        setShowPermissionsDialog(false);
        toast({
          title: "¡Ubicación activada! 📍",
          description: "Ahora puedes ver jugadores cercanos con mayor precisión.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Permiso denegado",
          description: "Para una mejor experiencia de matchmaking, activa la ubicación.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo acceder a la ubicación.",
      });
    }
  };

  const handleGenerateIcebreaker = async () => {
      if (!selectedPlayer || !user) return;
      setIsIcebreakerLoading(true);
      
      const input = {
          player1: {
              name: user.displayName || 'Usuario',
              rank: 'Bronce',
              favoriteMap: 'Erangel',
              favoriteWeapons: ['AKM'],
          },
          player2: {
              name: selectedPlayer.name,
              rank: selectedPlayer.rank,
              favoriteMap: selectedPlayer.favoriteMap,
              favoriteWeapons: selectedPlayer.favoriteWeapons,
          }
      };

      try {
          const response = await fetch('/api/generate-icebreaker', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify(input),
          });
          
          if (!response.ok) {
              throw new Error('Failed to generate icebreaker');
          }
          
          const result = await response.json();
          setIcebreaker(result);
      } catch (error) {
          toast({ variant: 'destructive', title: 'Error de IA', description: 'No se pudieron generar los mensajes. Inténtalo de nuevo.'})
      } finally {
          setIsIcebreakerLoading(false);
      }
  }

  const PlayerGridSkeleton = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index}>
          <Card className="overflow-hidden relative aspect-[3/4]">
            <Skeleton className="w-full h-full absolute inset-0" />
            <div className="absolute top-2 left-2 flex flex-col gap-1.5">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <Skeleton className="h-5 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2 mb-1" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </Card>
        </div>
      ))}
    </div>
  );

  const PlayerGrid = ({ players }: { players: typeof allPlayers }) => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {players.map(player => (
        <div key={player.id} className="group cursor-pointer" onClick={() => handleOpenDialog(player)}>
          <Card className="overflow-hidden relative aspect-[3/4] transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <Image src={player.avatarUrl} alt={player.name} width={300} height={400} className="w-full h-full object-cover absolute inset-0 transition-transform duration-300 group-hover:scale-105" data-ai-hint="gaming character" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            <div className="absolute top-2 left-2 flex flex-col gap-1.5">
              <Badge variant="secondary" className="bg-green-500/20 text-green-300 border-green-500/30 backdrop-blur-sm">
                <Wifi className="w-3 h-3 mr-1.5 animate-pulse"/> En línea
              </Badge>
              <Badge variant="secondary" className="bg-primary/20 text-primary-foreground border-primary/30 backdrop-blur-sm">
                <Users className="w-3 h-3 mr-1.5"/> {player.compatibility}%
              </Badge>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
              <h3 className="font-bold text-lg truncate">{player.name}</h3>
              <p className="text-sm text-amber-300">{player.rank}</p>
              <p className="text-xs text-white/80">{player.distance.toFixed(1)} km de ti</p>
            </div>
          </Card>
        </div>
      ))}
    </div>
  );


  return (
    <div className="space-y-8">
       <div className="text-center">
          <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
            <Search className="w-8 h-8 text-primary"/>
            Descubrir Jugadores
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">Explora perfiles de la comunidad, haz match y contacta para jugar. ¡Tu próximo dúo dinámico está a solo un clic!</p>
        </div>
        
        {!locationEnabled ? (
          <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800 dark:text-amber-200">Ubicación desactivada</AlertTitle>
            <AlertDescription className="text-amber-700 dark:text-amber-300">
              Para encontrar jugadores cercanos con mayor precisión, activa los permisos de ubicación.
              <Button 
                variant="link" 
                className="p-0 h-auto text-amber-800 dark:text-amber-200 underline ml-1"
                onClick={handleRequestLocationPermission}
              >
                Activar ubicación
              </Button>
            </AlertDescription>
          </Alert>
        ) : (
          <div className="mb-4">
            <LocationStatus />
          </div>
        )}
        
      <Tabs defaultValue="foryou" className="w-full">
        <div className="flex justify-center mb-6">
            <TabsList>
                <TabsTrigger value="foryou">Para Ti</TabsTrigger>
                <TabsTrigger value="nearby">Cercanos</TabsTrigger>
                <TabsTrigger value="country">Por País</TabsTrigger>
            </TabsList>
             <div className="ml-4">
                <AddFriendDialog
                triggerButton={
                    <Button variant="outline">
                    <Filter className="mr-2 h-4 w-4" />
                    Filtros
                    </Button>
                }
                isFilterDialog={true}
                />
            </div>
        </div>

        <TabsContent value="foryou">
          {isMatchmakingLoading ? (
            <PlayerGridSkeleton />
          ) : matchmakingError ? (
            <div className="flex items-center justify-center py-12 text-red-500">
              <AlertTriangle className="h-8 w-8 mr-2" />
              <span>Error: {matchmakingError}</span>
            </div>
          ) : (
            <PlayerGrid players={allPlayers} />
          )}
        </TabsContent>

        <TabsContent value="nearby">
          {isMatchmakingLoading ? (
            <PlayerGridSkeleton />
          ) : matchmakingError ? (
            <div className="flex items-center justify-center py-12 text-red-500">
              <AlertTriangle className="h-8 w-8 mr-2" />
              <span>Error: {matchmakingError}</span>
            </div>
          ) : (
            <PlayerGrid players={playersByDistance} />
          )}
        </TabsContent>
        
        <TabsContent value="country">
          {isMatchmakingLoading ? (
            <div className="space-y-6">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index}>
                  <div className="flex items-center gap-3 mb-4">
                    <Skeleton className="w-8 h-6 rounded-md" />
                    <Skeleton className="h-8 w-32" />
                  </div>
                  <PlayerGridSkeleton />
                </div>
              ))}
            </div>
          ) : matchmakingError ? (
            <div className="flex items-center justify-center py-12 text-red-500">
              <AlertTriangle className="h-8 w-8 mr-2" />
              <span>Error: {matchmakingError}</span>
            </div>
          ) : (
            <div className="space-y-6">
              {playersByCountry.map(([countryCode, players]) => (
                <div key={countryCode}>
                   <div className="flex items-center gap-3 mb-4">
                      <Image src={`https://flagsapi.com/${countryCode}/shiny/64.png`} alt={`${countryCode} flag`} width={32} height={24} className="rounded-md shadow-md"/>
                      <h2 className="text-2xl font-bold">{players[0].countryCode}</h2>
                  </div>
                  <PlayerGrid players={players} />
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <Dialog open={selectedPlayer !== null} onOpenChange={(isOpen) => { if (!isOpen) setSelectedPlayer(null); }}>

        {selectedPlayer && (
             <DialogContent className="max-w-md p-0 overflow-hidden">
                <DialogTitle className="sr-only">Perfil de {selectedPlayer.name}</DialogTitle>
                <div className="relative">
                    <Image src={selectedPlayer.avatarUrl || '/default-avatar.png'} alt={selectedPlayer.name || 'Usuario'} width={400} height={400} className="w-full h-64 object-cover" data-ai-hint="gaming character"/>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                    <div className="absolute bottom-4 left-4 text-white">
                        <h2 className="text-3xl font-bold">{selectedPlayer.name}</h2>
                        <p className="text-amber-400">{selectedPlayer.rank}</p>
                    </div>
                    <div className="absolute top-4 right-4">
                        <Badge variant="secondary" className="bg-primary/20 text-primary-foreground border-primary/30 backdrop-blur-sm">
                            <Heart className="w-4 h-4 mr-2"/>
                            {selectedPlayer.compatibility}% Compatible
                        </Badge>
                    </div>
                </div>
                <div className="p-6 pt-4 space-y-4">
                    <div className="space-y-3 text-sm">
                        <p className="text-muted-foreground h-16 line-clamp-3">{selectedPlayer.bio}</p>
                        <div>
                            <p><strong>Armas preferidas:</strong> {(selectedPlayer.favoriteWeapons || []).join(', ')}</p>
                            <p><strong>Mapa favorito:</strong> <span className="capitalize">{selectedPlayer.favoriteMap}</span></p>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between mb-1 text-xs"><span>Victorias</span><span className="font-semibold">{selectedPlayer.stats.wins}</span></div>
                        <Progress value={(selectedPlayer.stats.wins / 200) * 100} className="h-2"/>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between mb-1 text-xs"><span>Ratio K/D</span><span className="font-semibold">{selectedPlayer.stats.kda}</span></div>
                        <Progress value={(selectedPlayer.stats.kda / 10) * 100} className="h-2"/>
                    </div>
                    {icebreaker && !isIcebreakerLoading && (
                         <Alert>
                            <Sparkles className="h-4 w-4" />
                            <AlertTitle>¡Rompe el Hielo!</AlertTitle>
                            <AlertDescription className="space-y-2">
                                {icebreaker.messages.map((msg: string, i: number) => <p key={i}>- "{msg}"</p>)}
                            </AlertDescription>
                        </Alert>
                    )}
                    {isIcebreakerLoading && (
                        <div className="flex items-center justify-center gap-2 text-muted-foreground p-4">
                            <Loader2 className="animate-spin h-5 w-5"/>
                            <span>La IA está pensando en algo genial que decir...</span>
                        </div>
                    )}
                </div>
                <div className="bg-card border-t p-4 flex justify-around items-center gap-4">
                    <Button variant="outline" size="icon" className="h-14 w-14 rounded-full border-red-500/50 text-red-500 hover:bg-red-500/10 hover:text-red-600" onClick={handleCloseDialog}>
                        <X className="h-7 w-7"/>
                    </Button>
                    <Button variant="outline" size="icon" className="h-16 w-16 rounded-full border-primary/50 text-primary hover:bg-primary/10 hover:text-primary shadow-lg" onClick={handleGenerateIcebreaker}>
                        <Sparkles className="h-8 w-8"/>
                    </Button>
                     {connectionStatuses[selectedPlayer?.id || ''] === 'sent' ? (
                        <Button variant="outline" size="icon" className="h-14 w-14 rounded-full border-yellow-500/50 text-yellow-600" disabled>
                            <UserPlus className="h-7 w-7"/>
                        </Button>
                     ) : connectionStatuses[selectedPlayer?.id || ''] === 'matched' ? (
                        <Button variant="default" size="icon" className="h-14 w-14 rounded-full bg-green-500 hover:bg-green-600 text-white" disabled>
                            <MessageSquare className="h-7 w-7"/>
                        </Button>
                     ) : (
                        <Button variant="default" size="icon" className="h-14 w-14 rounded-full bg-blue-500 hover:bg-blue-600 text-white" onClick={() => handleLike(selectedPlayer)}>
                            <Swords className="h-7 w-7"/>
                        </Button>
                     )}
                </div>
             </DialogContent>
        )}
      </Dialog>
      </Tabs>
      
      <CompactPermissionsDialog
        open={showPermissionsDialog}
        onOpenChange={setShowPermissionsDialog}
        onComplete={() => {
          setShowPermissionsDialog(false);
        }}
        onClose={() => {
          setShowPermissionsDialog(false);
        }}
      />
      
      <MatchModal
        isOpen={showMatchModal}
        onClose={() => setShowMatchModal(false)}
        match={newMatch}
        onStartChat={handleStartChat}
      />
    </div>
  )
}
