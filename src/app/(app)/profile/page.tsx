

"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { playerProfile } from "@/lib/data"
import { Trophy, Shield, Swords, BarChart2, BrainCircuit, Image as ImageIcon, Send, Sticker, Settings, Award, Medal } from "lucide-react"
import Link from "next/link"
import { Textarea } from "@/components/ui/textarea"
import { EditProfileDialog } from "@/components/edit-profile-dialog"
import Image from "next/image"
import { cn } from "@/lib/utils"

const posts = [
  {
    id: 'p1',
    content: '¡Acabo de conseguir un "Winner Winner Chicken Dinner" con 15 kills! 🔥 Busco squad para el torneo de verano.',
    timestamp: 'Hace 5 minutos'
  },
  {
    id: 'p2',
    content: 'Dominando en Erangel. ¿Alguien para unas partidas en modo Dúo esta noche? Rango As o superior.',
    timestamp: 'Hace 2 horas'
  }
];


export default function ProfilePage() {
    const isCreator = playerProfile.role === 'Creador' || playerProfile.role === 'Admin';
    
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Columna Izquierda: Perfil y Estadísticas */}
            <div className="lg:col-span-2 space-y-8">
                <Card className="overflow-hidden">
                    <div className="h-24 md:h-32 bg-gradient-to-r from-primary/20 via-primary/5 to-background" />
                    <CardContent className="p-6">
                        <div className="flex flex-col sm:flex-row sm:items-end sm:gap-6 -mt-16 sm:-mt-20">
                            <Avatar className="h-24 w-24 md:h-32 md:w-32 border-4 border-background ring-2 ring-primary">
                                <AvatarImage src={playerProfile.avatarUrl} data-ai-hint="gaming character" />
                                <AvatarFallback>{playerProfile.name.substring(0, 2)}</AvatarFallback>
                            </Avatar>
                            <div className="mt-4 sm:mb-2 flex-1">
                                <div className="flex items-center gap-2">
                                    <h1 className={cn(
                                        "text-3xl font-bold flex items-center gap-2",
                                        isCreator && "text-amber-500"
                                    )}>
                                        {isCreator && <Medal className="h-6 w-6"/>}
                                        {playerProfile.name}
                                    </h1>
                                  {playerProfile.countryCode && (
                                    <Image 
                                      src={`https://flagsapi.com/${playerProfile.countryCode}/shiny/64.png`}
                                      alt={`${playerProfile.countryCode} flag`}
                                      width={24}
                                      height={18}
                                      className="rounded-sm"
                                    />
                                  )}
                                </div>
                                <p className="text-muted-foreground">ID: {playerProfile.id}</p>
                                <p className="text-sm text-muted-foreground mt-2 max-w-prose">{playerProfile.bio}</p>
                            </div>
                            <EditProfileDialog />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><BarChart2 className="h-5 w-5 text-primary" /> Estadísticas y Logros</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-8 md:grid-cols-2">
                         <div className="space-y-6">
                            <div>
                                <div className="flex justify-between items-center text-sm mb-1">
                                    <span>Nivel {playerProfile.level}</span>
                                    <span className="text-muted-foreground">Nivel {playerProfile.level+1}</span>
                                </div>
                                <Progress value={(playerProfile.level/100) * 100} />
                            </div>
                            <div>
                                <div className="flex justify-between items-center text-sm mb-1">
                                    <span>Victorias</span>
                                    <span className="font-bold">{playerProfile.stats.wins}</span>
                                </div>
                                <Progress value={(playerProfile.stats.wins / 200) * 100} />
                            </div>
                            <div>
                                <div className="flex justify-between items-center text-sm mb-1">
                                    <span>Ratio K/D</span>
                                    <span className="font-bold">{playerProfile.stats.kdRatio}</span>
                                </div>
                                <Progress value={(playerProfile.stats.kdRatio / 10) * 100} />
                             </div>
                        </div>
                        <div className="space-y-3">
                            <h4 className="font-semibold">Logros Destacados</h4>
                            <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                                <div className="p-2 bg-primary/10 rounded-full"><Trophy className="h-5 w-5 text-primary" /></div>
                                <div>
                                    <p className="font-semibold">Pollo para Cenar x50</p>
                                    <p className="text-sm text-muted-foreground">Gana 50 partidas.</p>
                                </div>
                            </div>
                             <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                                <div className="p-2 bg-primary/10 rounded-full"><Swords className="h-5 w-5 text-primary" /></div>
                                <div>
                                    <p className="font-semibold">Experto en Asalto</p>
                                    <p className="text-sm text-muted-foreground">1000 bajas con rifles de asalto.</p>
                                </div>
                            </div>
                             <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                                <div className="p-2 bg-primary/10 rounded-full"><Award className="h-5 w-5 text-primary" /></div>
                                <div>
                                    <p className="font-semibold">Rango Conquistador</p>
                                    <p className="text-sm text-muted-foreground">Alcanza el máximo rango.</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><BrainCircuit className="h-5 w-5 text-primary"/> Análisis con IA</CardTitle>
                        <CardDescription>Obtén un análisis detallado de tu estilo de juego, fortalezas y áreas de mejora.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild>
                            <Link href="/player-analysis">Analizar mi Perfil</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Columna Derecha: Publicaciones */}
            <div className="lg:col-span-1 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Crear Publicación</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid w-full gap-2">
                            <Textarea placeholder="¿Qué estás pensando?" />
                             <div className="flex justify-between items-center">
                                <div className="flex gap-1">
                                    <Button variant="ghost" size="icon">
                                        <ImageIcon className="h-5 w-5 text-muted-foreground" />
                                    </Button>
                                    <Button variant="ghost" size="icon">
                                        <Sticker className="h-5 w-5 text-muted-foreground" />
                                    </Button>
                                </div>
                                <Button>
                                    <Send className="mr-2 h-4 w-4"/>
                                    Publicar
                                </Button>
                             </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                     <CardHeader>
                        <CardTitle>Actividad Reciente</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {posts.map(post => (
                             <div key={post.id} className="flex items-start gap-4">
                                <Avatar className="h-10 w-10 border">
                                     <AvatarImage src={playerProfile.avatarUrl} data-ai-hint="gaming character"/>
                                     <AvatarFallback>{playerProfile.name.substring(0, 2)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 bg-muted/30 p-3 rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <p className="font-semibold">{playerProfile.name}</p>
                                        <p className="text-xs text-muted-foreground">{post.timestamp}</p>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1">{post.content}</p>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
