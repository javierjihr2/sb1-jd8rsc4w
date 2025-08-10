
"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { playerProfile } from "@/lib/data"
import { BrainCircuit, Loader2, Sparkles, Terminal, Users2, Heart, Image as ImageIcon, Download, Send } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import type { PlayerAnalysis, PlayerAnalysisInput, ImageGenOutput } from "@/ai/schemas"
import { getPlayerAnalysis } from "@/ai/flows/playerAnalysisFlow"
import { generateDesigns } from "@/ai/flows/avatarFlow"
import { Avatar as AvatarComponent, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"

type ChatMessage = {
  role: 'user' | 'model';
  text?: string;
  images?: string[];
}

export default function PlayerAnalysisPage() {
    const [analysis, setAnalysis] = useState<PlayerAnalysis | null>(null);
    const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);
    const [analysisError, setAnalysisError] = useState<string | null>(null);
    
    const [conversation, setConversation] = useState<ChatMessage[]>([]);
    const [userInput, setUserInput] = useState("");
    const [isImageLoading, setIsImageLoading] = useState(false);
    const [imageError, setImageError] = useState<string | null>(null);
    const scrollAreaRef = useRef<HTMLDivElement>(null);


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
        if (!userInput.trim() || isImageLoading) return;
        
        const newUserMessage: ChatMessage = { role: 'user', text: userInput };
        const newConversation = [...conversation, newUserMessage];
        setConversation(newConversation);
        setUserInput("");
        setIsImageLoading(true);
        setImageError(null);

        try {
            const historyForApi = newConversation
                .filter(msg => msg.text) // Only include messages with text for the history
                .map(msg => ({ role: msg.role, text: msg.text! }));

            const result: ImageGenOutput = await generateDesigns({ history: historyForApi });
            
            const newModelMessage: ChatMessage = { role: 'model', images: result.imageUrls };
            setConversation(prev => [...prev, newModelMessage]);

        } catch (e: any) {
            setImageError("Error al generar las imágenes. El servicio puede estar ocupado. Inténtalo de nuevo.");
            console.error(e);
        } finally {
            setIsImageLoading(false);
        }
    }

     useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [conversation]);

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
                     <Card className="sticky top-20 h-[calc(100vh-180px)] flex flex-col">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><ImageIcon className="h-5 w-5 text-primary" />Estudio de Diseño IA</CardTitle>
                            <CardDescription>Chatea con la IA para crear y refinar tus diseños.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-hidden p-0">
                             <ScrollArea className="h-full" ref={scrollAreaRef}>
                                <div className="p-6 space-y-4">
                                    {conversation.length === 0 && (
                                         <div className="text-center text-muted-foreground text-sm py-8">
                                            <ImageIcon className="mx-auto h-10 w-10 mb-2"/>
                                            <p>Comienza escribiendo tu idea.</p>
                                            <p className="text-xs">Ej: "Un logo para mi equipo 'LOBOS NOCTURNOS' con estilo neón."</p>
                                        </div>
                                    )}
                                    {conversation.map((msg, index) => (
                                        <div key={index} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            {msg.role === 'user' && (
                                                <div className="bg-primary text-primary-foreground p-3 rounded-lg max-w-xs break-words">
                                                    {msg.text}
                                                </div>
                                            )}
                                            {msg.role === 'model' && (
                                                 <div className="bg-muted p-3 rounded-lg">
                                                     {msg.images && (
                                                        <div className="grid grid-cols-2 gap-2">
                                                        {msg.images.map((url, i) => (
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
                                                 </div>
                                            )}
                                        </div>
                                    ))}
                                    {isImageLoading && (
                                         <div className="flex justify-start">
                                            <div className="bg-muted p-3 rounded-lg">
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                    <Loader2 className="h-5 w-5 animate-spin"/>
                                                    <span>Generando...</span>
                                                </div>
                                            </div>
                                         </div>
                                    )}
                                    {imageError && (
                                         <div className="flex justify-start">
                                            <Alert variant="destructive"><Terminal className="h-4 w-4" /><AlertDescription>{imageError}</AlertDescription></Alert>
                                         </div>
                                    )}
                                </div>
                            </ScrollArea>
                        </CardContent>
                        <CardFooter className="pt-4 border-t">
                            <form onSubmit={handleImageGeneration} className="w-full flex items-center gap-2">
                               <Input 
                                    placeholder="Describe tu idea o pide un cambio..."
                                    value={userInput}
                                    onChange={(e) => setUserInput(e.target.value)}
                                    disabled={isImageLoading}
                                />
                                <Button type="submit" size="icon" disabled={isImageLoading || !userInput.trim()}>
                                    <Send className="h-4 w-4"/>
                                </Button>
                            </form>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    )
}
