
"use client"

import { useState } from "react"
import Image from "next/image"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { friendsForComparison } from "@/lib/data"
import { Search, MessageSquare, X, BarChartHorizontal, Users, Filter, Sparkles, Loader2, ClipboardCopy, Terminal } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { AddFriendDialog } from "@/components/add-friend-dialog"
import { generateIcebreaker } from "@/ai/flows/icebreakerFlow"
import type { IcebreakerOutput } from "@/ai/schemas"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

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

  const [isIcebreakerLoading, setIsIcebreakerLoading] = useState(false);
  const [icebreakerResult, setIcebreakerResult] = useState<IcebreakerOutput | null>(null);
  const [icebreakerError, setIcebreakerError] = useState<string | null>(null);
  const [isIcebreakerDialogOpen, setIsIcebreakerDialogOpen] = useState(false);


  const handleNextPlayer = () => {
    setCurrentIndex(prev => (prev + 1) % availablePlayers.length);
  }

  const handleConnect = async (targetPlayer: any) => {
    setIsIcebreakerLoading(true);
    setIcebreakerError(null);
    setIcebreakerResult(null);
    setIsIcebreakerDialogOpen(true);

    try {
      const player1 = friendsForComparison.find(f => f.id === 'p1');
      if (!player1) throw new Error("Current user profile not found");
      
      const result = await generateIcebreaker({
          player1: { name: player1.name, rank: player1.rank, favoriteWeapons: player1.favoriteWeapons, favoriteMap: player1.favoriteMap },
          player2: { name: targetPlayer.name, rank: targetPlayer.rank, favoriteWeapons: targetPlayer.favoriteWeapons, favoriteMap: targetPlayer.favoriteMap },
      });
      setIcebreakerResult(result);
    } catch (e: any) {
        setIcebreakerError("Hubo un error al generar el rompehielos. Por favor, inténtalo de nuevo.");
        console.error(e);
    } finally {
        setIsIcebreakerLoading(false);
    }
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado",
      description: "¡Mensaje copiado! Ahora puedes pegarlo en un chat.",
    })
  }

  const currentPlayer = availablePlayers[currentIndex];

  return (
    <>
    <div className="space-y-8 flex flex-col items-center">
       <div className="text-center">
          <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
            <Search className="w-8 h-8 text-primary"/>
            Descubrir Jugadores
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">Explora perfiles de la comunidad. Usa la IA para romper el hielo o analiza la sinergia para encontrar a tu compañero ideal.</p>
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
                <Button variant="outline" size="lg" className="bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500/20 hover:text-blue-600" onClick={() => handleConnect(currentPlayer)}>
                    <MessageSquare className="h-6 w-6"/>
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

    <Dialog open={isIcebreakerDialogOpen} onOpenChange={setIsIcebreakerDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2"><Sparkles className="text-primary"/> Rompehielos con IA</DialogTitle>
                <DialogDescription>
                    La IA ha generado estos mensajes para ayudarte a iniciar una conversación. ¡Copia tu favorito!
                </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
                {isIcebreakerLoading && (
                    <div className="flex items-center justify-center h-24">
                        <Loader2 className="h-8 w-8 animate-spin text-primary"/>
                    </div>
                )}
                {icebreakerError && !isIcebreakerLoading &&(
                    <Alert variant="destructive">
                        <Terminal className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{icebreakerError}</AlertDescription>
                    </Alert>
                )}
                {icebreakerResult && !isIcebreakerLoading && icebreakerResult.messages.map((msg, index) => (
                    <div key={index} className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                        <p className="flex-1 text-sm italic">"{msg}"</p>
                        <Button variant="ghost" size="icon" onClick={() => handleCopy(msg)}>
                            <ClipboardCopy className="h-4 w-4"/>
                        </Button>
                    </div>
                ))}
            </div>
        </DialogContent>
    </Dialog>
    </>
  )
}
