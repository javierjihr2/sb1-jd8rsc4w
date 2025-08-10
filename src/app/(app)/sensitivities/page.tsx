
"use client"

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { FileCode, PlusCircle, Sparkles, Loader2, Terminal, ClipboardCopy, QrCode, Trash2, Edit, Save, X, Bot, Gamepad2, Crosshair, Brain, AlertTriangle } from 'lucide-react';
import { decodeSensitivity } from '@/ai/flows/decodeSensitivityFlow';
import type { DecodedSensitivity, Sensitivity, DecodeSensitivityInput } from '@/ai/schemas';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Skeleton } from '@/components/ui/skeleton';

interface SavedSensitivity extends DecodedSensitivity {
  id: string;
  userGivenName: string;
}

const emptyScope = { tpp: 0, fpp: 0, redDot: 0, scope2x: 0, scope3x: 0, scope4x: 0, scope6x: 0, scope8x: 0 };
const emptySettings: Sensitivity = {
    camera: { ...emptyScope },
    ads: { ...emptyScope },
    gyroscope: { ...emptyScope },
    code: ''
};

const AnalysisResult = ({ analysisData, onSave, onCancel }: { analysisData: DecodedSensitivity, onSave: (data: SavedSensitivity) => void, onCancel: () => void }) => {
    const [editableData, setEditableData] = useState<DecodedSensitivity>(analysisData);
    const [name, setName] = useState(analysisData.analysis.suggestedName || "Mi Sensibilidad");

    const handleValueChange = (category: 'camera' | 'ads' | 'gyroscope', scope: string, value: string) => {
        const numValue = parseInt(value) || 0;
        setEditableData(prev => ({
            ...prev,
            settings: {
                ...prev.settings,
                [category]: {
                    // @ts-ignore
                    ...prev.settings[category],
                    [scope]: numValue
                }
            }
        }));
    };
    
    const renderScopeInputs = (title: string, category: 'camera' | 'ads' | 'gyroscope') => (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-primary">{title}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.keys(emptyScope).map(scope => (
                    <div key={`${category}-${scope}`} className="space-y-1">
                        <Label htmlFor={`${category}-${scope}`} className="text-xs capitalize">{scope.replace('scope', 'x')}</Label>
                        <Input 
                            id={`${category}-${scope}`} 
                            type="number" 
                            className="h-8"
                            // @ts-ignore
                            value={editableData.settings[category]?.[scope] || ''}
                            onChange={(e) => handleValueChange(category, scope, e.target.value)}
                        />
                    </div>
                ))}
            </div>
        </div>
    );

    const handleSaveClick = () => {
       const finalData: SavedSensitivity = {
           ...editableData,
           id: `sens-${Date.now()}`,
           userGivenName: name,
       }
       onSave(finalData);
    };

    return (
        <Card className="animate-in fade-in-50 mt-6">
            <CardHeader>
                <CardTitle>Análisis y Edición</CardTitle>
                <CardDescription>Revisa el análisis de la IA y ajusta los valores si es necesario antes de guardar.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Aviso Importante</AlertTitle>
                    <AlertDescription>
                        La IA interpreta el código para generar una configuración. Es posible que los valores no sean exactos. Por favor, verifica y edita los números si es necesario antes de guardar.
                    </AlertDescription>
                </Alert>

                <div className="space-y-2">
                    <Label htmlFor="sensitivity-name">Nombre de la Configuración</Label>
                    <Input id="sensitivity-name" value={name} onChange={(e) => setName(e.target.value)} />
                </div>

                {renderScopeInputs('Sensibilidad de Cámara', 'camera')}
                {renderScopeInputs('Sensibilidad de ADS', 'ads')}
                {editableData.settings.gyroscope && renderScopeInputs('Sensibilidad de Giroscopio', 'gyroscope')}
                
                 <Collapsible>
                    <CollapsibleTrigger className="text-lg font-semibold text-primary w-full text-left flex items-center gap-2"><Bot className="h-5 w-5"/>Ver Análisis Táctico de IA</CollapsibleTrigger>
                    <CollapsibleContent className="pt-4 space-y-4">
                         <div>
                            <h4 className="font-semibold flex items-center gap-2 mb-2"><Gamepad2 className="h-4 w-4"/>Estilo de Juego Sugerido</h4>
                            <p className="text-sm text-muted-foreground">{editableData.analysis.playStyle}</p>
                        </div>
                        <div>
                            <h4 className="font-semibold flex items-center gap-2 mb-2"><Brain className="h-4 w-4"/>Análisis Táctico</h4>
                            <p className="text-sm text-muted-foreground">{editableData.analysis.tacticalAnalysis}</p>
                        </div>
                        <div>
                            <h4 className="font-semibold flex items-center gap-2 mb-2"><Crosshair className="h-4 w-4"/>Armas Recomendadas</h4>
                            <ul className="list-disc list-inside text-sm text-muted-foreground">
                                {editableData.analysis.recommendedWeapons.map(w => <li key={w}>{w}</li>)}
                            </ul>
                        </div>
                    </CollapsibleContent>
                 </Collapsible>

            </CardContent>
            <CardFooter className="gap-2">
                <Button onClick={handleSaveClick}><Save className="mr-2"/> Guardar en mi Arsenal</Button>
                <Button variant="outline" onClick={onCancel}><X className="mr-2"/> Cancelar</Button>
            </CardFooter>
        </Card>
    );
};


