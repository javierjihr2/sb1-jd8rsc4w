
"use client"

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wrench, PlusCircle, Trash2, Smartphone, Gamepad2, Loader2, Sparkles, ThumbsUp, ThumbsDown, CheckCircle, Brain, Terminal, ClipboardCopy, Target } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup } from "@/components/ui/select";
import { getSensitivity } from "@/ai/flows/sensitivityFlow";
import { getControls } from "@/ai/flows/controlsFlow";
import type { Sensitivity, SensitivityInput, Controls, ControlsInput } from "@/ai/schemas";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const initialLoadouts = [
    {
        id: 1,
        name: "Asalto Agresivo",
        primary: { name: "M416", sight: "Holo", grip: "Vertical" },
        secondary: { name: "UMP45", sight: "Red Dot", grip: "Half Grip" }
    },
    {
        id: 2,
        name: "Francotirador Letal",
        primary: { name: "Kar98k", sight: "8x", grip: "Cheek Pad" },
        secondary: { name: "Mini14", sight: "4x", grip: "Light Grip" }
    },
];

const deviceList = {
    Telefono: [
        { value: "Apple iPhone 15 Pro Max", label: "Apple iPhone 15 Pro Max" },
        { value: "Samsung Galaxy S24 Ultra", label: "Samsung Galaxy S24 Ultra" },
        { value: "Google Pixel 8 Pro", label: "Google Pixel 8 Pro" },
        { value: "Asus ROG Phone 8", label: "Asus ROG Phone 8" },
        { value: "Xiaomi 14 Pro", label: "Xiaomi 14 Pro" },
        { value: "OnePlus 12", label: "OnePlus 12" },
        { value: "Otro Telefono", label: "Otro Teléfono (Genérico)" },
    ],
    Tablet: [
        { value: "Apple iPad Pro 12.9", label: "Apple iPad Pro 12.9" },
        { value: "Samsung Galaxy Tab S9 Ultra", label: "Samsung Galaxy Tab S9 Ultra" },
        { value: "Apple iPad Air", label: "Apple iPad Air" },
        { value: "Xiaomi Pad 6", label: "Xiaomi Pad 6" },
        { value: "Otro Tablet", label: "Otro Tablet (Genérico)" },
    ]
}


