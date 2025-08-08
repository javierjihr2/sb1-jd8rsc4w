
"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { getSensitivity } from "@/ai/flows/sensitivityFlow";
import type { Sensitivity, SensitivityInput } from "@/ai/schemas";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Sparkles, Smartphone, Terminal, ClipboardCopy } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

export default function SensitivityPage() {
    const [input, setInput] = useState<Partial<SensitivityInput>>({});
    const [lastUsedInput, setLastUsedInput] = useState<Partial<SensitivityInput> | null>(null);
    const [sensitivity, setSensitivity] = useState<Sensitivity | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    const handleGenerate = async () => {
        if (!input.deviceType || !input.screenSize || !input.gyroscope) {
            setError("Por favor, completa todos los campos para generar una configuración.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setSensitivity(null);
        setLastUsedInput(input);
        try {
            const result = await getSensitivity(input as SensitivityInput);
            setSensitivity(result);
        } catch (e: any) {
            setError("Hubo un error al contactar a la IA. Por favor, inténtalo de nuevo.");
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleCopyCode = () => {
        if(sensitivity?.code) {
            navigator.clipboard.writeText(sensitivity.code);
            toast({
                title: "Copiado",
                description: "El código de sensibilidad ha sido copiado al portapapeles."
            })
        }
    }

    const SensitivityTable = ({ title, data }: { title: string, data: any }) => (
        <div>
            <h3 className="text-lg font-semibold text-primary mb-2">{title}</h3>
            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Mira</TableHead>
                            <TableHead className="text-right">Sensibilidad</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow><TableCell>3ra Persona (TPP)</TableCell><TableCell className="text-right">{data.tpp}%</TableCell></TableRow>
                        <TableRow><TableCell>1ra Persona (FPP)</TableCell><TableCell className="text-right">{data.fpp}%</TableCell></TableRow>
                        <TableRow><TableCell>Punto Rojo, Holográfica</TableCell><TableCell className="text-right">{data.redDot}%</TableCell></TableRow>
                        <TableRow><TableCell>Mira 2x</TableCell><TableCell className="text-right">{data.scope2x}%</TableCell></TableRow>
                        <TableRow><TableCell>Mira 3x</TableCell><TableCell className="text-right">{data.scope3x}%</TableCell></TableRow>
                        <TableRow><TableCell>Mira 4x</TableCell><TableCell className="text-right">{data.scope4x}%</TableCell></TableRow>
                        <TableRow><TableCell>Mira 6x</TableCell><TableCell className="text-right">{data.scope6x}%</TableCell></TableRow>
                        <TableRow><TableCell>Mira 8x</TableCell><TableCell className="text-right">{data.scope8x}%</TableCell></TableRow>
                    </TableBody>
                </Table>
            </div>
        </div>
    );

    const PageSkeleton = () => (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-4">
                     <Skeleton className="h-8 w-1/2" />
                     <div className="border rounded-lg p-2">
                        <Skeleton className="h-10 w-full mb-1" />
                        <Skeleton className="h-10 w-full mb-1" />
                        <Skeleton className="h-10 w-full mb-1" />
                        <Skeleton className="h-10 w-full" />
                     </div>
                </div>
            ))}
        </div>
    );


    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-2"><Smartphone className="w-8 h-8 text-primary"/> Generador de Sensibilidad IA</h1>
                <p className="text-muted-foreground">Obtén la configuración de sensibilidad perfecta para tu dispositivo y estilo de juego.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle>Configura tu Dispositivo</CardTitle>
                            <CardDescription>Proporciona los detalles para una recomendación a medida.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="device-type">Tipo de Dispositivo</Label>
                                <Select onValueChange={(value) => setInput(prev => ({ ...prev, deviceType: value }))} value={input.deviceType}>
                                    <SelectTrigger id="device-type">
                                        <SelectValue placeholder="Selecciona tu dispositivo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Telefono">Teléfono</SelectItem>
                                        <SelectItem value="Tablet">Tablet</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="device-brand">Marca del Dispositivo (Opcional)</Label>
                                <Input 
                                    id="device-brand" 
                                    placeholder="Ej: Samsung, Apple" 
                                    value={input.deviceBrand || ''}
                                    onChange={(e) => setInput(prev => ({ ...prev, deviceBrand: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="device-model">Modelo del Dispositivo (Opcional)</Label>
                                <Input 
                                    id="device-model" 
                                    placeholder="Ej: Galaxy S23, iPhone 14 Pro" 
                                    value={input.deviceModel || ''}
                                    onChange={(e) => setInput(prev => ({ ...prev, deviceModel: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="screen-size">Tamaño de Pantalla (Pulgadas)</Label>
                                <Input 
                                    id="screen-size" 
                                    type="number" 
                                    placeholder="Ej: 6.7" 
                                    value={input.screenSize || ''}
                                    onChange={(e) => setInput(prev => ({ ...prev, screenSize: parseFloat(e.target.value) || undefined }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="gyroscope">¿Usas Giroscopio?</Label>
                                <Select onValueChange={(value) => setInput(prev => ({ ...prev, gyroscope: value }))} value={input.gyroscope}>
                                    <SelectTrigger id="gyroscope">
                                        <SelectValue placeholder="Selecciona una opción" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="si">Sí</SelectItem>
                                        <SelectItem value="no">No</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                             <Button onClick={handleGenerate} disabled={isLoading} className="w-full">
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                                {isLoading ? "Generando..." : "Generar Sensibilidad"}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
                 <div className="lg:col-span-2">
                    {isLoading && <PageSkeleton />}
                    
                    {error && !isLoading && (
                        <Alert variant="destructive">
                            <Terminal className="h-4 w-4" />
                            <AlertTitle>Error de Generación</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {!isLoading && !sensitivity && !error && (
                        <Card className="h-full flex flex-col items-center justify-center text-center p-8 border-dashed min-h-[400px]">
                            <div className="p-4 bg-primary/10 rounded-full mb-4">
                                <Smartphone className="h-12 w-12 text-primary" />
                            </div>
                            <h2 className="text-2xl font-bold">Tu Configuración Perfecta te Espera</h2>
                            <p className="text-muted-foreground max-w-md">
                            Usa el panel para configurar tu dispositivo y la IA creará una configuración de sensibilidad optimizada para dominar el campo de batalla.
                            </p>
                        </Card>
                    )}

                    {sensitivity && !isLoading && lastUsedInput &&(
                        <Card className="animate-in fade-in-50">
                            <CardHeader>
                                <CardTitle>Tu Configuración de Sensibilidad Personalizada</CardTitle>
                                <CardDescription>
                                    Estos valores están optimizados para un {lastUsedInput.deviceType}
                                    {lastUsedInput.deviceBrand && ` ${lastUsedInput.deviceBrand}`}
                                    {lastUsedInput.deviceModel && ` ${lastUsedInput.deviceModel}`}
                                    {` de ${lastUsedInput.screenSize}"`}
                                    {lastUsedInput.gyroscope === 'si' ? ' con' : ' sin'} giroscopio.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-8">
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <SensitivityTable title="Sensibilidad de Cámara" data={sensitivity.camera} />
                                    <SensitivityTable title="Sensibilidad de ADS" data={sensitivity.ads} />
                                    {sensitivity.gyroscope && <SensitivityTable title="Sensibilidad de Giroscopio" data={sensitivity.gyroscope} />}
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-primary mb-2">Código de Sensibilidad</h3>
                                    <div className="flex items-center gap-2">
                                        <Input value={sensitivity.code} readOnly className="bg-muted"/>
                                        <Button variant="outline" size="icon" onClick={handleCopyCode}>
                                            <ClipboardCopy className="h-4 w-4"/>
                                        </Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-2">Puedes usar este código para importar la configuración directamente en el juego.</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                 </div>

            </div>
        </div>
    )
}
