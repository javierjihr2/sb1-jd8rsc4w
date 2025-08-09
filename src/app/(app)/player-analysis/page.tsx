
"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { playerProfile } from "@/lib/data"
import { BrainCircuit, Loader2, Sparkles, Terminal, Users2, Heart, Image as ImageIcon, Download, Send } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import type { PlayerAnalysis, PlayerAnalysisInput, Avatar } from "@/ai/schemas"
import { getPlayerAnalysis } from "@/ai/flows/playerAnalysisFlow"
import { generateAvatar } from "@/ai/flows/avatarFlow"
import { Avatar as AvatarComponent, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"

type DesignChatMessage = {
    role: 'user' | 'model';
    content: string | string[]; // string for text, string[] for image URLs
};


export default function PlayerAnalysisPage() {
    const [analysis, setAnalysis] = useState<PlayerAnalysis | null>(null);
    const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);
    const [analysisError, setAnalysisError] = useState<string | null>(null);

    const [designHistory, setDesignHistory] = useState<DesignChatMessage[]>([]);
    const [currentUserInput, setCurrentUserInput] = useState("");
    const [isAvatarLoading, setIsAvatarLoading] = useState(false);
    const [avatarError, setAvatarError] = useState<string | null>(null);
    const designChatContainerRef = useRef<HTMLDivElement>(null);


    useEffect(() => {
        if (designChatContainerRef.current) {
            designChatContainerRef.current.scrollTop = designChatContainerRef.current.scrollHeight;
        }
    }, [designHistory]);


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

    const handleAvatarGeneration = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!currentUserInput.trim()) return;

        const newUserMessage: DesignChatMessage = { role: 'user', content: currentUserInput };
        const newHistory = [...designHistory, newUserMessage];
        
        setDesignHistory(newHistory);
        setCurrentUserInput("");
        setIsAvatarLoading(true);
        setAvatarError(null);

        try {
            // We need to format the history for the AI flow (only text content)
            const flowHistory = newHistory
                .filter(msg => typeof msg.content === 'string')
                .map(msg => ({
                    role: msg.role as 'user' | 'model',
                    content: msg.content as string,
                }));

            const result = await generateAvatar({ history: flowHistory });
            
            const newModelMessage: DesignChatMessage = { role: 'model', content: result.imageUrls };
            setDesignHistory(prev => [...prev, newModelMessage]);

        } catch (e: any) {
            setAvatarError("Hubo un error al generar el diseño. El servicio puede estar ocupado. Inténtalo de nuevo.");
            console.error(e);
        } finally {
            setIsAvatarLoading(false);
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
                     <Card className="sticky top-20 flex flex-col h-[75vh] max-h-[800px]">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><ImageIcon className="h-5 w-5 text-primary" />Estudio de Diseño IA</CardTitle>
                            <CardDescription>Describe o refina tu diseño en el chat. La IA creará y modificará tus ideas.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-hidden p-0 flex flex-col">
                           <ScrollArea className="flex-1 p-4" ref={designChatContainerRef}>
                                <div className="space-y-4">
                                {designHistory.length === 0 && !isAvatarLoading && (
                                    <div className="text-center text-sm text-muted-foreground p-8">
                                        <p>Empieza escribiendo lo que quieres crear. Por ejemplo:</p>
                                        <p className="italic mt-2">"Un logo para el equipo 'LOBOS NOCTURNOS' con un lobo y una luna"</p>
                                        <p className="italic mt-1">"Un avatar de un soldado cibernético"</p>
                                    </div>
                                )}

                                {designHistory.map((message, index) => (
                                    <div key={index} className={`flex items-start gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        {message.role === 'model' && <AvatarComponent className="w-8 h-8"><AvatarFallback>IA</AvatarFallback></AvatarComponent>}
                                        
                                        <div className={`p-3 rounded-lg max-w-xs ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                            {typeof message.content === 'string' ? (
                                                <p>{message.content}</p>
                                            ) : (
                                                <div className="grid grid-cols-2 gap-2">
                                                    {message.content.map((url, i) => (
                                                        <div key={i} className="space-y-1">
                                                            <Image src={url} alt={`Diseño generado ${i + 1}`} width={128} height={128} className="object-cover rounded-md aspect-square border" />
                                                             <Button variant="ghost" size="sm" className="w-full h-auto py-1" onClick={() => handleDownload(url)}>
                                                                <Download className="mr-1 h-3 w-3" />
                                                                <span className="text-xs">Descargar</span>
                                                            </Button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {message.role === 'user' && <AvatarComponent className="w-8 h-8"><AvatarImage src={playerProfile.avatarUrl} /></AvatarComponent>}
                                    </div>
                                ))}

                                {isAvatarLoading && (
                                     <div className="flex items-start gap-3 justify-start">
                                        <AvatarComponent className="w-8 h-8"><AvatarFallback>IA</AvatarFallback></AvatarComponent>
                                        <div className="p-3 rounded-lg bg-muted">
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Loader2 className="h-4 w-4 animate-spin"/>
                                                <span>Generando diseños...</span>
                                            </div>
                                        </div>
                                     </div>
                                )}
                                {avatarError && (
                                    <Alert variant="destructive" className="mt-4">
                                        <Terminal className="h-4 w-4" />
                                        <AlertTitle>Error</AlertTitle>
                                        <AlertDescription>{avatarError}</AlertDescription>
                                    </Alert>
                                )}

                                </div>
                           </ScrollArea>
                        </CardContent>
                        <CardFooter className="p-2 border-t">
                            <form onSubmit={handleAvatarGeneration} className="w-full flex items-center gap-2">
                                <Input 
                                    placeholder="Describe tu diseño o pide un cambio..."
                                    value={currentUserInput}
                                    onChange={(e) => setCurrentUserInput(e.target.value)}
                                    disabled={isAvatarLoading}
                                />
                                <Button type="submit" size="icon" disabled={isAvatarLoading || !currentUserInput.trim()}>
                                    <Send className="h-4 w-4" />
                                </Button>
                            </form>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    )
}
