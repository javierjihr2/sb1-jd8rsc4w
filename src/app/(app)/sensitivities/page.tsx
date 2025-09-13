
"use client"

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { FileCode, Sparkles, Loader2, Terminal, ClipboardCopy, QrCode, Trash2, X, Bot, Gamepad2, Crosshair, Brain, Globe, Lock } from 'lucide-react';
// Dynamic import will be used to prevent client-side errors
import type { DecodedSensitivity, Sensitivity, DecodeSensitivityInput } from '@/ai/schemas';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from '@/components/ui/switch';


interface SavedSensitivity {
  id: string;
  userGivenName: string;
  isPublic: boolean;
  settings: Sensitivity;
  analysis: {
    suggestedName: string;
    playStyle: string;
    tacticalAnalysis: string;
    recommendedWeapons: string[];
  };
  code: string;
}

const emptyScope = { tpp: 0, fpp: 0, redDot: 0, scope2x: 0, scope3x: 0, scope4x: 0, scope6x: 0, scope8x: 0 };
const initialSettings: Sensitivity = {
    camera: { ...emptyScope },
    ads: { ...emptyScope },
    gyroscope: { ...emptyScope },
    code: ''
};

const scopeLabels: { [key: string]: string } = {
    tpp: "3ra Persona (TPP)",
    fpp: "1ra Persona (FPP)",
    redDot: "Punto Rojo, Holo",
    scope2x: "Mira 2x",
    scope3x: "Mira 3x",
    scope4x: "Mira 4x",
    scope6x: "Mira 6x",
    scope8x: "Mira 8x",
};

// Funciones auxiliares para análisis mejorado
const determinePlayStyle = (settings: Sensitivity): string => {
    const avgCamera = Object.values(settings.camera).reduce((a, b) => a + b, 0) / Object.values(settings.camera).length;
    const avgAds = Object.values(settings.ads).reduce((a, b) => a + b, 0) / Object.values(settings.ads).length;
    
    if (avgCamera > 80 && avgAds > 60) return "Agresivo/Rusheo";
    if (avgCamera < 40 && avgAds < 30) return "Defensivo/Sniper";
    if (avgCamera > 60 && avgAds < 40) return "Híbrido";
    return "Balanceado";
};

const generateDetailedAnalysis = (settings: Sensitivity): string => {
    const avgCamera = Object.values(settings.camera).reduce((a, b) => a + b, 0) / Object.values(settings.camera).length;
    const avgAds = Object.values(settings.ads).reduce((a, b) => a + b, 0) / Object.values(settings.ads).length;
    
    let analysis = "Esta configuración ";
    
    if (avgCamera > 70) {
        analysis += "favorece movimientos rápidos de cámara, ideal para combates CQC y rotaciones dinámicas. ";
    } else if (avgCamera < 40) {
        analysis += "prioriza la precisión con movimientos de cámara controlados, perfecta para combates a larga distancia. ";
    } else {
        analysis += "mantiene un equilibrio entre velocidad y precisión en los movimientos de cámara. ";
    }
    
    if (avgAds > 50) {
        analysis += "Las sensibilidades ADS permiten seguimiento rápido de objetivos en movimiento.";
    } else {
        analysis += "Las sensibilidades ADS están optimizadas para máxima precisión en tiros de larga distancia.";
    }
    
    return analysis;
};

const getRecommendedWeapons = (settings: Sensitivity): string[] => {
    const avgCamera = Object.values(settings.camera).reduce((a, b) => a + b, 0) / Object.values(settings.camera).length;
    const avgAds = Object.values(settings.ads).reduce((a, b) => a + b, 0) / Object.values(settings.ads).length;
    
    if (avgCamera > 70 && avgAds > 50) {
        return ["AKM", "Beryl M762", "UMP45", "Vector"];
    } else if (avgCamera < 40 && avgAds < 30) {
        return ["Kar98k", "M24", "AWM", "Mini14"];
    } else {
        return ["M416", "SCAR-L", "M16A4", "QBZ"];
    }
};

