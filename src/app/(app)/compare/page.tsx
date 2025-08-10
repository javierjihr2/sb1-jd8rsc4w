
"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { comparePlayers } from "@/ai/flows/playerComparisonFlow";
import type { PlayerComparison, PlayerComparisonInput, PlayerProfileInput } from "@/ai/schemas";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Sparkles, Users, Terminal, ShieldCheck, Swords, Brain, Eye } from "lucide-react";
import { friendsForComparison } from "@/lib/data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";

export default function ComparePlayersPage() {
    const [player1Id, setPlayer1Id] = useState<string | null>(null);
    const [player2Id, setPlayer2Id] = useState<string | null>(null);
    const [comparison, setComparison] = useState<PlayerComparison | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleCompare = async () => {
        if (!player1Id || !player2Id) {
            setError("Por favor, selecciona dos jugadores para comparar.");
            return;
        }
        if (player1Id === player2Id) {
            setError("Por favor, selecciona dos jugadores diferentes.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setComparison(null);

        try {
            const player1 = friendsForComparison.find(f => f.id === player1Id);
            const player2 = friendsForComparison.find(f => f.id === player2Id);

            if (!player1 || !player2) {
                 setError("No se pudieron encontrar los perfiles de los jugadores seleccionados.");
                 setIsLoading(false);
                 return;
            }
            
            const input: PlayerComparisonInput = { player1, player2 };
            const result = await comparePlayers(input);
            setComparison(result);
        } catch (e: any) {
            setError("Hubo un error al generar la comparación. Por favor, inténtalo de nuevo.");
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const renderPlayerCard = (player: PlayerProfileInput) => (
        <Card className="h-full flex flex-col">
            <CardHeader className="items-center text-center">
                <Avatar className="w-20 h-20 mb-2">
                    <AvatarImage src={player.avatarUrl} data-ai-hint="gaming character"/>
                    <AvatarFallback>{player.name.substring(0, 2)}</AvatarFallback>
                </Avatar>
                <CardTitle>{player.name}</CardTitle>
                <CardDescription>{player.rank}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm flex-1">
                 <div>
                    <div className="flex justify-between mb-1"><span>Victorias</span><span className="font-semibold">{player.stats.wins}</span></div>
                    <Progress value={(player.stats.wins / 200) * 100} className="h-2"/>
                </div>
                 <div>
                    <div className="flex justify-between mb-1"><span>Bajas</span><span className="font-semibold">{player.stats.kills}</span></div>
                    <Progress value={(player.stats.kills / 3000) * 100} className="h-2"/>
                </div>
                 <div>
                    <div className="flex justify-between mb-1"><span>Ratio K/D</span><span className="font-semibold">{player.stats.kdRatio}</span></div>
                    <Progress value={(player.stats.kdRatio / 10) * 100} className="h-2"/>
                </div>
                <div className="text-xs text-muted-foreground pt-2">
                    <p><strong>Armas preferidas:</strong> {player.favoriteWeapons.join(', ')}</p>
                    <p><strong>Horario:</strong> {player.playSchedule}</p>
                </div>
            </CardContent>
            <div className="p-4 pt-0">
                <Button asChild variant="secondary" className="w-full">
                    <Link href={`/profile/${player.id}`}>
                        <Eye className="mr-2 h-4 w-4"/>
                        Ver Perfil Público
                    </Link>
                </Button>
            </div>
        </Card>
    );

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-2"><Users className="w-8 h-8 text-primary"/> Comparador de Jugadores</h1>
                <p className="text-muted-foreground">Analiza y compara perfiles para encontrar tu sinergia perfecta.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Selecciona a los Jugadores</CardTitle>
                    <CardDescription>Elige dos jugadores para realizar un análisis comparativo con IA.</CardDescription>
                </CardHeader>
                <CardContent className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 items-end">
                    <div className="space-y-2">
                        <Label htmlFor="player1">Jugador 1</Label>
                        <Select onValueChange={setPlayer1Id} value={player1Id || undefined}>
                            <SelectTrigger id="player1">
                                <SelectValue placeholder="Selecciona un jugador" />
                            </SelectTrigger>
                            <SelectContent>
                                {friendsForComparison.map(friend => (
                                    <SelectItem key={friend.id} value={friend.id}>{friend.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="player2">Jugador 2</Label>
                        <Select onValueChange={setPlayer2Id} value={player2Id || undefined}>
                            <SelectTrigger id="player2">
                                <SelectValue placeholder="Selecciona un jugador" />
                            </SelectTrigger>
                            <SelectContent>
                                {friendsForComparison.map(friend => (
                                    <SelectItem key={friend.id} value={friend.id}>{friend.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button onClick={handleCompare} disabled={isLoading} className="w-full sm:col-span-2 md:col-span-1">
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                        {isLoading ? "Comparando..." : "Comparar Perfiles"}
                    </Button>
                </CardContent>
            </Card>

            {error && !isLoading && (
                <Alert variant="destructive">
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {!isLoading && !comparison && !error && (
                 <Card className="h-full flex flex-col items-center justify-center text-center p-8 border-dashed min-h-[400px]">
                    <div className="p-4 bg-primary/10 rounded-full mb-4">
                        <Users className="h-12 w-12 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold">¿Quién es tu Dúo Ideal?</h2>
                    <p className="text-muted-foreground max-w-md">
                       Selecciona a dos jugadores de la lista para obtener un análisis comparativo detallado, descubriendo sus sinergias y estilos de juego.
                    </p>
                </Card>
            )}
            
            {comparison && !isLoading && player1Id && player2Id && (
                <div className="space-y-8 animate-in fade-in-50">
                    <div className="grid md:grid-cols-2 gap-8">
                        {renderPlayerCard(friendsForComparison.find(f => f.id === player1Id)!)}
                        {renderPlayerCard(friendsForComparison.find(f => f.id === player2Id)!)}
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Brain className="h-6 w-6 text-primary"/> Análisis de Sinergia por IA</CardTitle>
                            <CardDescription>Evaluación de cómo estos dos jugadores se complementarían en el campo de batalla.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <h3 className="font-semibold text-lg flex items-center gap-2 mb-2"><Swords className="h-5 w-5 text-accent"/> Estilos de Juego y Sinergia</h3>
                                <p className="text-muted-foreground">{comparison.synergyAnalysis}</p>
                            </div>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="font-semibold text-lg mb-2">Fortalezas Combinadas</h3>
                                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                        {comparison.combinedStrengths.map((strength, i) => <li key={i}>{strength}</li>)}
                                    </ul>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg mb-2">Consejos para el Dúo</h3>
                                     <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                        {comparison.duoTips.map((tip, i) => <li key={i}>{tip}</li>)}
                                    </ul>
                                </div>
                            </div>
                             <div>
                                <h3 className="font-semibold text-lg flex items-center gap-2 mb-2"><ShieldCheck className="h-5 w-5 text-accent"/> Veredicto del Dúo</h3>
                                <p className="text-muted-foreground">{comparison.verdict}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

             {isLoading && (
                 <Card className="h-full flex flex-col items-center justify-center text-center p-8 border-dashed min-h-[400px]">
                    <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
                    <h2 className="text-2xl font-bold">Analizando Dúo...</h2>
                    <p className="text-muted-foreground max-w-md">
                       La IA está comparando perfiles, estadísticas y estilos de juego para encontrar la sinergia perfecta.
                    </p>
                </Card>
            )}

        </div>
    );
}