export default function SensitivitiesPage() {
    const { toast } = useToast();
    const [savedSensitivities, setSavedSensitivities] = useState<SavedSensitivity[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sensitivityCode, setSensitivityCode] = useState('');
    const [analysisResult, setAnalysisResult] = useState<DecodedSensitivity | null>(null);

    const handleAnalyze = async () => {
        if (!sensitivityCode.trim()) {
            setError("Por favor, introduce un código de sensibilidad.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setAnalysisResult(null);

        try {
            // Simulate providing a full structure even if some parts are empty
            const placeholderSettings: DecodeSensitivityInput = {
                settings: {
                    ...emptySettings,
                    code: sensitivityCode
                }
            };
            const result = await decodeSensitivity(placeholderSettings);
            setAnalysisResult(result);
        } catch (e) {
            console.error(e);
            setError('Error al analizar con la IA. El código podría ser inválido o el servicio no está disponible.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSaveAnalysis = (data: SavedSensitivity) => {
        setSavedSensitivities(prev => [data, ...prev]);
        setAnalysisResult(null);
        setSensitivityCode('');
        toast({
            title: 'Sensibilidad Guardada',
            description: `"${data.userGivenName}" ha sido añadido a tu arsenal.`,
        });
    };

    const handleCopyCode = (code: string) => {
        if (!code) {
            toast({ variant: 'destructive', title: 'Sin Código', description: 'No hay un código guardado para esta configuración.' });
            return;
        }
        navigator.clipboard.writeText(code);
        toast({ title: 'Copiado', description: 'Código de sensibilidad copiado.' });
    };

    const handleDelete = (id: string) => {
        setSavedSensitivities(prev => prev.filter(s => s.id !== id));
        toast({ variant: 'destructive', title: 'Sensibilidad Eliminada', description: 'La configuración ha sido eliminada de tu arsenal.' });
    };


    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-2"><FileCode className="w-8 h-8 text-primary"/> Arsenal de Sensibilidad</h1>
                <p className="text-muted-foreground">Analiza códigos de sensibilidad, edita los valores y guarda tus configuraciones perfectas.</p>
            </div>
            
            {!analysisResult && (
                <Card>
                    <CardHeader>
                        <CardTitle>Decodificar y Analizar Sensibilidad</CardTitle>
                        <CardDescription>Pega un código de sensibilidad de PUBG Mobile. La IA generará una configuración y un análisis táctico que podrás editar.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <div className="space-y-2">
                            <Label htmlFor="code-input">Código de Sensibilidad</Label>
                            <Input id="code-input" placeholder="Pega tu código aquí (ej: 7293-4161-...)" value={sensitivityCode} onChange={(e) => setSensitivityCode(e.target.value)} />
                        </div>
                         <Button onClick={handleAnalyze} disabled={isLoading}>
                            {isLoading ? <Loader2 className="mr-2 animate-spin" /> : <Sparkles className="mr-2" />}
                            {isLoading ? 'Analizando...' : 'Analizar Código'}
                        </Button>
                        {error && <Alert variant="destructive" className="mt-4"><Terminal className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}
                    </CardContent>
                </Card>
            )}

            {isLoading && (
                 <Card className="mt-6">
                    <CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-24 w-full" />
                    </CardContent>
                </Card>
            )}

            {analysisResult && !isLoading && (
                <AnalysisResult 
                    analysisData={analysisResult} 
                    onSave={handleSaveAnalysis}
                    onCancel={() => setAnalysisResult(null)}
                />
            )}
            
            {savedSensitivities.length > 0 && (
                 <div className="space-y-4 pt-8">
                    <h2 className="text-2xl font-bold">Mi Arsenal</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        {savedSensitivities.map(s => (
                            <Card key={s.id} className="flex flex-col">
                                <CardHeader>
                                    <CardTitle className="flex justify-between items-center">
                                        <span className="text-primary">{s.userGivenName}</span>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                                    </CardTitle>
                                    <CardDescription className="flex items-center gap-2 text-xs"><Gamepad2 className="h-3 w-3"/>{s.analysis.playStyle}</CardDescription>
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
                                    <div className="flex gap-2 justify-center">
                                       <QrCode className="w-24 h-24 text-muted-foreground"/>
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
             {savedSensitivities.length === 0 && !analysisResult && (
                 <Card className="h-full flex flex-col items-center justify-center text-center p-8 border-dashed min-h-[300px]">
                    <div className="p-4 bg-primary/10 rounded-full mb-4">
                        <FileCode className="h-12 w-12 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold">Tu Arsenal está Vacío</h2>
                    <p className="text-muted-foreground max-w-md">
                       Pega un código de sensibilidad para analizarlo, editarlo y guardarlo en tu colección personal.
                    </p>
                </Card>
            )}
        </div>
    );
}

    