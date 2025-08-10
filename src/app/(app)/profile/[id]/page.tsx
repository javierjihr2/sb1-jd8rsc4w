
"use client"

import { notFound } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { friendsForComparison } from "@/lib/data"
import { FileCode, Bot, Gamepad2, Brain, Crosshair, ClipboardCopy, QrCode } from "lucide-react"
import { useToast } from "@/hooks/use-toast";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import Image from "next/image"

// Datos de ejemplo para sensibilidades públicas. En una app real, esto vendría de una base de datos.
const publicSensitivities: any = {
    'c2': [
        {
          id: 'sens-c2-1',
          userGivenName: 'Config de Rusheo en Sanhok',
          isPublic: true,
          analysis: { playStyle: 'Agresivo (Rusher)', tacticalAnalysis: 'Sensibilidad alta optimizada para giros rápidos y combate a corta distancia en entornos cerrados. Ideal para SMGs.', recommendedWeapons: ['Vector', 'UMP45'] },
          code: '7203-1111-2222-3333-444',
          settings: { /* ... datos de sensibilidad ... */ }
        }
    ]
}


export default function PublicProfilePage({ params }: { params: { id: string } }) {
    const { toast } = useToast();
    const player = friendsForComparison.find(f => f.id === params.id);
    const sensitivities = publicSensitivities[params.id] || [];

    if (!player) {
        notFound();
    }
    
    const handleCopyCode = (code: string) => {
        if (!code) {
            toast({ variant: 'destructive', title: 'Sin Código', description: 'No hay un código disponible para esta configuración.' });
            return;
        }
        navigator.clipboard.writeText(code);
        toast({ title: 'Copiado', description: 'Código de sensibilidad copiado a tu portapapeles.' });
    };


    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Columna Izquierda: Perfil y Estadísticas */}
            <div className="lg:col-span-2 space-y-8">
                <Card className="overflow-hidden">
                    <div className="h-24 md:h-32 bg-gradient-to-r from-primary/20 via-primary/5 to-background" />
                    <CardContent className="p-6">
                        <div className="flex flex-col sm:flex-row sm:items-end sm:gap-6 -mt-16 sm:-mt-20">
                            <Avatar className="h-24 w-24 md:h-32 md:w-32 border-4 border-background ring-2 ring-primary">
                                <AvatarImage src={player.avatarUrl} data-ai-hint="gaming character" />
                                <AvatarFallback>{player.name.substring(0, 2)}</AvatarFallback>
                            </Avatar>
                            <div className="mt-4 sm:mb-2 flex-1">
                                <div className="flex items-center gap-2">
                                  <h1 className="text-3xl font-bold">{player.name}</h1>
                                  {player.countryCode && (
                                    <Image 
                                      src={`https://flagsapi.com/${player.countryCode}/shiny/64.png`}
                                      alt={`${player.countryCode} flag`}
                                      width={24}
                                      height={18}
                                      className="rounded-sm"
                                    />
                                  )}
                                </div>
                                <p className="text-muted-foreground">ID: {player.id}</p>
                                <p className="text-sm text-muted-foreground mt-2 max-w-prose">{player.bio}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><FileCode className="h-5 w-5 text-primary" /> Sensibilidades Públicas de {player.name}</CardTitle>
                        <CardDescription>Explora las configuraciones que este jugador ha decidido compartir con la comunidad.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-6">
                        {sensitivities.length > 0 ? sensitivities.map((s: any) => (
                            <Card key={s.id} className="flex flex-col bg-muted/50">
                                <CardHeader>
                                    <CardTitle className="text-lg text-primary">{s.userGivenName}</CardTitle>
                                    <CardDescription className="flex items-center gap-2 text-xs pt-1"><Gamepad2 className="h-3 w-3"/>{s.analysis.playStyle}</CardDescription>
                                </CardHeader>
                                <CardContent className="flex-1 space-y-4">
                                     <Collapsible>
                                        <CollapsibleTrigger asChild>
                                             <div className="p-3 bg-background/50 rounded-lg cursor-pointer hover:bg-background">
                                                <h4 className="font-semibold text-sm flex items-center gap-2 mb-1"><Bot className="h-4 w-4"/>Análisis de IA</h4>
                                                <p className="text-xs text-muted-foreground line-clamp-2">{s.analysis.tacticalAnalysis}</p>
                                             </div>
                                        </CollapsibleTrigger>
                                        <CollapsibleContent className="p-3 bg-background/50 rounded-lg mt-2">
                                             <div className="space-y-3">
                                                <div>
                                                    <h4 className="font-semibold text-xs flex items-center gap-2 mb-1"><Brain className="h-3 w-3"/>Análisis Táctico</h4>
                                                    <p className="text-xs text-muted-foreground">{s.analysis.tacticalAnalysis}</p>
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-xs flex items-center gap-2 mb-1"><Crosshair className="h-3 w-3"/>Armas Recomendadas</h4>
                                                    <ul className="list-disc list-inside text-xs text-muted-foreground">
                                                        {s.analysis.recommendedWeapons.map((w: string) => <li key={w}>{w}</li>)}
                                                    </ul>
                                                </div>
                                             </div>
                                        </CollapsibleContent>
                                     </Collapsible>
                                      <div className="flex gap-2 justify-center pt-2">
                                       <QrCode className="w-20 h-20 text-muted-foreground"/>
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button variant="outline" className="w-full" onClick={() => handleCopyCode(s.code)}>
                                        <ClipboardCopy className="mr-2"/>
                                        Copiar Código
                                    </Button>
                                </CardFooter>
                            </Card>
                        )) : (
                            <p className="text-sm text-muted-foreground md:col-span-2 text-center py-8">Este jugador aún no ha compartido ninguna sensibilidad.</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="lg:col-span-1 space-y-6 lg:sticky top-20">
                <Card>
                    <CardHeader>
                        <CardTitle>Estadísticas</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <div className="flex justify-between items-center text-sm mb-1">
                                <span>Rango</span>
                                <Badge variant="secondary">{player.rank}</Badge>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between items-center text-sm mb-1">
                                <span>Victorias</span>
                                <span className="font-bold">{player.stats.wins}</span>
                            </div>
                            <Progress value={(player.stats.wins / 200) * 100} />
                        </div>
                        <div>
                            <div className="flex justify-between items-center text-sm mb-1">
                                <span>Ratio K/D</span>
                                <span className="font-bold">{player.stats.kdRatio}</span>
                            </div>
                            <Progress value={(player.stats.kdRatio / 10) * 100} />
                        </div>
                         <div>
                            <div className="flex justify-between items-center text-sm mb-1">
                                <span>Bajas Totales</span>
                                <span className="font-bold">{player.stats.kills}</span>
                            </div>
                            <Progress value={(player.stats.kills / 3000) * 100} />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
