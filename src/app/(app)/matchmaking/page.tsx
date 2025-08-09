
"use client"

import { useState } from "react"
import Image from "next/image"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { friendsForComparison } from "@/lib/data"
import { Search, Heart, X, BarChartHorizontal, Users, Filter } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { AddFriendDialog } from "@/components/add-friend-dialog" // Reutilizaremos este diálogo para los filtros

// Helper to shuffle an array
const shuffleArray = (array: any[]) => {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
}

const mapBackgrounds: {[key: string]: string} = {
    erangel: 'https://placehold.co/600x400.png',
    miramar: 'https://placehold.co/600x400.png',
    sanhok: 'https://placehold.co/600x400.png',
    vikendi: 'https://placehold.co/600x400.png',
    livik: 'https://placehold.co/600x400.png',
}

export default function MatchmakingPage() {
  const { toast } = useToast()
  const [availablePlayers] = useState(() => shuffleArray([...friendsForComparison.filter(p => p.id !== 'p1')]));
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNextPlayer = () => {
    setCurrentIndex(prev => (prev + 1) % availablePlayers.length);
  }

  const handleAddFriend = (playerName: string) => {
    toast({
      title: "Solicitud Enviada",
      description: `Has mostrado interés en ${playerName}. ¡Le enviaremos una notificación!`,
    })
    handleNextPlayer();
  }
  
  const currentPlayer = availablePlayers[currentIndex];

  return (
    <div className="space-y-8 flex flex-col items-center">
       <div className="text-center">
          <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
            <Search className="w-8 h-8 text-primary"/>
            Descubrir Jugadores
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">Explora perfiles de la comunidad. Envía una solicitud de amistad o analiza la sinergia para encontrar a tu compañero de equipo ideal.</p>
        </div>
        
        <div className="flex justify-center w-full">
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


      {currentPlayer ? (
        <Card className="w-full max-w-md overflow-hidden animate-in fade-in-50">
           <CardHeader className="p-0 relative h-40">
                <Image 
                    src={mapBackgrounds[currentPlayer.favoriteMap] || 'https://placehold.co/600x400.png'} 
                    alt="Mapa favorito" 
                    width={600} 
                    height={400} 
                    className="w-full h-full object-cover"
                    data-ai-hint={`${currentPlayer.favoriteMap} map`}
                />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"/>
                <Avatar className="h-28 w-28 border-4 border-background absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 ring-2 ring-primary">
                    <AvatarImage src={currentPlayer.avatarUrl} data-ai-hint="gaming character"/>
                    <AvatarFallback>{currentPlayer.name.substring(0,2)}</AvatarFallback>
                </Avatar>
            </CardHeader>
            <CardContent className="pt-16 text-center">
                <CardTitle className="text-2xl">{currentPlayer.name}</CardTitle>
                <Badge variant="secondary" className="mt-1">{currentPlayer.rank}</Badge>

                <p className="text-sm text-muted-foreground mt-3 h-10">
                    "{currentPlayer.bio}"
                </p>

                <div className="space-y-3 mt-4 text-left text-sm">
                    <div>
                        <div className="flex justify-between mb-1">
                            <span>Victorias</span>
                            <span className="font-semibold">{currentPlayer.stats.wins}</span>
                        </div>
                        <Progress value={(currentPlayer.stats.wins / 200) * 100} className="h-2"/>
                    </div>
                     <div>
                        <div className="flex justify-between mb-1">
                            <span>Ratio K/D</span>
                            <span className="font-semibold">{currentPlayer.stats.kdRatio}</span>
                        </div>
                        <Progress value={(currentPlayer.stats.kdRatio / 10) * 100} className="h-2"/>
                    </div>
                </div>
                
                 <div className="text-xs text-muted-foreground pt-4">
                    <p><strong>Armas preferidas:</strong> {currentPlayer.favoriteWeapons.join(', ')}</p>
                </div>
            </CardContent>
            <div className="p-4 pt-2 grid grid-cols-3 gap-2">
                <Button variant="outline" size="lg" className="bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20 hover:text-red-600" onClick={handleNextPlayer}>
                    <X className="h-6 w-6"/>
                </Button>
                <Button asChild variant="outline" size="lg">
                    <Link href={`/compare?player1=p1&player2=${currentPlayer.id}`}>
                        <BarChartHorizontal className="h-6 w-6"/>
                    </Link>
                </Button>
                <Button variant="outline" size="lg" className="bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20 hover:text-green-600" onClick={() => handleAddFriend(currentPlayer.name)}>
                    <Heart className="h-6 w-6"/>
                </Button>
            </div>
        </Card>
      ) : (
         <Card className="w-full max-w-md h-96 flex flex-col items-center justify-center text-center p-8 border-dashed">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold">No hay más jugadores</h3>
            <p className="text-muted-foreground">Has visto todos los perfiles disponibles. ¡Vuelve más tarde para descubrir nuevos jugadores!</p>
        </Card>
      )}
    </div>
  )
}
