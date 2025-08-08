
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { playerProfile } from "@/lib/data"
import { Edit, Trophy, Shield, Swords, BarChart2 } from "lucide-react"

export default function ProfilePage() {
    return (
        <div className="space-y-8">
            <Card>
                <CardHeader className="relative p-0">
                    <div className="h-32 md:h-48 bg-gradient-to-r from-orange-400 to-amber-500 rounded-t-lg" />
                    <Avatar className="h-24 w-24 md:h-32 md:w-32 absolute top-16 md:top-28 left-6 border-4 border-background">
                        <AvatarImage src={playerProfile.avatarUrl} data-ai-hint="gaming character" />
                        <AvatarFallback>{playerProfile.name.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                    <Button size="icon" variant="outline" className="absolute top-4 right-4 bg-background/50 hover:bg-background">
                        <Edit className="h-4 w-4" />
                    </Button>
                </CardHeader>
                <CardContent className="pt-20 md:pt-24 px-6 pb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                            <h1 className="text-3xl font-bold">{playerProfile.name}</h1>
                            <p className="text-muted-foreground">{playerProfile.email}</p>
                            <div className="flex flex-wrap gap-2 mt-2">
                                <Badge variant="secondary">Nivel: {playerProfile.level}</Badge>
                                <Badge variant="secondary">Rango: {playerProfile.rank}</Badge>
                                <Badge variant="outline">ID: {playerProfile.id}</Badge>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-8 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><BarChart2 className="h-5 w-5 text-primary" /> Estadísticas de la Temporada</CardTitle>
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
                        <CardTitle className="flex items-center gap-2"><Trophy className="h-5 w-5 text-accent"/> Logros Recientes</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-accent/10 rounded-full"><Swords className="h-5 w-5 text-accent" /></div>
                            <div>
                                <p className="font-semibold">Experto en Asalto</p>
                                <p className="text-sm text-muted-foreground">Consigue 1000 kills con rifles de asalto.</p>
                            </div>
                        </div>
                         <div className="flex items-center gap-4">
                            <div className="p-2 bg-accent/10 rounded-full"><Shield className="h-5 w-5 text-accent" /></div>
                            <div>
                                <p className="font-semibold">Pollo para Cenar x50</p>
                                <p className="text-sm text-muted-foreground">Gana 50 partidas en modo clásico.</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
