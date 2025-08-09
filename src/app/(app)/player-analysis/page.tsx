
"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { playerProfile } from "@/lib/data"
import { BrainCircuit, Loader2, Sparkles, Terminal, Users2, Heart, Image as ImageIcon } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import type { PlayerAnalysis, PlayerAnalysisInput, Avatar } from "@/ai/schemas"
import { getPlayerAnalysis } from "@/ai/flows/playerAnalysisFlow"
import { generateAvatar } from "@/ai/flows/avatarFlow"
import { Avatar as AvatarComponent, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

export default function PlayerAnalysisPage() {
    const [analysis, setAnalysis] = useState<PlayerAnalysis | null>(null);
    const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);
    const [analysisError, setAnalysisError] = useState<string | null>(null);

    const [avatarPrompt, setAvatarPrompt] = useState<string>("");
    const [generatedAvatar, setGeneratedAvatar] = useState<Avatar | null>(null);
    const [isAvatarLoading, setIsAvatarLoading] = useState(false);
    const [avatarError, setAvatarError] = useState<string | null>(null);

    const handleAnalysis = async () => {
        setIsAnalysisLoading(true);
        setAnalysisError(null);
        setAnalysis(null);

        try {
            const input: Omit<PlayerAnalysisInput, 'friends'> = {
                wins: playerProfile.stats.wins,
                kills: playerProfile.stats.kills,
                kdRatio: playerProfile.stats.kdRatio,
                rank: playerProfile.rank
            };
            const result = await getPlayerAnalysis(input);
            setAnalysis(result);
        } catch (e: any) {
            setAnalysisError("Ha ocurrido un error al generar el análisis. Por favor, inténtalo de nuevo más tarde.");
            console.error(e);
        } finally {
            setIsAnalysisLoading(false);
        }
    }

    const handleAvatarGeneration = async () => {
        if (!avatarPrompt) {
            setAvatarError("Por favor, escribe una descripción para tu avatar.");
            return;
        }
        setIsAvatarLoading(true);
        setAvatarError(null);
        setGeneratedAvatar(null);

        try {
            const result = await generateAvatar({ prompt: avatarPrompt });
            setGeneratedAvatar(result);
        } catch (e: any) {
            setAvatarError("Hubo un error al generar el avatar. El servicio puede estar ocupado. Inténtalo de nuevo.");
            console.error(e);
        } finally {
            setIsAvatarLoading(false);
        }
    }


    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-2"><BrainCircuit className="w-8 h-8 text-primary"/> Análisis con IA</h1>
                <p className="text-muted-foreground">Descubre tu perfil de jugador y crea un avatar único con la ayuda de la IA.</p>
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
                            {!analysis && !isAnalysisLoading && (
                                <Button onClick={handleAnalysis}>
                                    <Sparkles className="mr-2 h-4 w-4"/>
                                    Generar mi análisis
                                </Button>
                            )}
                            
                            {isAnalysisLoading && (
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

                            {analysisError && !isAnalysisLoading && (
                                <Alert variant="destructive">
                                    <Terminal className="h-4 w-4" />
                                    <AlertTitle>Error</AlertTitle>
                                    <AlertDescription>{analysisError}</AlertDescription>
                                </Alert>
                            )}

                            {analysis && !isAnalysisLoading && (
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
                         {analysis?.recommendedFriend && !isAnalysisLoading && (
                            <CardFooter>
                                <Card className="animate-in fade-in-50 w-full bg-muted/50">
                                    <CardHeader className="text-center">
                                        <div className="p-3 bg-primary/10 rounded-full mb-2 w-fit mx-auto">
                                            <Heart className="h-8 w-8 text-primary"/>
                                        </div>
                                        <CardTitle className="flex items-center justify-center gap-2 text-2xl">
                                            <Users2 className="h-6 w-6 text-accent"/>
                                            Dúo Dinámico
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="text-center">
                                        <AvatarComponent className="w-24 h-24 mx-auto mb-4 border-4 border-primary/50">
                                            <AvatarImage src={analysis.recommendedFriend.avatarUrl} data-ai-hint="gaming character"/>
                                            <AvatarFallback>{analysis.recommendedFriend.name.substring(0,2)}</AvatarFallback>
                                        </AvatarComponent>
                                        <h4 className="text-xl font-bold">{analysis.recommendedFriend.name}</h4>
                                        <p className="text-muted-foreground italic mt-2">"{analysis.recommendedFriend.reason}"</p>
                                    </CardContent>
                                </Card>
                            </CardFooter>
                        )}
                    </Card>
                </div>
                <div className="lg:col-span-1">
                     <Card className="sticky top-20">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><ImageIcon className="h-5 w-5 text-primary" />Generador de Avatar con IA</CardTitle>
                            <CardDescription>Describe el avatar de tus sueños y la IA lo creará para ti.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="avatar-prompt">Describe tu avatar</Label>
                                    <Textarea 
                                        id="avatar-prompt"
                                        placeholder="Ej: Un soldado cibernético con armadura de neón y un casco de tigre" 
                                        value={avatarPrompt}
                                        onChange={(e) => setAvatarPrompt(e.target.value)}
                                        disabled={isAvatarLoading}
                                    />
                                </div>
                                <Button onClick={handleAvatarGeneration} disabled={isAvatarLoading || !avatarPrompt} className="w-full">
                                    {isAvatarLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Sparkles className="mr-2 h-4 w-4" />}
                                    {isAvatarLoading ? "Creando Magia..." : "Generar Avatar"}
                                </Button>
                            </div>
                              {avatarError && !isAvatarLoading && (
                                <Alert variant="destructive" className="mt-4">
                                    <Terminal className="h-4 w-4" />
                                    <AlertTitle>Error de Generación</AlertTitle>
                                    <AlertDescription>{avatarError}</AlertDescription>
                                </Alert>
                            )}
                        </CardContent>
                        {(isAvatarLoading || generatedAvatar) && (
                             <CardFooter>
                                <div className="w-full text-center">
                                    <h4 className="text-sm font-semibold mb-2 text-muted-foreground">Resultado</h4>
                                    <div className="aspect-square w-full rounded-lg bg-muted flex items-center justify-center border">
                                    {isAvatarLoading ? (
                                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                            <Loader2 className="h-8 w-8 animate-spin" />
                                            <span>Generando...</span>
                                        </div>
                                    ) : generatedAvatar?.imageUrl ? (
                                        <Image src={generatedAvatar.imageUrl} alt="Avatar generado por IA" width={512} height={512} className="object-cover rounded-lg aspect-square"/>
                                    ) : null }
                                    </div>
                                </div>
                            </CardFooter>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    )
}
