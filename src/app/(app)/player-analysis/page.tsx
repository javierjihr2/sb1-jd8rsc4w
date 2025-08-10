
"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { playerProfile } from "@/lib/data"
import { BrainCircuit, Loader2, Sparkles, Terminal, Users2, Heart, Image as ImageIcon, Download } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import type { PlayerAnalysis, PlayerAnalysisInput, ImageGenOutput } from "@/ai/schemas"
import { getPlayerAnalysis } from "@/ai/flows/playerAnalysisFlow"
import { generateDesigns } from "@/ai/flows/avatarFlow"
import { Avatar as AvatarComponent, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"


export default function PlayerAnalysisPage() {
    const [analysis, setAnalysis] = useState<PlayerAnalysis | null>(null);
    const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);
    const [analysisError, setAnalysisError] = useState<string | null>(null);
    
    const [userIdea, setUserIdea] = useState("");
    const [generatedImages, setGeneratedImages] = useState<string[]>([]);
    const [isImageLoading, setIsImageLoading] = useState(false);
    const [imageError, setImageError] = useState<string | null>(null);


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

    const handleImageGeneration = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!userIdea.trim() || isImageLoading) return;

        setIsImageLoading(true);
        setImageError(null);
        setGeneratedImages([]);

        try {
            const result: ImageGenOutput = await generateDesigns({ idea: userIdea });
            setGeneratedImages(result.imageUrls);
        } catch (e: any) {
            setImageError("Error al generar las imágenes. El servicio puede estar ocupado. Inténtalo de nuevo.");
            console.error(e);
        } finally {
            setIsImageLoading(false);
        }
    }

    const handleDownload = (imageUrl: string) => {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `squadup-design-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }


    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-2"><BrainCircuit className="w-8 h-8 text-primary"/> Análisis con IA</h1>
                <p className="text-muted-foreground">Descubre tu perfil de jugador y crea un avatar o logo único con la ayuda de la IA.</p>
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
                <div id="avatar" className="lg:col-span-1">
                     <Card className="sticky top-20">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><ImageIcon className="h-5 w-5 text-primary" />Estudio de Diseño IA</CardTitle>
                            <CardDescription>Describe tu idea para un avatar, logo o emblema, y la IA lo creará para ti.</CardDescription>
                        </CardHeader>
                        <form onSubmit={handleImageGeneration}>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="design-idea">Tu Idea</Label>
                                    <Textarea 
                                        id="design-idea"
                                        placeholder="Ej: Un logo para mi equipo 'LOBOS NOCTURNOS' con estilo neón."
                                        value={userIdea}
                                        onChange={(e) => setUserIdea(e.target.value)}
                                        rows={4}
                                        disabled={isImageLoading}
                                    />
                                </div>
                                
                                {imageError && (
                                    <Alert variant="destructive"><Terminal className="h-4 w-4" /><AlertDescription>{imageError}</AlertDescription></Alert>
                                )}

                                {isImageLoading && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <Skeleton className="aspect-square w-full rounded-lg"/>
                                        <Skeleton className="aspect-square w-full rounded-lg"/>
                                    </div>
                                )}

                                {generatedImages.length > 0 && !isImageLoading && (
                                    <div className="grid grid-cols-2 gap-4 animate-in fade-in-50">
                                        {generatedImages.map((url, i) => (
                                            <div key={i} className="space-y-2">
                                                <Image src={url} alt={`Diseño generado ${i + 1}`} width={256} height={256} className="object-cover rounded-lg aspect-square border" />
                                                <Button variant="outline" size="sm" className="w-full" onClick={() => handleDownload(url)}>
                                                    <Download className="mr-2 h-4 w-4" />
                                                    Descargar
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                
                            </CardContent>
                            <CardFooter className="flex flex-col gap-2">
                                <Button type="submit" className="w-full" disabled={isImageLoading || !userIdea.trim()}>
                                    {isImageLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Sparkles className="mr-2 h-4 w-4" />}
                                    {isImageLoading ? "Generando..." : "Generar Diseños"}
                                </Button>
                                {generatedImages.length > 0 && (
                                     <Button variant="ghost" className="w-full" onClick={() => { setGeneratedImages([]); setUserIdea("") }}>Limpiar</Button>
                                )}
                            </CardFooter>
                        </form>
                    </Card>
                </div>
            </div>
        </div>
    )
}
