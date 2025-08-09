
"use client"

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { getMapPlan } from "@/ai/flows/mapPlannerFlow";
import type { MapPlanner, MapPlannerInput } from "@/ai/schemas";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Sparkles, Map, MapPin, Gamepad2, Shield, Users, Trophy, Lightbulb, Terminal, Route, Bomb } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const mapOptions = [
    { value: "erangel", label: "Erangel", imageUrl: "https://placehold.co/200x200.png" },
    { value: "miramar", label: "Miramar", imageUrl: "https://placehold.co/200x200.png" },
    { value: "sanhok", label: "Sanhok", imageUrl: "https://placehold.co/200x200.png" },
    { value: "vikendi", label: "Vikendi", imageUrl: "https://placehold.co/200x200.png" },
    { value: "livik", label: "Livik", imageUrl: "https://placehold.co/200x200.png" },
    { value: "rondo", label: "Rondo", imageUrl: "https://placehold.co/200x200.png" },
];

export default function PlayMapPage() {
    const [input, setInput] = useState<Partial<MapPlannerInput>>({ squadSize: 4 });
    const [plan, setPlan] = useState<MapPlanner | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastUsedInput, setLastUsedInput] = useState<Partial<MapPlannerInput> | null>(null);

    const handleGeneratePlan = async () => {
        if (!input.map || !input.playStyle || !input.squadSize || !input.riskLevel || !input.focus) {
            setError("Por favor, completa todos los campos para generar un plan.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setPlan(null);
        setLastUsedInput(input);
        try {
            const result = await getMapPlan(input as MapPlannerInput);
            setPlan(result);
        } catch (e: any) {
            setError("Hubo un error al contactar a la IA. Por favor, inténtalo de nuevo.");
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const selectedMapImage = lastUsedInput?.map 
        ? mapOptions.find(m => m.value === lastUsedInput.map)?.imageUrl ?? "https://placehold.co/200x200.png"
        : "https://placehold.co/200x200.png";

    const ResultSkeleton = () => (
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
            <div className="lg:col-span-1 space-y-8 lg:sticky top-20">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2"><Map className="w-8 h-8 text-primary"/> Juega Mapa</h1>
                    <p className="text-muted-foreground">Crea un plan de partida completo con la ayuda de la IA.</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Configura tu Partida</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Mapa</Label>
                            <Select onValueChange={(value) => setInput(p => ({ ...p, map: value }))} value={input.map}>
                                <SelectTrigger><SelectValue placeholder="Selecciona un mapa" /></SelectTrigger>
                                <SelectContent>{mapOptions.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-2">
                            <Label>Estilo de Juego</Label>
                            <Select onValueChange={(value) => setInput(p => ({ ...p, playStyle: value }))} value={input.playStyle}>
                                <SelectTrigger><SelectValue placeholder="Selecciona un estilo" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Agresivo">Agresivo</SelectItem>
                                    <SelectItem value="Pasivo">Pasivo</SelectItem>
                                    <SelectItem value="Equilibrado">Equilibrado</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-2">
                            <Label>Nivel de Riesgo</Label>
                            <Select onValueChange={(value) => setInput(p => ({ ...p, riskLevel: value }))} value={input.riskLevel}>
                                <SelectTrigger><SelectValue placeholder="Define el riesgo" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Bajo">Bajo (Caídas seguras)</SelectItem>
                                    <SelectItem value="Medio">Medio (Zonas disputadas)</SelectItem>
                                    <SelectItem value="Alto">Alto (Hot drops)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-2">
                            <Label>Enfoque Principal</Label>
                            <Select onValueChange={(value) => setInput(p => ({ ...p, focus: value }))} value={input.focus}>
                                <SelectTrigger><SelectValue placeholder="Prioridad de la partida" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Rotación y Posicionamiento">Rotación y Posicionamiento</SelectItem>
                                    <SelectItem value="Búsqueda de Combate">Búsqueda de Combate</SelectItem>
                                    <SelectItem value="Loteo Extremo">Loteo Extremo</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Tamaño de Escuadra</Label>
                            <Select onValueChange={(value) => setInput(p => ({ ...p, squadSize: parseInt(value) }))} value={input.squadSize?.toString()}>
                                <SelectTrigger><SelectValue placeholder="Selecciona el tamaño" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">Solo</SelectItem>
                                    <SelectItem value="2">Dúo</SelectItem>
                                    <SelectItem value="4">Escuadra</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button onClick={handleGeneratePlan} disabled={isLoading} className="w-full">
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                            {isLoading ? "Generando Plan..." : "Generar Plan de Partida"}
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <div className="lg:col-span-2 space-y-6">
                {isLoading && <ResultSkeleton />}

                {error && !isLoading && (
                    <Alert variant="destructive">
                        <Terminal className="h-4 w-4" />
                        <AlertTitle>Error de Generación</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {!isLoading && !plan && !error && (
                     <Card className="h-full flex flex-col items-center justify-center text-center p-8 border-dashed min-h-[500px]">
                        <div className="p-4 bg-primary/10 rounded-full mb-4">
                            <Map className="h-12 w-12 text-primary" />
                        </div>
                        <h2 className="text-2xl font-bold">Tu Plan de Batalla te Espera</h2>
                        <p className="text-muted-foreground max-w-md text-justify">
                           Usa el panel de la izquierda para configurar los detalles de tu partida y la IA creará un plan táctico completo para ayudarte a conseguir la victoria.
                        </p>
                    </Card>
                )}
                
                {plan && !isLoading && lastUsedInput && (
                    <div className="animate-in fade-in-50 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-3xl text-primary">{plan.planTitle}</CardTitle>
                                <CardDescription className="flex items-center gap-x-4 gap-y-1 pt-2 capitalize flex-wrap">
                                    <span className="flex items-center gap-1"><MapPin className="h-4 w-4"/> {lastUsedInput.map}</span>
                                    <span className="flex items-center gap-1"><Gamepad2 className="h-4 w-4"/> {lastUsedInput.playStyle}</span>
                                    <span className="flex items-center gap-1"><Users className="h-4 w-4"/> {lastUsedInput.squadSize} Jugador(es)</span>
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-col sm:flex-row items-center gap-6">
                                <Image src={selectedMapImage} alt={`Mapa de ${lastUsedInput.map}`} width={200} height={200} className="object-cover rounded-lg border-2" data-ai-hint={`${lastUsedInput.map} map`}/>
                                <div>
                                    <h3 className="font-bold text-lg flex items-center gap-2 mb-2"><MapPin className="h-5 w-5 text-accent"/> Zona de Aterrizaje: {plan.dropZone.name}</h3>
                                    <p className="text-muted-foreground text-sm text-justify">{plan.dropZone.reason}</p>
                                </div>
                            </CardContent>
                        </Card>
                        
                        <Card>
                             <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Lightbulb className="h-5 w-5 text-primary"/> Fases de la Partida</CardTitle>
                             </CardHeader>
                             <CardContent className="grid md:grid-cols-3 gap-4 text-left">
                                <div className="p-4 bg-muted/50 rounded-lg">
                                    <h4 className="font-semibold flex items-center gap-2 mb-2"><Shield className="h-5 w-5 text-accent"/> Juego Temprano</h4>
                                    <p className="text-muted-foreground text-sm text-justify">{plan.earlyGame.plan}</p>
                                </div>
                                 <div className="p-4 bg-muted/50 rounded-lg">
                                    <h4 className="font-semibold flex items-center gap-2 mb-2"><Gamepad2 className="h-5 w-5 text-accent"/> Juego Medio</h4>
                                    <p className="text-muted-foreground text-sm text-justify">{plan.midGame.plan}</p>
                                </div>
                                <div className="p-4 bg-muted/50 rounded-lg">
                                    <h4 className="font-semibold flex items-center gap-2 mb-2"><Trophy className="h-5 w-5 text-accent"/> Juego Tardío</h4>
                                    <p className="text-muted-foreground text-sm text-justify">{plan.lateGame.plan}</p>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="grid md:grid-cols-2 gap-6">
                            <Card>
                                 <CardHeader>
                                    <CardTitle className="flex items-center gap-2"><Bomb className="h-5 w-5 text-primary"/> Equipamiento Ideal</CardTitle>
                                 </CardHeader>
                                 <CardContent>
                                    <p><strong className="text-accent">Principal:</strong> {plan.recommendedLoadout.primaryWeapon}</p>
                                    <p><strong className="text-accent">Secundaria:</strong> {plan.recommendedLoadout.secondaryWeapon}</p>
                                    <p className="text-sm text-muted-foreground mt-2 text-justify">{plan.recommendedLoadout.reason}</p>
                                 </CardContent>
                            </Card>
                            
                            <Card>
                                 <CardHeader>
                                    <CardTitle className="flex items-center gap-2"><Route className="h-5 w-5 text-primary"/> Plan de Rotación</CardTitle>
                                 </CardHeader>
                                 <CardContent>
                                    <p className="text-muted-foreground text-sm text-justify">{plan.rotationPlan}</p>
                                 </CardContent>
                            </Card>
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
}


