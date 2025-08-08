
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { playerProfile } from "@/lib/data"
import { Edit, Trophy, Shield, Swords, BarChart2, BrainCircuit, Image as ImageIcon, Send } from "lucide-react"
import Link from "next/link"
import { Textarea } from "@/components/ui/textarea"

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
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Columna Izquierda: Perfil y Estadísticas */}
            <div className="lg:col-span-2 space-y-8">
                <Card>
                    <CardHeader className="relative p-0">
                        <div className="h-32 md:h-48 bg-gradient-to-r from-primary/80 to-primary rounded-t-lg" />
                        <Avatar className="h-24 w-24 md:h-32 md:w-32 absolute top-16 md:top-28 left-6 border-4 border-card">
                            <AvatarImage src={playerProfile.avatarUrl} data-ai-hint="gaming character" />
                            <AvatarFallback>{playerProfile.name.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        <Button size="icon" variant="outline" className="absolute top-4 right-4 bg-background/50 hover:bg-background">
                            <Edit className="h-4 w-4" />
                        </Button>
                    </CardHeader>
                    <CardContent className="pt-20 md:pt-24 px-6 pb-6">
                        <div className="md:col-span-2">
                            <h1 className="text-3xl font-bold">{playerProfile.name}</h1>
                            <p className="text-muted-foreground">{playerProfile.email}</p>
                            <div className="flex flex-wrap gap-2 mt-2">
                                <Badge variant="secondary">Nivel: {playerProfile.level}</Badge>
                                <Badge variant="secondary">Rango: {playerProfile.rank}</Badge>
                                <Badge variant="outline">ID: {playerProfile.id}</Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid gap-8 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><BarChart2 className="h-5 w-5 text-primary" /> Estadísticas</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span>Victorias</span>
                                <span className="font-bold">{playerProfile.stats.wins}</span>
                            </div>
                            <Progress value={(playerProfile.stats.wins / 200) * 100} />

                            <div className="flex justify-between items-center">
                                <span>Kills</span>
                                <span className="font-bold">{playerProfile.stats.kills}</span>
                            </div>
                            <Progress value={(playerProfile.stats.kills / 3000) * 100} />
                            
                            <div className="flex justify-between items-center">
                                <span>K/D Ratio</span>
                                <span className="font-bold">{playerProfile.stats.kdRatio}</span>
                            </div>
                            <Progress value={(playerProfile.stats.kdRatio / 10) * 100} />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Trophy className="h-5 w-5 text-primary"/> Logros</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-primary/10 rounded-full"><Swords className="h-5 w-5 text-primary" /></div>
                                <div>
                                    <p className="font-semibold">Experto en Asalto</p>
                                    <p className="text-sm text-muted-foreground">1000 kills con rifles de asalto.</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-primary/10 rounded-full"><Shield className="h-5 w-5 text-primary" /></div>
                                <div>
                                    <p className="font-semibold">Pollo para Cenar x50</p>
                                    <p className="text-sm text-muted-foreground">Gana 50 partidas.</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
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
                                <Button variant="ghost" size="icon">
                                    <ImageIcon className="h-5 w-5 text-muted-foreground" />
                                </Button>
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
                                <div className="flex-1">
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
