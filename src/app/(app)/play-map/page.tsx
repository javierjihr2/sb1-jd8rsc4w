
"use client"

import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
// Importación dinámica para evitar errores en el cliente
import type { MapPlanner, MapPlannerInput } from "@/ai/schemas";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Sparkles, Map, MapPin, Gamepad2, Shield, Users, Trophy, Lightbulb, Terminal, Route, Bomb, ThumbsUp, ThumbsDown, Car, Target, CircleDot, UserCheck, Navigation, Crown, Zap, Heart, Crosshair } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { usePermissions } from "@/hooks/use-permissions";
import { CompactPermissionsDialog } from "@/components/compact-permissions-dialog";
import { useToast } from "@/hooks/use-toast";

const mapOptions = [
    { value: "erangel", label: "Erangel", imageUrl: "https://placehold.co/200x200.png" },
    { value: "miramar", label: "Miramar", imageUrl: "https://placehold.co/200x200.png" },
    { value: "sanhok", label: "Sanhok", imageUrl: "https://placehold.co/200x200.png" },
    { value: "vikendi", label: "Vikendi", imageUrl: "https://placehold.co/200x200.png" },
    { value: "livik", label: "Livik", imageUrl: "https://placehold.co/200x200.png" },
    { value: "rondo", label: "Rondo", imageUrl: "https://placehold.co/200x200.png" },
];

const mapDropZones: Record<string, { value: string; label: string }[]> = {
  erangel: [
    { value: "Pochinki", label: "Pochinki" },
    { value: "School", label: "School" },
    { value: "Rozhok", label: "Rozhok" },
    { value: "Sosnovka Military Base", label: "Sosnovka Military Base" },
    { value: "Georgopol", label: "Georgopol" },
    { value: "Yasnaya Polyana", label: "Yasnaya Polyana" },
    { value: "Mylta", label: "Mylta" },
    { value: "Mylta Power", label: "Mylta Power" },
    { value: "Novorepnoye", label: "Novorepnoye" },
    { value: "Gatka", label: "Gatka" },
    { value: "Zharki", label: "Zharki" },
    { value: "Shooting Range", label: "Shooting Range" },
    { value: "Prison", label: "Prison" },
    { value: "Mansion", label: "Mansion" },
    { value: "Ferry Pier", label: "Ferry Pier" },
  ],
  miramar: [
    { value: "Pecado", label: "Pecado" },
    { value: "Hacienda del Patron", label: "Hacienda del Patrón" },
    { value: "San Martin", label: "San Martín" },
    { value: "Los Leones", label: "Los Leones" },
    { value: "El Pozo", label: "El Pozo" },
    { value: "Chumacera", label: "Chumacera" },
    { value: "El Azahar", label: "El Azahar" },
    { value: "La Cobreria", label: "La Cobrería" },
    { value: "Monte Nuevo", label: "Monte Nuevo" },
    { value: "Power Grid", label: "Power Grid" },
    { value: "Impala", label: "Impala" },
    { value: "Cruz del Valle", label: "Cruz del Valle" },
    { value: "Water Treatment", label: "Water Treatment" },
  ],
  sanhok: [
    { value: "Bootcamp", label: "Bootcamp" },
    { value: "Paradise Resort", label: "Paradise Resort" },
    { value: "Ruins", label: "Ruins" },
    { value: "Quarry", label: "Quarry" },
    { value: "Docks", label: "Docks" },
    { value: "Pai Nan", label: "Pai Nan" },
    { value: "Ha Tinh", label: "Ha Tinh" },
    { value: "Camp Alpha", label: "Camp Alpha" },
    { value: "Camp Bravo", label: "Camp Bravo" },
    { value: "Camp Charlie", label: "Camp Charlie" },
    { value: "Cave", label: "Cave" },
    { value: "Sahmee", label: "Sahmee" },
  ],
  vikendi: [
    { value: "Castle", label: "Castle" },
    { value: "Dino Park", label: "Dino Park" },
    { value: "Volnova", label: "Volnova" },
    { value: "Goroka", label: "Goroka" },
    { value: "Cosmodrome", label: "Cosmodrome" },
    { value: "Dobro Mesto", label: "Dobro Mesto" },
    { value: "Krichas", label: "Krichas" },
    { value: "Podvosto", label: "Podvosto" },
    { value: "Villa", label: "Villa" },
    { value: "Tovar", label: "Tovar" },
    { value: "Cement Factory", label: "Cement Factory" },
  ],
  livik: [
    { value: "Midstein", label: "Midstein" },
    { value: "Blomster", label: "Blomster" },
    { value: "Power Plant", label: "Power Plant" },
    { value: "Iceborg", label: "Iceborg" },
    { value: "Crabgrass", label: "Crabgrass" },
    { value: "Gronhus", label: "Gronhus" },
    { value: "Holdhus", label: "Holdhus" },
    { value: "Aqueduct", label: "Aqueduct" },
    { value: "East Port", label: "East Port" },
  ],
  rondo: [
      { value: "Jadina City", label: "Jadina City" },
      { value: "Rin Hua", label: "Rin Hua" },
      { value: "NEO Stahl", label: "NEO Stahl" },
      { value: "Stadium", label: "Stadium" },
      { value: "Bei Li", label: "Bei Li" },
      { value: "Long Hon", label: "Long Hon" },
      { value: "Firing Range", label: "Firing Range" },
      { value: "Rona", label: "Rona" },
      { value: "Titan Mine", label: "Titan Mine" },
  ]
};

