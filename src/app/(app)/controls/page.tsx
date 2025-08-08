
"use client"

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getControls } from "@/ai/flows/controlsFlow";
import type { Controls, ControlsInput } from "@/ai/schemas";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Sparkles, Gamepad2, ThumbsUp, ThumbsDown, CheckCircle, Brain, Terminal } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function ControlsPage() {
    const [fingerCount, setFingerCount] = useState<number | null>(null);
    const [controls, setControls] = useState<Controls | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!fingerCount) {
            setError("Por favor, selecciona el número de dedos.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setControls(null);
        try {
            const input: ControlsInput = { fingerCount };
            const result = await getControls(input);
            setControls(result);
        } catch (e: any) {
            setError("Hubo un error al contactar a la IA. Por favor, inténtalo de nuevo.");
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const ResultSkeleton = () => (
        <Card>
            <CardHeader>
                <Skeleton className="h-8 w-3/4" />
            </CardHeader>
            <CardContent className="grid lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <Skeleton className="aspect-[4/3] w-full rounded-lg" />
                    <div className="space-y-4">
                        <Skeleton className="h-6 w-1/4" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                    </div>
                </div>
                <div className="space-y-6">
                    <div>
                        <Skeleton className="h-6 w-1/3 mb-2" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <div>
                        <Skeleton className="h-6 w-1/3 mb-2" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <div>
                        <Skeleton className="h-6 w-1/3 mb-2" />
                        <Skeleton className="h-16 w-full" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-2"><Gamepad2 className="w-8 h-8 text-primary"/> Generador de Controles IA</h1>
                <p className="text-muted-foreground">Encuentra el layout (HUD) perfecto para tu estilo de juego.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Define tu Estilo</CardTitle>
                    <CardDescription>Dinos cómo juegas y la IA creará una recomendación de controles para ti.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row items-center gap-4">
                     <Select onValueChange={(value) => setFingerCount(parseInt(value))} value={fingerCount?.toString()}>
                        <SelectTrigger className="w-full sm:w-[280px]">
                            <SelectValue placeholder="Selecciona el número de dedos" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="2">2 Dedos (Pulgares)</SelectItem>
                            <SelectItem value="3">3 Dedos (Garra)</SelectItem>
                            <SelectItem value="4">4 Dedos (Garra)</SelectItem>
                            <SelectItem value="5">5+ Dedos (Garra Avanzada)</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button onClick={handleGenerate} disabled={isLoading} className="w-full sm:w-auto">
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                        {isLoading ? "Analizando..." : "Generar Controles"}
                    </Button>
                </CardContent>
            </Card>

            {isLoading && <ResultSkeleton />}

            {error && !isLoading && (
                <Alert variant="destructive">
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>Error de Generación</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {!isLoading && !controls && !error && (
                 <Card className="h-full flex flex-col items-center justify-center text-center p-8 border-dashed min-h-[400px]">
                    <div className="p-4 bg-primary/10 rounded-full mb-4">
                        <Gamepad2 className="h-12 w-12 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold">Tu Layout de Controles Ideal te Espera</h2>
                    <p className="text-muted-foreground max-w-md">
                       Selecciona con cuántos dedos juegas y la IA diseñará un esquema de botones optimizado para mejorar tu velocidad y precisión.
                    </p>
                </Card>
            )}

            {controls && !isLoading && (
                <Card className="animate-in fade-in-50">
                    <CardHeader>
                        <CardTitle className="text-2xl text-primary">{controls.layoutName}</CardTitle>
                        <CardDescription>Una configuración para {fingerCount} dedos optimizada para el máximo rendimiento.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid lg:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <Image src={controls.imageUrl} alt={controls.layoutName} width={400} height={300} className="rounded-lg border bg-muted object-cover w-full" data-ai-hint="game controls"/>
                             <div>
                                <h3 className="font-semibold text-lg flex items-center gap-2 mb-2"><Brain className="h-5 w-5 text-accent"/> Acciones Clave</h3>
                                <div className="text-sm text-muted-foreground space-y-2 p-4 bg-muted/50 rounded-lg">
                                    <p><strong>Movimiento:</strong> {controls.keyActions.movement}</p>
                                    <p><strong>Apuntar:</strong> {controls.keyActions.aim}</p>
                                    <p><strong>Disparar:</strong> {controls.keyActions.shoot}</p>
                                    <p><strong>Acciones Principales:</strong> {controls.keyActions.mainActions}</p>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div>
                                <h3 className="font-semibold text-lg flex items-center gap-2 mb-2"><ThumbsUp className="h-5 w-5 text-green-500"/> Ventajas</h3>
                                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                    {controls.advantages.map((adv, i) => <li key={i}>{adv}</li>)}
                                </ul>
                            </div>
                             <div>
                                <h3 className="font-semibold text-lg flex items-center gap-2 mb-2"><ThumbsDown className="h-5 w-5 text-red-500"/> Desventajas</h3>
                                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                    {controls.disadvantages.map((dis, i) => <li key={i}>{dis}</li>)}
                                </ul>
                            </div>
                             <div>
                                <h3 className="font-semibold text-lg flex items-center gap-2 mb-2"><CheckCircle className="h-5 w-5 text-primary"/> Consejos para Dominarlo</h3>
                                <div className="space-y-3">
                                {controls.tips.map((tip, i) => (
                                    <div key={i} className="p-3 bg-muted/50 rounded-lg">
                                        <p className="font-semibold text-card-foreground">{tip.title}</p>
                                        <p className="text-sm text-muted-foreground">{tip.description}</p>
                                    </div>
                                ))}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

        </div>
    );
}
