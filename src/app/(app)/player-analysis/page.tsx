
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { playerProfile } from "@/lib/data"
import { BrainCircuit, Loader2, Sparkles } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

// Mock AI analysis function
const getAIAnalysis = async (stats: typeof playerProfile.stats) => {
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
    
    const analysis = {
        playStyle: "Agresivo y Táctico",
        strengths: [
            "Excelente en enfrentamientos a corta y media distancia.",
            "Buena toma de decisiones bajo presión.",
            "Efectivo con rifles de asalto y SMGs."
        ],
        improvementAreas: [
            "Mejorar la precisión en disparos a larga distancia con snipers.",
            "Gestionar mejor los recursos en las fases finales de la partida.",
            "Coordinación en equipo para rotaciones complejas."
        ]
    }
    return analysis;
}


export default function PlayerAnalysisPage() {
    const [analysis, setAnalysis] = useState<{ playStyle: string; strengths: string[]; improvementAreas: string[] } | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleAnalysis = async () => {
        setIsLoading(true);
        const result = await getAIAnalysis(playerProfile.stats);
        setAnalysis(result);
        setIsLoading(false);
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
                            <Skeleton className="h-8 w-1/4" />
                             <Skeleton className="h-6 w-full" />
                             <Skeleton className="h-6 w-full" />
                             <Skeleton className="h-6 w-3/4" />
                        </div>
                    )}

                    {analysis && !isLoading && (
                         <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold text-primary mb-2">Estilo de Juego Principal</h3>
                                <p>{analysis.playStyle}</p>
                            </div>
                             <div>
                                <h3 className="text-lg font-semibold text-primary mb-2">Puntos Fuertes</h3>
                                <ul className="list-disc list-inside space-y-1">
                                    {analysis.strengths.map((strength, i) => <li key={i}>{strength}</li>)}
                                </ul>
                            </div>
                             <div>
                                <h3 className="text-lg font-semibold text-primary mb-2">Áreas de Mejora</h3>
                                <ul className="list-disc list-inside space-y-1">
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
