
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { playerProfile } from "@/lib/data"
import { BrainCircuit, Loader2, Sparkles, Terminal } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import type { PlayerAnalysis, PlayerAnalysisInput } from "@/ai/flows/playerAnalysisFlow"
import { getPlayerAnalysis } from "@/ai/flows/playerAnalysisFlow"

export default function PlayerAnalysisPage() {
    const [analysis, setAnalysis] = useState<PlayerAnalysis | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAnalysis = async () => {
        setIsLoading(true);
        setError(null);
        setAnalysis(null);

        try {
            const input: PlayerAnalysisInput = {
                wins: playerProfile.stats.wins,
                kills: playerProfile.stats.kills,
                kdRatio: playerProfile.stats.kdRatio,
                rank: playerProfile.rank
            };
            const result = await getPlayerAnalysis(input);
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

            <Card>
                <CardHeader>
                    <CardTitle>Tu Perfil de Jugador</CardTitle>
                    <CardDescription>
                        Basado en tus estadísticas de la temporada actual: {playerProfile.stats.wins} victorias, {playerProfile.stats.kills} kills, y un K/D Ratio de {playerProfile.stats.kdRatio}.
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
    )
}
