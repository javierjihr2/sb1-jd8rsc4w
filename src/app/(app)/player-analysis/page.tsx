
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { playerProfile } from "@/lib/data"
import { BrainCircuit, Loader2, Sparkles, Terminal, Users2, Heart } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import type { PlayerAnalysis, PlayerAnalysisInput } from "@/ai/schemas"
import { getPlayerAnalysis } from "@/ai/flows/playerAnalysisFlow"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function PlayerAnalysisPage() {
    const [analysis, setAnalysis] = useState<PlayerAnalysis | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAnalysis = async () => {
        setIsLoading(true);
        setError(null);
        setAnalysis(null);

        try {
            const input: Omit<PlayerAnalysisInput, 'friends'> = {
                wins: playerProfile.stats.wins,
                kills: playerProfile.stats.kills,
                kdRatio: playerProfile.stats.kdRatio,
                rank: playerProfile.rank
            };
            const result = await getPlayerAnalysis(input as PlayerAnalysisInput);
            setAnalysis(result);
        } catch (e: any) {
            setError("Ha ocurrido un error al generar el análisis. Por favor, inténtalo de nuevo más tarde.");
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-2"><BrainCircuit className="w-8 h-8 text-primary"/> Análisis con IA</h1>
                <p className="text-muted-foreground">Descubre tu perfil de jugador con la ayuda de la inteligencia artificial.</p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2 space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Tu Perfil de Jugador</CardTitle>
                            <CardDescription>
                                Basado en tus estadísticas de la temporada actual: {playerProfile.stats.wins} victorias, {playerProfile.stats.kills} bajas, y un Ratio K/D de {playerProfile.stats.kdRatio}.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {!analysis && !isLoading && (
                                <Button onClick={handleAnalysis}>
                                    <Sparkles className="mr-2 h-4 w-4"/>
                                    Generar mi análisis
                                </Button>
                            )}
                            
                            {isLoading && (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        <span>Analizando tus partidas... Esto puede tardar un momento.</span>
                                    </div>
                                    <Skeleton className="h-8 w-1/4 mt-4" />
                                    <Skeleton className="h-6 w-full" />
                                    <Skeleton className="h-6 w-full" />
                                    <Skeleton className="h-6 w-3/4" />
                                </div>
                            )}

                            {error && !isLoading && (
                                <Alert variant="destructive">
                                    <Terminal className="h-4 w-4" />
                                    <AlertTitle>Error</AlertTitle>
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            {analysis && !isLoading && (
                                <div className="space-y-6 animate-in fade-in-50">
                                    <div>
                                        <h3 className="text-lg font-semibold text-primary mb-2">Estilo de Juego Principal</h3>
                                        <p className="text-muted-foreground">{analysis.playStyle}</p>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-primary mb-2">Puntos Fuertes</h3>
                                        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                            {analysis.strengths.map((strength, i) => <li key={i}>{strength}</li>)}
                                        </ul>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-primary mb-2">Áreas de Mejora</h3>
                                        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                            {analysis.improvementAreas.map((area, i) => <li key={i}>{area}</li>)}
                                        </ul>
                                    </div>
                                    <Button onClick={handleAnalysis} variant="outline">
                                        <Sparkles className="mr-2 h-4 w-4"/>
                                        Volver a generar
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-1">
                     {analysis?.recommendedFriend && !isLoading && (
                        <Card className="animate-in fade-in-50 sticky top-20">
                            <CardHeader className="text-center">
                                <div className="p-3 bg-primary/10 rounded-full mb-2 w-fit mx-auto">
                                    <Heart className="h-8 w-8 text-primary"/>
                                </div>
                                <CardTitle className="flex items-center justify-center gap-2 text-2xl">
                                    <Users2 className="h-6 w-6 text-accent"/>
                                    Dúo Dinámico
                                </CardTitle>
                                <CardDescription>La pareja perfecta para dominar.</CardDescription>
                            </CardHeader>
                            <CardContent className="text-center">
                                <Avatar className="w-24 h-24 mx-auto mb-4 border-4 border-primary/50">
                                    <AvatarImage src={analysis.recommendedFriend.avatarUrl} data-ai-hint="gaming character"/>
                                    <AvatarFallback>{analysis.recommendedFriend.name.substring(0,2)}</AvatarFallback>
                                </Avatar>
                                <h4 className="text-xl font-bold">{analysis.recommendedFriend.name}</h4>
                                <p className="text-muted-foreground italic mt-2">"{analysis.recommendedFriend.reason}"</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    )
}
