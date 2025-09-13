
"use client"

import { useState, useCallback, memo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
// Importación dinámica para evitar errores en el cliente
import type { PlayerComparison, PlayerComparisonInput, PlayerProfileInput } from "@/ai/schemas";
import type { PlayerProfile, UserWithRole } from "@/lib/types";
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

    const handleCompare = useCallback(async () => {
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
            
            const input: PlayerComparisonInput = { 
                player1: { 
                    rank: player1.rank || 'Unranked',
                    name: player1.name || 'Unknown',
                    avatarUrl: player1.avatarUrl,
                    id: player1.id,
                    stats: {
                        wins: player1.stats?.wins || 0,
                        kills: player1.stats?.kills || 0,
                        kdRatio: player1.stats?.kdRatio || 0       
                    },
                    favoriteWeapons: player1.favoriteWeapons || [],
                    playSchedule: player1.playSchedule || 'Unknown'
                }, 
                player2: { 
                    rank: player2.rank || 'Unranked',
                    name: player2.name || 'Unknown',
                    avatarUrl: player2.avatarUrl,
                    id: player2.id,
                    stats: {
                        wins: player2.stats?.wins || 0,
                        kills: player2.stats?.kills || 0,
                        kdRatio: player2.stats?.kdRatio || 0
                    },
                    favoriteWeapons: player2.favoriteWeapons || [],
                    playSchedule: player2.playSchedule || 'Unknown'
                } 
            };
            
            const response = await fetch('/api/compare-players', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(input),
            });
            
            if (!response.ok) {
                throw new Error('Error en la respuesta del servidor');
            }
            
            const result = await response.json();
            setComparison(result);
        } catch (e: any) {
            setError("Hubo un error al generar la comparación. Por favor, inténtalo de nuevo.");
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }, [player1Id, player2Id]);

    // Componente memoizado para tarjetas de jugadores
    const PlayerCard = memo(({ player }: { player: UserWithRole }) => (
        <Card className="h-full flex flex-col">
            <CardHeader className="items-center text-center">
                <Avatar className="w-20 h-20 mb-2">
                    <AvatarImage src={player.avatarUrl} data-ai-hint="gaming character"/>
                    <AvatarFallback>{(player.name || '').substring(0, 2)}</AvatarFallback>
                </Avatar>
                <CardTitle>{player.name}</CardTitle>
                <CardDescription>{player.rank}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm flex-1">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="font-semibold text-muted-foreground">K/D Ratio</p>
                        <p className="text-lg font-bold">{player.stats?.kdRatio || 0}</p>
                    </div>
                    <div>
                        <p className="font-semibold text-muted-foreground">Victorias</p>
                        <p className="text-lg font-bold">{player.stats.wins}</p>
                    </div>
                    <div>
                        <p className="font-semibold text-muted-foreground">Bajas</p>
                        <p className="text-lg font-bold">{player.stats?.kills || 0}</p>
                    </div>
                    <div>
                        <p className="font-semibold text-muted-foreground">Horario</p>
                        <p className="text-sm font-bold">{player.playSchedule}</p>
                    </div>
                </div>
                <div className="space-y-2">
                    <p className="font-semibold text-muted-foreground">Armas Favoritas</p>
                    <div className="flex flex-wrap gap-1">
                        {(player.favoriteWeapons || []).map((weapon, index) => (
                            <span key={index} className="bg-muted px-2 py-1 rounded text-xs">{weapon}</span>
                        ))}
                    </div>
                </div>
                <div className="space-y-2">
                    <p className="font-semibold text-muted-foreground">Mapas Favoritos</p>
                    <div className="flex flex-wrap gap-1">
                        <span className="bg-muted px-2 py-1 rounded text-xs capitalize">{player.favoriteMap}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    ));



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
                        <PlayerCard player={friendsForComparison.find(f => f.id === player1Id)!} />
                        <PlayerCard player={friendsForComparison.find(f => f.id === player2Id)!} />
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
