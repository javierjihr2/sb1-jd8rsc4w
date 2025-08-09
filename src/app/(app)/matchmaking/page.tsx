
"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { friendsForComparison } from "@/lib/data"
import { Search, UserPlus, FileSearch, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

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

export default function MatchmakingPage() {
  const { toast } = useToast()
  // Shuffle the initial list and take a slice to show a random set of players
  const [players, setPlayers] = useState(() => shuffleArray([...friendsForComparison]).slice(0, 6));

  const handleSearchNew = () => {
    setPlayers(shuffleArray([...friendsForComparison]).slice(0, 6));
    toast({
      title: "Búsqueda Actualizada",
      description: "Se han encontrado nuevos jugadores.",
    });
  }

  const handleAddFriend = (playerName: string) => {
    toast({
      title: "Solicitud Enviada",
      description: `Tu solicitud de amistad para ${playerName} ha sido enviada.`,
    })
  }
  
  return (
    <div className="space-y-8">
       <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Search className="w-8 h-8 text-primary"/>
            Matchmaking Inteligente
          </h1>
          <p className="text-muted-foreground">Descubre nuevos jugadores, analiza su potencial y crea el equipo definitivo.</p>
        </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Jugadores Disponibles</CardTitle>
              <CardDescription>Hemos encontrado a estos jugadores para ti. ¡Conecta con ellos!</CardDescription>
            </div>
             <Button onClick={handleSearchNew}>
                <RefreshCw className="mr-2 h-4 w-4"/>
                Buscar Nuevos Jugadores
            </Button>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {players.map(player => (
            <Card key={player.id} className="flex flex-col">
              <CardHeader className="items-center text-center">
                 <Avatar className="h-24 w-24 border-4 border-muted">
                    <AvatarImage src={player.avatarUrl} data-ai-hint="gaming character"/>
                    <AvatarFallback>{player.name.substring(0,2)}</AvatarFallback>
                </Avatar>
                <CardTitle className="pt-2">{player.name}</CardTitle>
                <Badge variant="secondary" className="mt-1">{player.rank}</Badge>
              </CardHeader>
              <CardContent className="text-center text-sm text-muted-foreground flex-1">
                 <p className="mb-4">
                  Armas preferidas: {player.favoriteWeapons.join(', ')}.
                  Activo durante las {player.playSchedule}.
                </p>
              </CardContent>
              <div className="p-4 pt-0 grid grid-cols-2 gap-2">
                <Button onClick={() => handleAddFriend(player.name)}>
                  <UserPlus className="mr-2 h-4 w-4"/>
                  Añadir Amigo
                </Button>
                 <Button asChild variant="outline">
                    <Link href={`/compare?player1=${"p1"}&player2=${player.id}`}>
                        <FileSearch className="mr-2 h-4 w-4"/>
                        Comparar
                    </Link>
                </Button>
              </div>
            </Card>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
