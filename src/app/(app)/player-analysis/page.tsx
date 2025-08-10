
"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { playerProfile } from "@/lib/data"
import { BrainCircuit, Loader2, Sparkles, Terminal, Users2, Heart, Image as ImageIcon, Download, Send } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import type { PlayerAnalysis, PlayerAnalysisInput, RefinedPromptOutput } from "@/ai/schemas"
import { getPlayerAnalysis } from "@/ai/flows/playerAnalysisFlow"
import { refinePrompt } from "@/ai/flows/avatarFlow"
import { generateImages } from "@/ai/flows/imageGenFlow"
import { Avatar as AvatarComponent, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

type DesignChatMessage = {
    role: 'user' | 'model';
    content: string; 
};


export default function PlayerAnalysisPage() {
    const [analysis, setAnalysis] = useState<PlayerAnalysis | null>(null);
    const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);
    const [analysisError, setAnalysisError] = useState<string | null>(null);

    const [designHistory, setDesignHistory] = useState<DesignChatMessage[]>([]);
    const [currentUserInput, setCurrentUserInput] = useState("");
    const [isPromptLoading, setIsPromptLoading] = useState(false);
    const [promptError, setPromptError] = useState<string | null>(null);
    const [revisedPrompt, setRevisedPrompt] = useState<string>("");
    
    const [generatedImages, setGeneratedImages] = useState<string[]>([]);
    const [isImageLoading, setIsImageLoading] = useState(false);
    const [imageError, setImageError] = useState<string | null>(null);

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

    const handlePromptRefinement = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!currentUserInput.trim() || isPromptLoading) return;

        const newUserMessage: DesignChatMessage = { role: 'user', content: currentUserInput };
        const newHistory = [...designHistory, newUserMessage];
        
        setDesignHistory(newHistory);
        setCurrentUserInput("");
        setIsPromptLoading(true);
        setPromptError(null);

        try {
            const flowHistory = newHistory
                .map(msg => ({
                    role: msg.role as 'user' | 'model',
                    content: msg.content as string,
                }));

            const result: RefinedPromptOutput = await refinePrompt({ history: flowHistory });
            
            const newModelMessage: DesignChatMessage = { role: 'model', content: "He refinado tu idea. Revisa el prompt a continuación y, cuando estés listo, genera los diseños." };
            setDesignHistory(prev => [...prev, newModelMessage]);
            setRevisedPrompt(result.revisedPrompt);

        } catch (e: any) {
            setPromptError("Hubo un error al refinar el prompt. Inténtalo de nuevo.");
            console.error(e);
        } finally {
            setIsPromptLoading(false);
        }
    }

    const handleImageGeneration = async () => {
        if (!revisedPrompt.trim() || isImageLoading) return;

        setIsImageLoading(true);
        setImageError(null);
        setGeneratedImages([]);

        try {
            const result = await generateImages(revisedPrompt);
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
                     <Card className="sticky top-20 flex flex-col h-[75vh] max-h-[800px]">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><ImageIcon className="h-5 w-5 text-primary" />Estudio de Diseño IA</CardTitle>
                            <CardDescription>Conversa con la IA para refinar tu idea, y luego genera tus diseños.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-hidden p-0 flex flex-col">
                           <ScrollArea className="flex-1 p-4" ref={designChatContainerRef}>
                                <div className="space-y-4">
                                {designHistory.length === 0 && !isPromptLoading && (
                                    <div className="text-center text-sm text-muted-foreground p-8">
                                        <p>Empieza describiendo tu idea en el chat.</p>
                                        <p className="italic mt-2">"Un logo para 'LOBOS NOCTURNOS'"</p>
                                    </div>
                                )}

                                {designHistory.map((message, index) => (
                                    <div key={index} className={`flex items-start gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        {message.role === 'model' && <AvatarComponent className="w-8 h-8"><AvatarFallback>IA</AvatarFallback></AvatarComponent>}
                                        <div className={`p-3 rounded-lg max-w-xs ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                            <p>{message.content}</p>
                                        </div>
                                        {message.role === 'user' && <AvatarComponent className="w-8 h-8"><AvatarImage src={playerProfile.avatarUrl} /></AvatarComponent>}
                                    </div>
                                ))}

                                {isPromptLoading && (
                                     <div className="flex items-start gap-3 justify-start">
                                        <AvatarComponent className="w-8 h-8"><AvatarFallback>IA</AvatarFallback></AvatarComponent>
                                        <div className="p-3 rounded-lg bg-muted">
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Loader2 className="h-4 w-4 animate-spin"/>
                                                <span>Refinando idea...</span>
                                            </div>
                                        </div>
                                     </div>
                                )}
                                {promptError && (
                                    <Alert variant="destructive" className="mt-4"><Terminal className="h-4 w-4" /><AlertDescription>{promptError}</AlertDescription></Alert>
                                )}
                                </div>
                           </ScrollArea>
                        </CardContent>
                        <div className="p-4 border-t space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="final-prompt">Prompt Final Revisado</Label>
                                <Textarea id="final-prompt" placeholder="El prompt refinado por la IA aparecerá aquí..." value={revisedPrompt} onChange={(e) => setRevisedPrompt(e.target.value)} rows={3}/>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <Button onClick={handleImageGeneration} disabled={isImageLoading || !revisedPrompt}>
                                    {isImageLoading ? <Loader2 className="animate-spin"/> : <Sparkles/>}
                                    {isImageLoading ? "Generando..." : "Generar Diseños"}
                                </Button>
                                <Button variant="outline" onClick={() => { setRevisedPrompt(""); setGeneratedImages([]); }}>Limpiar</Button>
                            </div>

                            {imageError && (
                                <Alert variant="destructive"><Terminal className="h-4 w-4" /><AlertDescription>{imageError}</AlertDescription></Alert>
                            )}

                            {isImageLoading && (
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                    <Skeleton className="aspect-square w-full"/>
                                    <Skeleton className="aspect-square w-full"/>
                                </div>
                            )}

                            {generatedImages.length > 0 && (
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                    {generatedImages.map((url, i) => (
                                        <div key={i} className="space-y-1">
                                            <Image src={url} alt={`Diseño generado ${i + 1}`} width={256} height={256} className="object-cover rounded-md aspect-square border" />
                                            <Button variant="ghost" size="sm" className="w-full h-auto py-1" onClick={() => handleDownload(url)}>
                                                <Download className="mr-1 h-3 w-3" />
                                                <span className="text-xs">Descargar</span>
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <CardFooter className="p-2 border-t">
                            <form onSubmit={handlePromptRefinement} className="w-full flex items-center gap-2">
                                <Input 
                                    placeholder="Describe o refina tu idea..."
                                    value={currentUserInput}
                                    onChange={(e) => setCurrentUserInput(e.target.value)}
                                    disabled={isPromptLoading}
                                />
                                <Button type="submit" size="icon" disabled={isPromptLoading || !currentUserInput.trim()}>
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