const EditableScopeTable = ({ title, category, data, onValueChange }: { title: string, category: 'camera' | 'ads' | 'gyroscope', data: any, onValueChange: (category: 'camera' | 'ads' | 'gyroscope', scope: string, value: string) => void }) => (
    <div>
        <h3 className="text-lg font-semibold text-primary mb-2">{title}</h3>
        <div className="border rounded-lg">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Mira</TableHead>
                        <TableHead className="text-right w-[120px]">Sensibilidad</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {Object.keys(scopeLabels).map((scope) => (
                         <TableRow key={`${category}-${scope}`}>
                            <TableCell>{scopeLabels[scope] || scope}</TableCell>
                            <TableCell className="text-right">
                                 <Input 
                                    id={`${category}-${scope}`} 
                                    type="number" 
                                    className="h-8 text-right"
                                    value={data?.[scope] || ''}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => onValueChange(category, scope, e.target.value)}
                                    placeholder="0"
                                />
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    </div>
);


export default function SensitivitiesPage() {
    const { toast } = useToast();
    const [savedSensitivities, setSavedSensitivities] = useState<SavedSensitivity[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentSettings, setCurrentSettings] = useState<Sensitivity>(initialSettings);
    const [hasGyro, setHasGyro] = useState(false);
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [configName, setConfigName] = useState("");
    const [isPublic, setIsPublic] = useState(false);


    const handleValueChange = (category: 'camera' | 'ads' | 'gyroscope', scope: string, value: string) => {
        const numValue = parseInt(value, 10);
        setCurrentSettings((prev: Sensitivity) => {
            const categoryData = hasGyro && category === 'gyroscope' ? (prev.gyroscope || emptyScope) : prev[category];
            const newCategoryState = { ...categoryData, [scope]: isNaN(numValue) ? 0 : numValue };
            
            if (category === 'gyroscope' && !hasGyro) return prev;

            return {
                ...prev,
                [category]: newCategoryState,
            };
        });
    };
    
    const handleCodeChange = (value: string) => {
        setCurrentSettings((prev: Sensitivity) => ({ ...prev, code: value }));
    };

    const handleAnalyzeAndSave = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const settingsToAnalyze: Sensitivity = {
                ...currentSettings,
                gyroscope: hasGyro ? currentSettings.gyroscope : undefined,
            };

            const input: DecodeSensitivityInput = { settings: settingsToAnalyze };
            // const { decodeSensitivity } = await import('@/ai/flows/decodeSensitivityFlow');
            // const result = await decodeSensitivity(input);
            // Datos mock temporales para el build con análisis mejorado
            const result = {
                settings: settingsToAnalyze,
                analysis: {
                    suggestedName: configName || "Configuración Personalizada",
                    playStyle: determinePlayStyle(settingsToAnalyze),
                    tacticalAnalysis: generateDetailedAnalysis(settingsToAnalyze),
                    recommendedWeapons: getRecommendedWeapons(settingsToAnalyze),
                    deviceOptimization: "Optimizada para dispositivos de gama media-alta",
                    strengthsWeaknesses: {
                        strengths: ["Excelente control de retroceso", "Precisión en combates a media distancia"],
                        weaknesses: ["Puede requerir ajustes para combates CQC"]
                    }
                },
                code: settingsToAnalyze.code || '',
                isPublic: false
            };
            const savedData: SavedSensitivity = {
                ...result,
                id: `sens-${Date.now()}`,
                userGivenName: configName || `Mi Configuración #${savedSensitivities.length + 1}`,
                isPublic: isPublic,
            };
            setSavedSensitivities((prev: SavedSensitivity[]) => [savedData, ...prev]);
            toast({ title: 'Análisis Completo', description: `"${savedData.userGivenName}" ha sido guardada en tu arsenal.` });
            resetForm();
        } catch (e: unknown) {
            console.error(e);
            setError('Error al analizar con la IA. El servicio no está disponible.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const resetForm = () => {
        setIsFormVisible(false);
        setCurrentSettings(initialSettings);
        setHasGyro(false);
        setConfigName("");
        setError(null);
        setIsPublic(false);
    }

    const handleCopyCode = (code: string) => {
        if (!code) {
            toast({ variant: 'destructive', title: 'Sin Código', description: 'No hay un código guardado para esta configuración.' });
            return;
        }
        navigator.clipboard.writeText(code);
        toast({ title: 'Copiado', description: 'Código de sensibilidad copiado.' });
    };

    const handleDelete = (id: string) => {
        setSavedSensitivities((prev: SavedSensitivity[]) => prev.filter(s => s.id !== id));
        toast({ variant: 'destructive', title: 'Sensibilidad Eliminada', description: 'La configuración ha sido eliminada de tu arsenal.' });
    };

    const addToArsenal = (sensitivity: SavedSensitivity) => {
        setCurrentSettings({
            camera: sensitivity.settings.camera,
            ads: sensitivity.settings.ads,
            gyroscope: sensitivity.settings.gyroscope || emptyScope,
            code: sensitivity.code
        });
        setHasGyro(!!sensitivity.settings.gyroscope);
        setConfigName(`Copia de ${sensitivity.userGivenName}`);
        setIsFormVisible(true);
        toast({ 
            title: 'Configuración Cargada', 
            description: `Los valores de "${sensitivity.userGivenName}" han sido cargados para editar.` 
        });
    };


    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-2"><FileCode className="w-8 h-8 text-primary"/> Mis Sensibilidades</h1>
                <p className="text-muted-foreground">Añade tus configuraciones, analízalas con IA, guárdalas y compártelas con la comunidad.</p>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>{isFormVisible ? "Añadir Nueva Sensibilidad" : "Gestiona tus Configuraciones"}</CardTitle>
                    <CardDescription>{isFormVisible ? "Introduce tus valores de sensibilidad y la IA los analizará para ti." : "Visualiza tus configuraciones guardadas o añade una nueva."}</CardDescription>
                </CardHeader>
                {!isFormVisible && (
                    <CardContent>
                        <Button onClick={() => setIsFormVisible(true)}>
                            <Sparkles className="mr-2 h-4 w-4" />
                            Añadir Nueva Sensibilidad al Arsenal
                        </Button>
                    </CardContent>
                )}
                {isFormVisible && (
                     <CardContent className="space-y-6 animate-in fade-in-50">
                        <div className="space-y-2">
                            <Label htmlFor="config-name">Nombre para esta Configuración</Label>
                            <Input id="config-name" placeholder='Ej: "Mi config para rushear"' value={configName} onChange={e => setConfigName(e.target.value)} />
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <EditableScopeTable title="Sensibilidad de Cámara" category="camera" data={currentSettings.camera} onValueChange={handleValueChange} />
                            <EditableScopeTable title="Sensibilidad de ADS" category="ads" data={currentSettings.ads} onValueChange={handleValueChange} />
                            
                            <div className="space-y-4">
                                <div className="flex items-center space-x-2">
                                    <Switch id="gyro-switch" checked={hasGyro} onCheckedChange={setHasGyro} />
                                    <Label htmlFor="gyro-switch">Añadir Sensibilidad de Giroscopio</Label>
                                </div>
                                {hasGyro && (
                                     <div className="animate-in fade-in-50">
                                        <EditableScopeTable title="Giroscopio" category="gyroscope" data={currentSettings.gyroscope} onValueChange={handleValueChange} />
                                     </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="config-code">Tu Código de Importación (Opcional)</Label>
                            <Input id="config-code" placeholder="Pega tu código aquí (ej: 7293-4161-...)" value={currentSettings.code} onChange={e => handleCodeChange(e.target.value)} />
                             <p className="text-xs text-muted-foreground mt-2">Este es el código que compartirías o usarías en el juego. Debe corresponder a los valores que has introducido manualmente.</p>
                        </div>
                         <div className="flex items-center space-x-2">
                            <Switch id="public-switch" checked={isPublic} onCheckedChange={setIsPublic} />
                            <Label htmlFor="public-switch">Hacer esta configuración pública para otros jugadores</Label>
                        </div>
                        {error && <Alert variant="destructive"><Terminal className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}
                        <div className="flex gap-2">
                            <Button onClick={handleAnalyzeAndSave} disabled={isLoading}>
                                {isLoading ? <Loader2 className="mr-2 animate-spin" /> : <Bot className="mr-2" />}
                                {isLoading ? 'Analizando...' : 'Analizar y Guardar'}
                            </Button>
                             <Button variant="outline" onClick={resetForm}>
                                <X className="mr-2" />
                                Cancelar
                            </Button>
                        </div>
                    </CardContent>
                )}
            </Card>

            {savedSensitivities.length > 0 && (
                 <div className="space-y-4 pt-8">
                    <h2 className="text-2xl font-bold">Mi Arsenal de Sensibilidad</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        {savedSensitivities.map(s => (
                            <Card key={s.id} className="flex flex-col">
                                <CardHeader>
                                    <CardTitle className="flex justify-between items-start">
                                        <span className="text-primary">{s.userGivenName}</span>
                                        <div className="flex items-center gap-2">
                                            {s.isPublic ? 
                                                <div className="flex items-center gap-1 text-xs text-muted-foreground"><Globe className="h-3 w-3"/> Pública</div> :
                                                <div className="flex items-center gap-1 text-xs text-muted-foreground"><Lock className="h-3 w-3"/> Privada</div>
                                            }
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                                        </div>
                                    </CardTitle>
                                    <CardDescription className="flex items-center gap-2 text-xs pt-1"><Gamepad2 className="h-3 w-3"/>{s.analysis.playStyle}</CardDescription>
                                </CardHeader>
                                <CardContent className="flex-1 space-y-4">
                                     <Collapsible>
                                        <CollapsibleTrigger asChild>
                                             <div className="p-4 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted">
                                                <h4 className="font-semibold text-sm flex items-center gap-2 mb-2"><Bot className="h-4 w-4"/>Análisis de IA</h4>
                                                <p className="text-xs text-muted-foreground line-clamp-2">{s.analysis.tacticalAnalysis}</p>
                                             </div>
                                        </CollapsibleTrigger>
                                        <CollapsibleContent className="p-4 bg-muted/50 rounded-lg mt-2">
                                             <div className="space-y-4">
                                                <div>
                                                    <h4 className="font-semibold text-sm flex items-center gap-2 mb-2"><Brain className="h-4 w-4"/>Análisis Táctico Completo</h4>
                                                    <p className="text-xs text-muted-foreground">{s.analysis.tacticalAnalysis}</p>
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-sm flex items-center gap-2 mb-2"><Crosshair className="h-4 w-4"/>Armas Recomendadas</h4>
                                                    <ul className="list-disc list-inside text-xs text-muted-foreground">
                                                        {s.analysis.recommendedWeapons.map(w => <li key={w}>{w}</li>)}
                                                    </ul>
                                                </div>
                                             </div>
                                        </CollapsibleContent>
                                     </Collapsible>
                                    <div className="space-y-2">
                                        <h4 className="font-semibold text-sm text-center">HUD Recomendado</h4>
                                        <div className="relative bg-gradient-to-br from-blue-900 to-purple-900 rounded-lg p-4 aspect-video">
                                            {/* Simulación de HUD de PUBG Mobile */}
                                            <div className="absolute top-2 left-2 flex gap-1">
                                                <div className="w-8 h-8 bg-green-500/80 rounded border border-white/30 flex items-center justify-center text-xs text-white font-bold">M4</div>
                                                <div className="w-6 h-6 bg-yellow-500/80 rounded-full border border-white/30"></div>
                                            </div>
                                            <div className="absolute top-2 right-2 text-white text-xs">
                                                <div className="bg-black/50 px-2 py-1 rounded">100 HP</div>
                                            </div>
                                            <div className="absolute bottom-2 right-2 flex flex-col gap-1">
                                                <div className="w-12 h-12 bg-white/20 rounded-full border-2 border-white/50 flex items-center justify-center">
                                                    <div className="w-6 h-6 bg-white rounded-full"></div>
                                                </div>
                                                <div className="w-8 h-8 bg-orange-500/80 rounded border border-white/30"></div>
                                            </div>
                                            <div className="absolute bottom-2 left-2 flex gap-2">
                                                <div className="w-10 h-10 bg-blue-500/80 rounded border border-white/30"></div>
                                                <div className="w-10 h-10 bg-red-500/80 rounded border border-white/30"></div>
                                            </div>
                                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                                <Crosshair className="w-6 h-6 text-white/80" />
                                            </div>
                                        </div>
                                        <p className="text-xs text-muted-foreground text-center">Layout optimizado para tu estilo de juego</p>
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button variant="outline" className="w-full" onClick={() => handleCopyCode(s.code)}>
                                        <ClipboardCopy className="mr-2"/>
                                        Copiar Código: {s.code ? `${s.code.substring(0, 9)}...` : 'N/A'}
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </div>
            )}
             {savedSensitivities.length === 0 && !isFormVisible && (
                 <Card className="h-full flex flex-col items-center justify-center text-center p-8 border-dashed min-h-[300px]">
                    <div className="p-4 bg-primary/10 rounded-full mb-4">
                        <FileCode className="h-12 w-12 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold">Tu Arsenal está Vacío</h2>
                    <p className="text-muted-foreground max-w-md">
                       Haz clic en el botón de arriba para añadir tu primera configuración de sensibilidad y obtener un análisis detallado por IA.
                    </p>
                </Card>
            )}
        </div>
    );
}
