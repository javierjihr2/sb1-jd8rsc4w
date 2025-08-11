
"use client"

import { useState, useMemo } from "react"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { friendsForComparison, playerProfile, addChat } from "@/lib/data"
import { Search, Filter, Users, Wifi, X, MessageSquare, Sparkles, Swords, UserPlus, Heart, MapPin } from "lucide-react"
import { useRouter } from "next/navigation"
import { AddFriendDialog } from "@/components/add-friend-dialog"
import type { PlayerProfileInput, IcebreakerInput, IcebreakerOutput } from "@/ai/schemas"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { generateIcebreaker } from "@/ai/flows/icebreakerFlow"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"


// --- Helper Functions ---

// Función para calcular la distancia (simulada)
const getDistance = (coords1: {lat: number, lon: number}, coords2: {lat: number, lon: number}) => {
  const dx = coords1.lon - coords2.lon;
  const dy = coords1.lat - coords2.lat;
  const dist = Math.sqrt(dx*dx + dy*dy) * 111; // Factor de conversión aproximado
  return dist;
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
  const router = useRouter();
  const { toast } = useToast();
  
  const allPlayers = useMemo(() => {
    const otherPlayers = friendsForComparison.filter(p => p.id !== playerProfile.id);
    return shuffleArray(otherPlayers).map(p => ({
      ...p,
      distance: getDistance(playerProfile.location, p.location),
      compatibility: Math.floor(Math.random() * (95 - 75 + 1)) + 75, // Simulated score
    }));
  }, []);
  
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerProfileInput & { compatibility: number, distance: number } | null>(null);
  const [isMatched, setIsMatched] = useState(false);
  const [icebreaker, setIcebreaker] = useState<IcebreakerOutput | null>(null);
  const [isIcebreakerLoading, setIsIcebreakerLoading] = useState(false);

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


  const handleLike = (player: PlayerProfileInput) => {
    setIsMatched(true);
    toast({
      title: "¡Conexión Exitosa! ⚔️",
      description: `Ahora puedes chatear con ${player.name}.`,
    });
  };

  const handleOpenDialog = (player: PlayerProfileInput & { compatibility: number, distance: number }) => {
    setSelectedPlayer(player);
    setIsMatched(false);
    setIcebreaker(null);
  };
  
  const handleCloseDialog = () => {
      setSelectedPlayer(null);
  }

  const handleStartChat = () => {
    if (!selectedPlayer) return;
    
    addChat({
        id: `chat_${Date.now()}`,
        name: selectedPlayer.name,
        avatarUrl: selectedPlayer.avatarUrl,
        unread: true,
        lastMessageTimestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        messages: [{
            sender: 'other',
            text: `¡Hola! Hicimos match en SquadUp. ¿Listo para unas partidas?`
        }]
    });

    router.push('/chats');
  };
  
  const handleGenerateIcebreaker = async () => {
      if (!selectedPlayer) return;
      setIsIcebreakerLoading(true);
      
      const input: IcebreakerInput = {
          player1: {
              name: playerProfile.name,
              rank: playerProfile.rank,
              favoriteMap: 'Erangel', // Dato de ejemplo
              favoriteWeapons: ['M416', 'Kar98k'], // Dato de ejemplo
          },
          player2: {
              name: selectedPlayer.name,
              rank: selectedPlayer.rank,
              favoriteMap: selectedPlayer.favoriteMap,
              favoriteWeapons: selectedPlayer.favoriteWeapons,
          }
      };

      try {
          const result = await generateIcebreaker(input);
          setIcebreaker(result);
      } catch (error) {
          toast({ variant: 'destructive', title: 'Error de IA', description: 'No se pudieron generar los mensajes. Inténtalo de nuevo.'})
      } finally {
          setIsIcebreakerLoading(false);
      }
  }

  const PlayerGrid = ({ players }: { players: typeof allPlayers }) => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {players.map(player => (
        <DialogTrigger asChild key={player.id} onClick={() => handleOpenDialog(player as any)}>
          <div className="group cursor-pointer">
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
        </DialogTrigger>
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

        <Dialog onOpenChange={(isOpen) => !isOpen && setSelectedPlayer(null)}>
        <TabsContent value="foryou">
          <PlayerGrid players={allPlayers} />
        </TabsContent>

        <TabsContent value="nearby">
          <PlayerGrid players={playersByDistance} />
        </TabsContent>
        
        <TabsContent value="country">
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
        </TabsContent>

        {selectedPlayer && (
             <DialogContent className="max-w-md p-0 overflow-hidden">
                <div className="relative">
                    <Image src={selectedPlayer.avatarUrl} alt={selectedPlayer.name} width={400} height={400} className="w-full h-64 object-cover" data-ai-hint="gaming character"/>
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
                            <p><strong>Armas preferidas:</strong> {selectedPlayer.favoriteWeapons.join(', ')}</p>
                            <p><strong>Mapa favorito:</strong> <span className="capitalize">{selectedPlayer.favoriteMap}</span></p>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between mb-1 text-xs"><span>Victorias</span><span className="font-semibold">{selectedPlayer.stats.wins}</span></div>
                        <Progress value={(selectedPlayer.stats.wins / 200) * 100} className="h-2"/>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between mb-1 text-xs"><span>Ratio K/D</span><span className="font-semibold">{selectedPlayer.stats.kdRatio}</span></div>
                        <Progress value={(selectedPlayer.stats.kdRatio / 10) * 100} className="h-2"/>
                    </div>
                    {icebreaker && !isIcebreakerLoading && (
                         <Alert>
                            <Sparkles className="h-4 w-4" />
                            <AlertTitle>¡Rompe el Hielo!</AlertTitle>
                            <AlertDescription className="space-y-2">
                                {icebreaker.messages.map((msg, i) => <p key={i}>- "{msg}"</p>)}
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
                     {isMatched ? (
                        <Button variant="default" size="icon" className="h-14 w-14 rounded-full bg-green-500 hover:bg-green-600 text-white" onClick={handleStartChat}>
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
    </div>
  )
}