export default function PlayMapPage() {
    const { toast } = useToast();
    const { permissions, requestLocationPermission, getCurrentLocation } = usePermissions();
    const [input, setInput] = useState<Partial<MapPlannerInput>>({ squadSize: 4 });
    const [plan, setPlan] = useState<MapPlanner | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastUsedInput, setLastUsedInput] = useState<Partial<MapPlannerInput> | null>(null);
    const [showPermissionsDialog, setShowPermissionsDialog] = useState(false);
    const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
    const [locationBasedSuggestion, setLocationBasedSuggestion] = useState<string | null>(null);

    // Función para obtener sugerencias basadas en ubicación
    const getLocationBasedSuggestion = (lat: number, lng: number) => {
        // Sugerencias simples basadas en coordenadas
        if (lat > 40 && lat < 50 && lng > -10 && lng < 30) {
            return "Basado en tu ubicación en Europa, Erangel podría ser ideal para tu estilo de juego.";
        } else if (lat > 25 && lat < 35 && lng > -125 && lng < -65) {
            return "Desde tu ubicación en América del Norte, Miramar ofrece un terreno similar al desierto del suroeste.";
        } else if (lat > -35 && lat < 35 && lng > 95 && lng < 145) {
            return "Tu ubicación en Asia te da ventaja en Sanhok, un mapa diseñado para la región.";
        } else {
            return "Explora diferentes mapas para encontrar el que mejor se adapte a tu estilo de juego.";
        }
    };

    // Función para solicitar ubicación
    const handleRequestLocation = async () => {
        if (!permissions.location) {
            setShowPermissionsDialog(true);
            return;
        }
        
        try {
            const location = await getCurrentLocation();
            if (location) {
                setUserLocation({ lat: location.latitude, lng: location.longitude });
                const suggestion = getLocationBasedSuggestion(location.latitude, location.longitude);
                setLocationBasedSuggestion(suggestion);
                toast({
                    title: "¡Ubicación obtenida! 📍",
                    description: "Ahora puedes ver sugerencias de mapas basadas en tu ubicación.",
                });
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "No se pudo obtener tu ubicación.",
            });
        }
    };

    const handlePermissionsComplete = (allGranted: boolean) => {
        setShowPermissionsDialog(false);
        if (allGranted && permissions.location) {
            handleRequestLocation();
        }
    };

    const handleGeneratePlan = async () => {
        if (!input.map || !input.dropZone || !input.playStyle || !input.squadSize) {
            setError("Por favor, completa todos los campos para generar un plan.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setPlan(null);
        setLastUsedInput(input);
        try {
            // const { getMapPlan } = await import("@/ai/flows/mapPlannerFlow");
            // const result = await getMapPlan(input as MapPlannerInput);
            // Datos mock temporales para el build
            const result: MapPlanner = {
                planTitle: "Estrategia Dominante",
                dropZoneJustification: "Zona estratégica seleccionada para maximizar el loot temprano",
                earlyGame: {
                    plan: "Aterriza en zonas seguras y asegura equipamiento básico"
                },
                midGame: {
                    plan: "Mantén el círculo bajo control y busca posiciones ventajosas"
                },
                lateGame: {
                    plan: "Busca equipamiento de nivel alto y prepárate para el círculo final"
                },
                recommendedLoadout: [
                    {
                        role: "IGL (In-Game Leader)",
                        primaryWeapon: {
                            name: "M416",
                            sight: "Mira 4x",
                            attachments: ["Culata táctica", "Cargador ampliado", "Compensador"]
                        },
                        secondaryWeapon: {
                            name: "Vector",
                            sight: "Punto Rojo",
                            attachments: ["Cargador ampliado", "Culata táctica"]
                        },
                        justification: "Loadout versátil para tomar decisiones rápidas y liderar el equipo en cualquier situación de combate"
                    },
                    {
                        role: "FRAGGER",
                        primaryWeapon: {
                            name: "AKM",
                            sight: "Mira 3x",
                            attachments: ["Compensador", "Cargador ampliado", "Culata táctica"]
                        },
                        secondaryWeapon: {
                            name: "UMP45",
                            sight: "Punto Rojo",
                            attachments: ["Silenciador", "Cargador ampliado"]
                        },
                        justification: "Configuración agresiva para eliminar enemigos rápidamente y abrir espacios para el equipo"
                    },
                    {
                        role: "SUPPORT",
                        primaryWeapon: {
                            name: "SCAR-L",
                            sight: "Mira 4x",
                            attachments: ["Compensador", "Cargador ampliado", "Culata táctica"]
                        },
                        secondaryWeapon: {
                            name: "Vector",
                            sight: "Punto Rojo",
                            attachments: ["Silenciador", "Cargador ampliado"]
                        },
                        justification: "Equipamiento equilibrado para flanqueo, revive y apoyo al equipo con versatilidad en combate"
                    },
                    {
                        role: "SNIPER",
                        primaryWeapon: {
                            name: "Kar98k",
                            sight: "Mira 8x",
                            attachments: ["Silenciador", "Mejillas"]
                        },
                        secondaryWeapon: {
                            name: "M416",
                            sight: "Mira 2x",
                            attachments: ["Compensador", "Cargador ampliado"]
                        },
                        justification: "Especializado en eliminaciones a larga distancia y proporcionar información del campo de batalla"
                    }
                ],
                rotationPlan: {
                    route: "Ruta optimizada hacia la zona segura",
                    considerations: ["Evitar zonas abiertas", "Mantener cobertura"],
                    advantages: ["Ruta segura", "Buen loot en el camino"],
                    disadvantages: ["Puede ser congestionada"],
                    vehicleSuggestion: {
                        vehicleType: "UAZ",
                        reason: "Resistente y confiable para terreno variado",
                        fuelCheck: "Verificar combustible antes de partir"
                    }
                }
            };
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

    const getRoleIcon = (role: string) => {
        if (role.includes('IGL')) return <Crown className="h-5 w-5 text-yellow-500" />;
        if (role.includes('FRAGGER')) return <Zap className="h-5 w-5 text-red-500" />;
        if (role.includes('SUPPORT')) return <Heart className="h-5 w-5 text-green-500" />;
        if (role.includes('SNIPER')) return <Crosshair className="h-5 w-5 text-blue-500" />;
        return <UserCheck className="h-5 w-5 text-accent" />;
    };

    const renderWeaponCard = (title: string, weapon: any) => (
        <div className="space-y-2">
            <h4 className="font-semibold">{title}: {weapon.name}</h4>
            <div className="text-xs text-muted-foreground space-y-2">
                <p><strong>Mira:</strong> {weapon.sight}</p>
                <p><strong>Accesorios:</strong> {weapon.attachments.join(', ')}</p>
            </div>
        </div>
    );


    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-1 space-y-8 lg:sticky top-20">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2"><Map className="w-8 h-8 text-primary"/> Estrategias de Mapas</h1>
                    <p className="text-muted-foreground">Crea un plan de partida completo con la ayuda de la IA.</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Configura tu Partida</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Mapa</Label>
                            <Select onValueChange={(value) => setInput(p => ({ ...p, map: value, dropZone: undefined, zonePointA: undefined, zonePointB: undefined, currentLocation: undefined }))} value={input.map}>
                                <SelectTrigger><SelectValue placeholder="Selecciona un mapa" /></SelectTrigger>
                                <SelectContent>{mapOptions.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="dropzone">Tu Zona de Aterrizaje</Label>
                            <Select 
                                onValueChange={(value) => setInput(p => ({ ...p, dropZone: value }))} 
                                value={input.dropZone}
                                disabled={!input.map}
                            >
                                <SelectTrigger id="dropzone"><SelectValue placeholder={!input.map ? "Primero selecciona un mapa" : "Selecciona una zona"} /></SelectTrigger>
                                <SelectContent>
                                    {input.map && mapDropZones[input.map]?.map(dz => (
                                        <SelectItem key={dz.value} value={dz.value}>{dz.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-2">
                            <Label>Tu Ubicación Actual (Opcional)</Label>
                            <Select 
                                onValueChange={(value) => setInput(p => ({ ...p, currentLocation: value }))} 
                                value={input.currentLocation}
                                disabled={!input.map}
                            >
                                <SelectTrigger><SelectValue placeholder={!input.map ? "Primero selecciona un mapa" : "Selecciona tu ubicación actual"} /></SelectTrigger>
                                <SelectContent>
                                    {input.map && mapDropZones[input.map]?.map(dz => (
                                        <SelectItem key={dz.value} value={dz.value}>{dz.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Posible Cierre de Zona (Opcional)</Label>
                            <div className="grid grid-cols-2 gap-2">
                                <Select onValueChange={(v) => setInput(p => ({...p, zonePointA: v}))} value={input.zonePointA} disabled={!input.map}><SelectTrigger><SelectValue placeholder="Punto A"/></SelectTrigger><SelectContent>{input.map && mapDropZones[input.map]?.map(dz => (<SelectItem key={dz.value} value={dz.value}>{dz.label}</SelectItem>))}</SelectContent></Select>
                                <Select onValueChange={(v) => setInput(p => ({...p, zonePointB: v}))} value={input.zonePointB} disabled={!input.map}><SelectTrigger><SelectValue placeholder="Punto B"/></SelectTrigger><SelectContent>{input.map && mapDropZones[input.map]?.map(dz => (<SelectItem key={dz.value} value={dz.value}>{dz.label}</SelectItem>))}</SelectContent></Select>
                            </div>
                        </div>
                         <div className="space-y-2">
                            <Label>Cantidad de zonas cerradas (Opcional)</Label>
                            <Input 
                                type="number" 
                                min="1" 
                                max="8" 
                                placeholder="Ej: 3"
                                value={input.zoneCircleNumber || ''}
                                onChange={(e) => setInput(p => ({ ...p, zoneCircleNumber: e.target.value ? parseInt(e.target.value) : undefined }))}
                            />
                        </div>
                         <div className="space-y-2">
                            <Label>Estilo de Juego</Label>
                            <Select onValueChange={(value) => setInput(p => ({ ...p, playStyle: value }))} value={input.playStyle}>
                                <SelectTrigger><SelectValue placeholder="Selecciona un estilo" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Agresivo (Hot Drops y Combate)">Agresivo (Hot Drops y Combate)</SelectItem>
                                    <SelectItem value="Estrategico (Caidas Seguras y Rotacion)">Estratégico (Caídas Seguras y Rotación)</SelectItem>
                                    <SelectItem value="Equilibrado (Adaptable a la Zona)">Equilibrado (Adaptable a la Zona)</SelectItem>
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

                {/* Sección de ubicación */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Navigation className="w-5 h-5" />
                            Sugerencias por Ubicación
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Obtén recomendaciones de mapas basadas en tu ubicación geográfica.
                        </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {!userLocation ? (
                            <Button 
                                onClick={handleRequestLocation} 
                                variant="outline" 
                                className="w-full"
                            >
                                <Navigation className="mr-2 h-4 w-4" />
                                Obtener Sugerencias por Ubicación
                            </Button>
                        ) : (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-sm text-green-600">
                                    <Navigation className="w-4 h-4" />
                                    Ubicación obtenida
                                </div>
                                {locationBasedSuggestion && (
                                    <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                                        <p className="text-sm">{locationBasedSuggestion}</p>
                                    </div>
                                )}
                            </div>
                        )}
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
                        <p className="text-muted-foreground max-w-md">
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
                                    {lastUsedInput.zoneCircleNumber && <span className="flex items-center gap-1"><CircleDot className="h-4 w-4"/> Círculo {lastUsedInput.zoneCircleNumber}</span>}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-col sm:flex-row items-center gap-6">
                                <Image src={selectedMapImage} alt={`Mapa de ${lastUsedInput.map}`} width={200} height={200} className="object-cover rounded-lg border-2" data-ai-hint={`${lastUsedInput.map} map`}/>
                                <div>
                                    <h3 className="font-bold text-lg flex items-center gap-2 mb-2"><MapPin className="h-5 w-5 text-accent"/> Zona de Aterrizaje: {lastUsedInput.dropZone}</h3>
                                    <p className="text-muted-foreground text-sm">{plan.dropZoneJustification}</p>
                                </div>
                            </CardContent>
                        </Card>
                        
                        <Card>
                             <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Lightbulb className="h-5 w-5 text-primary"/> Fases de la Partida</CardTitle>
                             </CardHeader>
                             <CardContent className="space-y-4">
                                <Card className="p-6 flex flex-col md:flex-row md:items-start gap-6 bg-muted/50 min-h-[140px]">
                                    <Image src="https://placehold.co/150x100.png" width={150} height={100} alt="Juego Temprano" className="rounded-lg object-cover flex-shrink-0" data-ai-hint="looting game" />
                                    <div className="flex-1 space-y-3">
                                        <h4 className="font-semibold flex items-center gap-2 text-lg"><Shield className="h-5 w-5 text-accent"/> Juego Temprano</h4>
                                        <p className="text-muted-foreground leading-relaxed">{plan.earlyGame.plan}</p>
                                    </div>
                                </Card>
                               <Card className="p-6 flex flex-col md:flex-row md:items-start gap-6 bg-muted/50 min-h-[140px]">
                                    <Image src="https://placehold.co/150x100.png" width={150} height={100} alt="Juego Medio" className="rounded-lg object-cover flex-shrink-0" data-ai-hint="combat game" />
                                    <div className="flex-1 space-y-3">
                                        <h4 className="font-semibold flex items-center gap-2 text-lg"><Gamepad2 className="h-5 w-5 text-accent"/> Juego Medio</h4>
                                        <p className="text-muted-foreground leading-relaxed">{plan.midGame.plan}</p>
                                    </div>
                                </Card>
                                <Card className="p-6 flex flex-col md:flex-row md:items-start gap-6 bg-muted/50 min-h-[140px]">
                                    <Image src="https://placehold.co/150x100.png" width={150} height={100} alt="Juego Tardío" className="rounded-lg object-cover flex-shrink-0" data-ai-hint="final circle" />
                                    <div className="flex-1 space-y-3">
                                        <h4 className="font-semibold flex items-center gap-2 text-lg"><Trophy className="h-5 w-5 text-accent"/> Juego Tardío</h4>
                                        <p className="text-muted-foreground leading-relaxed">{plan.lateGame.plan}</p>
                                    </div>
                                </Card>
                            </CardContent>
                        </Card>

                        <Card>
                             <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Bomb className="h-5 w-5 text-primary"/> Equipamiento Táctico por Rol</CardTitle>
                             </CardHeader>
                             <CardContent className="space-y-4">
                                {plan.recommendedLoadout.map((loadout, index) => (
                                    <Card key={index} className="bg-muted/30 border-l-4 border-l-primary/50">
                                        <CardHeader className="pb-4">
                                            <CardTitle className="text-xl flex items-center gap-3">{getRoleIcon(loadout.role)} {loadout.role}</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-6">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                {renderWeaponCard("Arma Principal", loadout.primaryWeapon)}
                                                {renderWeaponCard("Arma Secundaria", loadout.secondaryWeapon)}
                                            </div>
                                            <div className="bg-background/50 p-4 rounded-lg border">
                                                <h4 className="font-semibold mb-3 flex items-center gap-2"><Target className="h-4 w-4 text-primary"/> Justificación Táctica:</h4>
                                                <p className="text-muted-foreground leading-relaxed italic">"{loadout.justification}"</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                             </CardContent>
                        </Card>
                        
                        <Card>
                            <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Route className="h-5 w-5 text-primary"/> Plan de Rotación Detallado</CardTitle>
                             {lastUsedInput.zonePointA && lastUsedInput.zonePointB && (
                                <CardDescription>Ruta optimizada para un posible cierre entre <Badge variant="secondary">{lastUsedInput.zonePointA}</Badge> y <Badge variant="secondary">{lastUsedInput.zonePointB}</Badge>.</CardDescription>
                            )}
                            </CardHeader>
                            <CardContent className="space-y-4">
                            <div>
                                <h4 className="font-semibold mb-1">Ruta Sugerida:</h4>
                                <p className="text-sm text-muted-foreground">{plan.rotationPlan.route}</p>
                            </div>
                            <div>
                                <h4 className="font-semibold mb-1 flex items-center gap-2"><Target className="h-4 w-4"/>Consideraciones Clave:</h4>
                                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                                {plan.rotationPlan.considerations.map((item, i) => <li key={i}>{item}</li>)}
                                </ul>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <Card className="border-l-4 border-l-green-500 bg-green-50/50 dark:bg-green-950/20">
                                    <CardContent className="p-4">
                                        <h4 className="font-semibold mb-3 flex items-center gap-2 text-green-700 dark:text-green-400">
                                            <ThumbsUp className="h-5 w-5" /> Ventajas
                                        </h4>
                                        <ul className="space-y-2">
                                            {plan.rotationPlan.advantages.map((item, i) => (
                                                <li key={i} className="flex items-start gap-2 text-sm">
                                                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                                                    <span className="text-muted-foreground leading-relaxed">{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                </Card>
                                <Card className="border-l-4 border-l-red-500 bg-red-50/50 dark:bg-red-950/20">
                                    <CardContent className="p-4">
                                        <h4 className="font-semibold mb-3 flex items-center gap-2 text-red-700 dark:text-red-400">
                                            <ThumbsDown className="h-5 w-5" /> Desventajas
                                        </h4>
                                        <ul className="space-y-2">
                                            {plan.rotationPlan.disadvantages.map((item, i) => (
                                                <li key={i} className="flex items-start gap-2 text-sm">
                                                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                                                    <span className="text-muted-foreground leading-relaxed">{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                </Card>
                            </div>
                             <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
                                <CardHeader className="flex-row items-center gap-4 space-y-0 p-5">
                                     <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-full">
                                         <Car className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                                     </div>
                                     <div className="flex-1">
                                        <h4 className="font-semibold text-lg text-blue-900 dark:text-blue-100 mb-1">
                                            Sugerencia de Vehículo: {plan.rotationPlan.vehicleSuggestion.vehicleType}
                                        </h4>
                                        <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
                                            {plan.rotationPlan.vehicleSuggestion.reason}
                                        </p>
                                    </div>
                                </CardHeader>
                                <CardContent className="px-5 pb-5 pt-0">
                                     <div className="bg-blue-100/50 dark:bg-blue-900/30 rounded-lg p-3">
                                         <p className="text-sm text-blue-800 dark:text-blue-200 italic flex items-center gap-2">
                                             <Zap className="h-4 w-4" />
                                             {plan.rotationPlan.vehicleSuggestion.fuelCheck}
                                         </p>
                                     </div>
                                </CardContent>
                             </Card>
                            </CardContent>
                        </Card>

                    </div>
                )}
            </div>
            
            {/* Diálogo de permisos */}
            <CompactPermissionsDialog
                  open={showPermissionsDialog}
                  onOpenChange={setShowPermissionsDialog}
                  onComplete={handlePermissionsComplete}
                  onClose={() => setShowPermissionsDialog(false)}
             />
        </div>
    );
}
