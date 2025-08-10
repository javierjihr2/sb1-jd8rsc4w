
"use client"

import { useState } from "react"
import Image from "next/image"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { friendsForComparison } from "@/lib/data"
import { Search, Filter, Users, Wifi } from "lucide-react"
import Link from "next/link"
import { AddFriendDialog } from "@/components/add-friend-dialog"

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
  const [availablePlayers] = useState(() => shuffleArray([...friendsForComparison.filter(p => p.id !== 'p1')]));
  
  return (
    <div className="space-y-8">
       <div className="text-center">
          <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
            <Search className="w-8 h-8 text-primary"/>
            Descubrir Jugadores
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">Explora perfiles de la comunidad. Usa la IA para romper el hielo o analiza la sinergia para encontrar a tu compañero ideal.</p>
        </div>
        
        <Card className="sticky top-[58px] z-10">
          <CardContent className="p-4 flex justify-center">
             <AddFriendDialog
              triggerButton={
                <Button variant="outline">
                  <Filter className="mr-2 h-4 w-4" />
                  Filtros Avanzados
                </Button>
              }
              isFilterDialog={true}
            />
          </CardContent>
        </Card>
      
      {availablePlayers.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {availablePlayers.map(player => (
                 <Link href={`/profile/${player.id}`} key={player.id} className="group">
                    <Card className="overflow-hidden relative aspect-[3/4] transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                        <Image 
                            src={player.avatarUrl} 
                            alt={player.name}
                            width={300}
                            height={400}
                            className="w-full h-full object-cover absolute inset-0 transition-transform duration-300 group-hover:scale-105"
                            data-ai-hint="gaming character"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                        <div className="absolute top-2 left-2">
                            <Badge variant="secondary" className="bg-green-500/20 text-green-300 border-green-500/30 backdrop-blur-sm">
                                <Wifi className="w-3 h-3 mr-1.5 animate-pulse"/>
                                En línea
                            </Badge>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                           <h3 className="font-bold text-lg truncate">{player.name}</h3>
                           <p className="text-sm text-amber-300">{player.rank}</p>
                        </div>
                    </Card>
                </Link>
            ))}
        </div>
      ) : (
         <Card className="w-full h-96 flex flex-col items-center justify-center text-center p-8 border-dashed">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold">No hay más jugadores</h3>
            <p className="text-muted-foreground">Has visto todos los perfiles disponibles. ¡Vuelve más tarde para descubrir nuevos jugadores!</p>
        </Card>
      )}
    </div>
  )
}

    