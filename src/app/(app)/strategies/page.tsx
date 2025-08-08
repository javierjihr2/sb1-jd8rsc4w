
"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { getStrategy } from "@/ai/flows/strategyFlow";
import type { Strategy, StrategyInput } from "@/ai/flows/strategyFlow";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Sparkles, Map, MapPin, Gamepad2, Shield, Users, Trophy, Lightbulb, Terminal } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function StrategiesPage() {
    const [input, setInput] = useState<Partial<StrategyInput>>({ squadSize: 4 });
    const [strategy, setStrategy] = useState<Strategy | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerateStrategy = async () => {
        if (!input.map || !input.playStyle || !input.squadSize) {
            setError("Por favor, completa todos los campos para generar una estrategia.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setStrategy(null);
        try {
            const result = await getStrategy(input as StrategyInput);
            setStrategy(result);
        } catch (e: any) {
            setError("Hubo un error al contactar a la IA. Por favor, inténtalo de nuevo.");
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const StrategySkeleton = () => (
        <Card>
            <CardHeader>
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Skeleton className="h-6 w-1/4" />
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-5/6" />
                </div>
                 <div className="space-y-2">
                    <Skeleton className="h-6 w-1/4" />
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-5/6" />
                </div>
                 <div className="space-y-2">
                    <Skeleton className="h-6 w-1/4" />
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-5/6" />
                </div>
            </CardContent>
        </Card>
    );

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-1 space-y-8">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2"><Map className="w-8 h-8 text-primary"/> Generador de Estrategias</h1>
                    <p className="text-muted-foreground">Planifica tu partida perfecta con tácticas de nivel profesional generadas por IA.</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Configura tu Partida</CardTitle>
                        <CardDescription>Define los parámetros para recibir una estrategia a medida.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="map-select">Mapa</Label>
                            <Select onValueChange={(value) => setInput(prev => ({ ...prev, map: value }))}>
                                <SelectTrigger id="map-select">
                                    <SelectValue placeholder="Selecciona un mapa" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="erangel">Erangel</SelectItem>
                                    <SelectItem value="miramar">Miramar</SelectItem>
                                    <SelectItem value="sanhok">Sanhok</SelectItem>
                                    <SelectItem value="vikendi">Vikendi</SelectItem>
                                    <SelectItem value="livik">Livik</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="playstyle-select">Estilo de Juego</Label>
                            <Select onValueChange={(value) => setInput(prev => ({ ...prev, playStyle: value }))}>
                                <SelectTrigger id="playstyle-select">
                                    <SelectValue placeholder="Selecciona un estilo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="aggressive">Agresivo (Búsqueda y Destrucción)</SelectItem>
                                    <SelectItem value="passive">Pasivo (Supervivencia y Posicionamiento)</SelectItem>
                                    <SelectItem value="balanced">Equilibrado (Adaptable)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="squad-select">Tamaño de Escuadra</Label>
                             <Select defaultValue="4" onValueChange={(value) => setInput(prev => ({ ...prev, squadSize: parseInt(value) }))}>
                                <SelectTrigger id="squad-select">
                                    <SelectValue placeholder="Selecciona el tamaño del equipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">Solo</SelectItem>
                                    <SelectItem value="2">Dúo</SelectItem>
                                    <SelectItem value="4">Escuadra</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button onClick={handleGenerateStrategy} disabled={isLoading} className="w-full">
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                            {isLoading ? "Generando..." : "Generar Estrategia"}
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <div className="lg:col-span-2">
                {isLoading && <StrategySkeleton />}

                {error && !isLoading && (
                    <Alert variant="destructive">
                        <Terminal className="h-4 w-4" />
                        <AlertTitle>Error de Generación</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {!isLoading && !strategy && !error && (
                     <Card className="h-full flex flex-col items-center justify-center text-center p-8 border-dashed">
                        <div className="p-4 bg-primary/10 rounded-full mb-4">
                            <Map className="h-12 w-12 text-primary" />
                        </div>
                        <h2 className="text-2xl font-bold">Tu Plan de Batalla te Espera</h2>
                        <p className="text-muted-foreground max-w-md">
                           Usa el panel de la izquierda para configurar los detalles de tu partida y la IA creará un plan táctico completo para ayudarte a conseguir la victoria.
                        </p>
                    </Card>
                )}
                
                {strategy && !isLoading && (
                    <Card className="animate-in fade-in-50">
                        <CardHeader>
                            <CardTitle className="text-3xl text-primary">{strategy.strategyTitle}</CardTitle>
                            <CardDescription className="flex items-center gap-4 pt-2">
                                <span className="flex items-center gap-1"><MapPin className="h-4 w-4"/> {input.map}</span>
                                <span className="flex items-center gap-1"><Gamepad2 className="h-4 w-4"/> {input.playStyle}</span>
                                <span className="flex items-center gap-1"><Users className="h-4 w-4"/> {input.squadSize} Jugador(es)</span>
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <h3 className="font-bold text-lg flex items-center gap-2"><MapPin className="h-5 w-5 text-accent"/> Zona de Aterrizaje: {strategy.dropZone.name}</h3>
                                <p className="text-muted-foreground pl-7">{strategy.dropZone.reason}</p>
                            </div>

                            <div className="space-y-4">
                                <h3 className="font-bold text-xl">Fases de la Partida</h3>
                                <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                                    <h4 className="font-semibold flex items-center gap-2"><Shield className="h-5 w-5 text-primary"/> {strategy.earlyGame.title}</h4>
                                    <p className="text-muted-foreground text-sm">{strategy.earlyGame.plan}</p>
                                </div>
                                 <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                                    <h4 className="font-semibold flex items-center gap-2"><Gamepad2 className="h-5 w-5 text-primary"/> {strategy.midGame.title}</h4>
                                    <p className="text-muted-foreground text-sm">{strategy.midGame.plan}</p>
                                </div>
                                <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                                    <h4 className="font-semibold flex items-center gap-2"><Trophy className="h-5 w-5 text-primary"/> {strategy.lateGame.title}</h4>
                                    <p className="text-muted-foreground text-sm">{strategy.lateGame.plan}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="font-bold text-xl">Consejos Clave</h3>
                                <div className="grid gap-3">
                                    {strategy.tips.map((tip, index) => (
                                        <div key={index} className="flex items-start gap-3">
                                            <Lightbulb className="h-5 w-5 text-accent mt-1 flex-shrink-0" />
                                            <div>
                                                <h4 className="font-semibold">{tip.title}</h4>
                                                <p className="text-muted-foreground text-sm">{tip.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}

    