export default function EquipmentPage() {
    const { toast } = useToast();

    // State for Loadouts
    const handleCreateLoadout = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        toast({
            title: "Equipamiento Creado",
            description: "Tu nuevo equipamiento ha sido guardado.",
        });
        (e.target as HTMLFormElement).reset();
    }

    // State for Sensitivity
    const [sensitivityInput, setSensitivityInput] = useState<Partial<SensitivityInput>>({});
    const [lastUsedSensitivityInput, setLastUsedSensitivityInput] = useState<Partial<SensitivityInput> | null>(null);
    const [sensitivity, setSensitivity] = useState<Sensitivity | null>(null);
    const [isSensitivityLoading, setIsSensitivityLoading] = useState(false);
    const [sensitivityError, setSensitivityError] = useState<string | null>(null);

    // State for Controls
    const [controlsInput, setControlsInput] = useState<Partial<ControlsInput>>({});
    const [lastUsedControlsInput, setLastUsedControlsInput] = useState<Partial<ControlsInput> | null>(null);
    const [controls, setControls] = useState<Controls | null>(null);
    const [isControlsLoading, setIsControlsLoading] = useState(false);
    const [controlsError, setControlsError] = useState<string | null>(null);


    const handleGenerateSensitivity = async () => {
        if (!sensitivityInput.deviceType || !sensitivityInput.screenSize || !sensitivityInput.gyroscope || !sensitivityInput.playStyle) {
            setSensitivityError("Por favor, completa todos los campos para generar una configuración.");
            return;
        }
        setIsSensitivityLoading(true);
        setSensitivityError(null);
        setSensitivity(null);
        setLastUsedSensitivityInput(sensitivityInput);
        try {
            const result = await getSensitivity(sensitivityInput as SensitivityInput);
            setSensitivity(result);
        } catch (e: any) {
            setSensitivityError("Hubo un error al contactar a la IA. Por favor, inténtalo de nuevo.");
            console.error(e);
        } finally {
            setIsSensitivityLoading(false);
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

    const handleGenerateControls = async () => {
        if (!controlsInput.fingerCount || !controlsInput.deviceType) {
            setControlsError("Por favor, selecciona todos los campos.");
            return;
        }
        setIsControlsLoading(true);
        setControlsError(null);
        setControls(null);
        setLastUsedControlsInput(controlsInput);
        try {
            const result = await getControls(controlsInput as ControlsInput);
            setControls(result);
        } catch (e: any) {
            setControlsError("Hubo un error al contactar a la IA. Por favor, inténtalo de nuevo.");
            console.error(e);
        } finally {
            setIsControlsLoading(false);
        }
    };

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

    const SensitivityPageSkeleton = () => (
        <Card>
            <CardHeader>
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
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
            </CardContent>
        </Card>
    );

    const ControlsResultSkeleton = () => (
        <Card>
            <CardHeader>
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
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
                <h1 className="text-3xl font-bold flex items-center gap-2"><Target className="w-8 h-8 text-primary"/> Taller de Precisión</h1>
                <p className="text-muted-foreground">Prepara tus armas, sensibilidad y controles para la batalla.</p>
            </div>

            <Tabs defaultValue="sensitivity" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="sensitivity"><Smartphone className="mr-2" />Sensibilidad</TabsTrigger>
                    <TabsTrigger value="controls"><Gamepad2 className="mr-2" />Controles</TabsTrigger>
                    <TabsTrigger value="loadouts"><Wrench className="mr-2" />Equipamientos</TabsTrigger>
                </TabsList>
                
                {/* Sensitivity Tab */}
                <TabsContent value="sensitivity" className="mt-6">
                     <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                        <div className="lg:col-span-1">
                            <Card className="sticky top-20">
                                <CardHeader>
                                    <CardTitle>Perfil de Sensibilidad</CardTitle>
                                    <CardDescription>Proporciona los detalles para una recomendación a medida.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="device-type-sens">Tipo de Dispositivo</Label>
                                        <Select onValueChange={(value: "Telefono" | "Tablet") => setSensitivityInput(prev => ({ ...prev, deviceType: value, device: undefined }))} value={sensitivityInput.deviceType}>
                                            <SelectTrigger id="device-type-sens"><SelectValue placeholder="Selecciona tu dispositivo" /></SelectTrigger>
                                            <SelectContent><SelectItem value="Telefono">Teléfono</SelectItem><SelectItem value="Tablet">Tablet</SelectItem></SelectContent>
                                        </Select>
                                    </div>
                                     <div className="space-y-2">
                                        <Label htmlFor="device-model">Dispositivo</Label>
                                        <Select 
                                            onValueChange={(value) => setSensitivityInput(prev => ({ ...prev, device: value }))} 
                                            value={sensitivityInput.device}
                                            disabled={!sensitivityInput.deviceType}
                                        >
                                            <SelectTrigger id="device-model"><SelectValue placeholder={!sensitivityInput.deviceType ? "Primero elige un tipo" : "Selecciona tu dispositivo"} /></SelectTrigger>
                                            <SelectContent>
                                                {sensitivityInput.deviceType && deviceList[sensitivityInput.deviceType].map(device => (
                                                     <SelectItem key={device.value} value={device.value}>{device.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="screen-size">Tamaño de Pantalla (Pulgadas)</Label>
                                        <Input id="screen-size" type="number" placeholder="Ej: 6.7" value={sensitivityInput.screenSize || ''} onChange={(e) => setSensitivityInput(prev => ({ ...prev, screenSize: parseFloat(e.target.value) || undefined }))} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="playstyle">Estilo de Juego Preferido</Label>
                                        <Select onValueChange={(value) => setSensitivityInput(prev => ({ ...prev, playStyle: value }))} value={sensitivityInput.playStyle}>
                                            <SelectTrigger id="playstyle"><SelectValue placeholder="Selecciona tu estilo" /></SelectTrigger>
                                            <SelectContent><SelectItem value="cercano">Combate Cercano</SelectItem><SelectItem value="media">Media Distancia</SelectItem><SelectItem value="larga">Larga Distancia (Francotirador)</SelectItem><SelectItem value="versatil">Versátil (Mixto)</SelectItem></SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="gyroscope">¿Usas Giroscopio?</Label>
                                        <Select onValueChange={(value) => setSensitivityInput(prev => ({ ...prev, gyroscope: value }))} value={sensitivityInput.gyroscope}>
                                            <SelectTrigger id="gyroscope"><SelectValue placeholder="Selecciona una opción" /></SelectTrigger>
                                            <SelectContent><SelectItem value="si">Sí</SelectItem><SelectItem value="no">No</SelectItem></SelectContent>
                                        </Select>
                                    </div>
                                    <Button onClick={handleGenerateSensitivity} disabled={isSensitivityLoading} className="w-full">
                                        {isSensitivityLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                                        {isSensitivityLoading ? "Generando..." : "Generar Sensibilidad"}
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                        <div className="lg:col-span-2">
                            {isSensitivityLoading && <SensitivityPageSkeleton />}
                            {sensitivityError && !isSensitivityLoading && (
                                <Alert variant="destructive"><Terminal className="h-4 w-4" /><AlertTitle>Error de Generación</AlertTitle><AlertDescription>{sensitivityError}</AlertDescription></Alert>
                            )}
                            {!isSensitivityLoading && !sensitivity && !sensitivityError && (
                                <Card className="h-full flex flex-col items-center justify-center text-center p-8 border-dashed min-h-[400px]">
                                    <div className="p-4 bg-primary/10 rounded-full mb-4"><Smartphone className="h-12 w-12 text-primary" /></div>
                                    <h2 className="text-2xl font-bold">Tu Configuración Perfecta te Espera</h2>
                                    <p className="text-muted-foreground max-w-md">Usa el panel para configurar tu perfil y la IA creará una configuración de sensibilidad optimizada.</p>
                                </Card>
                            )}
                            {sensitivity && !isSensitivityLoading && lastUsedSensitivityInput &&(
                                <Card className="animate-in fade-in-50">
                                    <CardHeader>
                                        <CardTitle>Tu Configuración de Sensibilidad Personalizada</CardTitle>
                                        <CardDescription className="capitalize pt-1">Valores optimizados para un {lastUsedSensitivityInput.deviceType} ({lastUsedSensitivityInput.device}) de {lastUsedSensitivityInput.screenSize}", un estilo de juego {lastUsedSensitivityInput.playStyle}, {lastUsedSensitivityInput.gyroscope === 'si' ? ' con' : ' sin'} giroscopio.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-8">
                                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            <SensitivityTable title="Sensibilidad de Cámara" data={sensitivity.camera} />
                                            <SensitivityTable title="Sensibilidad de ADS" data={sensitivity.ads} />
                                            {sensitivity.gyroscope && <SensitivityTable title="Sensibilidad de Giroscopio" data={sensitivity.gyroscope} />}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-primary mb-2">Código de Sensibilidad</h3>
                                            <div className="flex items-center gap-2"><Input value={sensitivity.code} readOnly className="bg-muted"/><Button variant="outline" size="icon" onClick={handleCopyCode}><ClipboardCopy className="h-4 w-4"/></Button></div>
                                            <p className="text-xs text-muted-foreground mt-2">Puedes usar este código para importar la configuración directamente en el juego.</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>
                </TabsContent>
                
                {/* Controls Tab */}
                <TabsContent value="controls" className="mt-6">
                    <div className="space-y-8">
                        <Card>
                            <CardHeader>
                                <CardTitle>Define tu Estilo de Controles</CardTitle>
                                <CardDescription>Dinos cómo juegas y la IA creará una recomendación de layout (HUD) para ti.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 items-start">
                                <div className="space-y-2">
                                    <Label htmlFor="device-type-controls">Tipo de Dispositivo</Label>
                                    <Select onValueChange={(value) => setControlsInput(prev => ({...prev, deviceType: value}))} value={controlsInput.deviceType}>
                                        <SelectTrigger id="device-type-controls"><SelectValue placeholder="Selecciona un dispositivo" /></SelectTrigger>
                                        <SelectContent><SelectItem value="Telefono">Teléfono</SelectItem><SelectItem value="Tablet">Tablet</SelectItem></SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="finger-count">Número de Dedos</Label>
                                    <Select onValueChange={(value) => setControlsInput(prev => ({...prev, fingerCount: parseInt(value)}))} value={controlsInput.fingerCount?.toString()}>
                                        <SelectTrigger id="finger-count"><SelectValue placeholder="Selecciona el número de dedos" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="2">2 Dedos (Pulgares)</SelectItem>
                                            <SelectItem value="3">3 Dedos (Garra)</SelectItem>
                                            <SelectItem value="4">4 Dedos (Garra)</SelectItem>
                                            <SelectItem value="5">5+ Dedos (Garra Avanzada)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2 pt-6">
                                    <Button onClick={handleGenerateControls} disabled={isControlsLoading} className="w-full">
                                        {isControlsLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                                        {isControlsLoading ? "Analizando..." : "Generar Controles"}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                        {isControlsLoading && <ControlsResultSkeleton />}
                        {controlsError && !isControlsLoading && (
                            <Alert variant="destructive"><Terminal className="h-4 w-4" /><AlertTitle>Error de Generación</AlertTitle><AlertDescription>{controlsError}</AlertDescription></Alert>
                        )}
                        {!isControlsLoading && !controls && !controlsError && (
                            <Card className="h-full flex flex-col items-center justify-center text-center p-8 border-dashed min-h-[400px]">
                                <div className="p-4 bg-primary/10 rounded-full mb-4"><Gamepad2 className="h-12 w-12 text-primary" /></div>
                                <h2 className="text-2xl font-bold">Tu Layout de Controles Ideal te Espera</h2>
                                <p className="text-muted-foreground max-w-md">Selecciona tu tipo de dispositivo y con cuántos dedos juegas. La IA diseñará un esquema de botones optimizado.</p>
                            </Card>
                        )}
                        {controls && !isControlsLoading && lastUsedControlsInput && (
                            <Card className="animate-in fade-in-50">
                                <CardHeader>
                                    <CardTitle className="text-2xl text-primary">{controls.layoutName}</CardTitle>
                                    <CardDescription>Una configuración para {lastUsedControlsInput.fingerCount} dedos en un {lastUsedControlsInput.deviceType}, optimizada para el máximo rendimiento.</CardDescription>
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
                </TabsContent>
                
                {/* Loadouts Tab */}
                <TabsContent value="loadouts" className="mt-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                        <div className="lg:col-span-2 space-y-8">
                            <div className="grid gap-6 md:grid-cols-2">
                                {initialLoadouts.map((loadout) => (
                                    <Card key={loadout.id}>
                                        <CardHeader>
                                            <CardTitle className="flex justify-between items-center">
                                                {loadout.name}
                                                <Button variant="ghost" size="icon">
                                                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                                                </Button>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-6">
                                            <div className="space-y-3">
                                                <Label className="text-muted-foreground">Principal</Label>
                                                <div className="flex items-start gap-4">
                                                    <Image src="https://placehold.co/120x60.png" alt={loadout.primary.name} width={120} height={60} className="rounded-md bg-muted object-cover" data-ai-hint="weapon" />
                                                    <div className="space-y-1 text-sm">
                                                        <p className="font-bold text-base">{loadout.primary.name}</p>
                                                        <p><span className="font-semibold">Mira:</span> {loadout.primary.sight}</p>
                                                        <p><span className="font-semibold">Agarre:</span> {loadout.primary.grip}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <Label className="text-muted-foreground">Secundaria</Label>
                                                <div className="flex items-start gap-4">
                                                    <Image src="https://placehold.co/120x60.png" alt={loadout.secondary.name} width={120} height={60} className="rounded-md bg-muted object-cover" data-ai-hint="weapon" />
                                                    <div className="space-y-1 text-sm">
                                                        <p className="font-bold text-base">{loadout.secondary.name}</p>
                                                        <p><span className="font-semibold">Mira:</span> {loadout.secondary.sight}</p>
                                                        <p><span className="font-semibold">Agarre:</span> {loadout.secondary.grip}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>

                        <div className="lg:col-span-1">
                            <Card className="sticky top-20">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <PlusCircle className="h-5 w-5 text-primary" />
                                        Crear Equipamiento
                                    </CardTitle>
                                    <CardDescription>
                                        Diseña tu combinación de armas y accesorios.
                                    </CardDescription>
                                </CardHeader>
                                <form onSubmit={handleCreateLoadout}>
                                    <CardContent className="space-y-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="loadout-name">Nombre del Equipamiento</Label>
                                            <Input id="loadout-name" placeholder="Ej: Asalto Sigiloso" required />
                                        </div>
                                        <div className="space-y-4 p-4 border rounded-lg">
                                            <h4 className="font-semibold">Arma Principal</h4>
                                            <div className="space-y-2">
                                                <Label htmlFor="primary-weapon">Arma</Label>
                                                <Input id="primary-weapon" placeholder="Ej: M416" required />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="primary-sight">Mira</Label>
                                                <Input id="primary-sight" placeholder="Ej: Red Dot Scope" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="primary-grip">Agarre</Label>
                                                <Input id="primary-grip" placeholder="Ej: Vertical Foregrip" />
                                            </div>
                                        </div>
                                        <div className="space-y-4 p-4 border rounded-lg">
                                            <h4 className="font-semibold">Arma Secundaria</h4>
                                            <div className="space-y-2">
                                                <Label htmlFor="secondary-weapon">Arma</Label>
                                                <Input id="secondary-weapon" placeholder="Ej: UMP45" required />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="secondary-sight">Mira</Label>
                                                <Input id="secondary-sight" placeholder="Ej: Holographic Sight" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="secondary-grip">Agarre</Label>
                                                <Input id="secondary-grip" placeholder="Ej: Angled Foregrip" />
                                            </div>
                                        </div>
                                        <Button type="submit" className="w-full">
                                            Guardar Equipamiento
                                        </Button>
                                    </CardContent>
                                </form>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

            </Tabs>
        </div>
    );
}
