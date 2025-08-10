
"use client"

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { FileCode, PlusCircle, Sparkles, Loader2, Terminal, ClipboardCopy, QrCode, Trash2, Edit, Save, X, Bot, Gamepad2, Crosshair, Brain } from 'lucide-react';
import { decodeSensitivity } from '@/ai/flows/decodeSensitivityFlow';
import type { DecodedSensitivity, Sensitivity, SensitivityInput, DecodeSensitivityInput } from '@/ai/schemas';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Switch } from '@/components/ui/switch';


interface SavedSensitivity extends DecodedSensitivity {
  id: string;
  userGivenName: string;
  isEditing?: boolean;
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

const emptyScope = { tpp: 0, fpp: 0, redDot: 0, scope2x: 0, scope3x: 0, scope4x: 0, scope6x: 0, scope8x: 0 };
const emptySettings: Sensitivity = {
    camera: { ...emptyScope },
    ads: { ...emptyScope },
    gyroscope: { ...emptyScope },
    code: ''
};

const NewSensitivityForm = ({ onSave, onCancel }: { onSave: (data: DecodedSensitivity) => void, onCancel: () => void }) => {
    const [settings, setSettings] = useState<Sensitivity>(emptySettings);
    const [useGyro, setUseGyro] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleValueChange = (category: 'camera' | 'ads' | 'gyroscope', scope: string, value: string) => {
        const numValue = parseInt(value) || 0;
        setSettings(prev => ({
            ...prev,
            [category]: {
                ...prev[category],
                [scope]: numValue
            }
        }));
    };

    const handleAnalyze = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await decodeSensitivity({
                settings: {
                    ...settings,
                    gyroscope: useGyro ? settings.gyroscope : undefined,
                }
            });
            onSave(result);
        } catch (e) {
            console.error(e);
            setError('Error al analizar con la IA. Por favor, inténtalo de nuevo.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const renderScopeInputs = (category: 'camera' | 'ads' | 'gyroscope') => (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.keys(emptyScope).map(scope => (
                <div key={`${category}-${scope}`} className="space-y-1">
                    <Label htmlFor={`${category}-${scope}`} className="text-xs capitalize">{scope.replace('scope', 'x')}</Label>
                    <Input 
                        id={`${category}-${scope}`} 
                        type="number" 
                        className="h-8"
                        // @ts-ignore
                        value={settings[category][scope] || ''}
                        onChange={(e) => handleValueChange(category, scope, e.target.value)}
                    />
                </div>
            ))}
        </div>
    );

    return (
        <Card className="animate-in fade-in-50">
            <CardHeader>
                <CardTitle>Añadir Nueva Sensibilidad</CardTitle>
                <CardDescription>Introduce tus valores de sensibilidad manualmente. La IA puede analizarlos para darte consejos.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="code-input">Código de Sensibilidad (Opcional)</Label>
                    <Input id="code-input" placeholder="Pega tu código aquí para guardarlo" value={settings.code} onChange={(e) => setSettings(p => ({ ...p, code: e.target.value }))}/>
                </div>
                <Collapsible defaultOpen>
                    <CollapsibleTrigger className="text-lg font-semibold text-primary w-full text-left">Sensibilidad de Cámara</CollapsibleTrigger>
                    <CollapsibleContent className="pt-4">{renderScopeInputs('camera')}</CollapsibleContent>
                </Collapsible>
                 <Collapsible defaultOpen>
                    <CollapsibleTrigger className="text-lg font-semibold text-primary w-full text-left">Sensibilidad de ADS</CollapsibleTrigger>
                    <CollapsibleContent className="pt-4">{renderScopeInputs('ads')}</CollapsibleContent>
                </Collapsible>
                 <Collapsible>
                    <div className="flex items-center justify-between">
                         <CollapsibleTrigger className="text-lg font-semibold text-primary">Sensibilidad de Giroscopio</CollapsibleTrigger>
                         <div className="flex items-center space-x-2">
                            <Switch id="use-gyro" checked={useGyro} onCheckedChange={setUseGyro}/>
                            <Label htmlFor="use-gyro">{useGyro ? 'Activado' : 'Desactivado'}</Label>
                         </div>
                    </div>
                    {useGyro && <CollapsibleContent className="pt-4">{renderScopeInputs('gyroscope')}</CollapsibleContent>}
                </Collapsible>

                {error && <Alert variant="destructive"><Terminal className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}

            </CardContent>
            <CardFooter className="gap-2">
                <Button onClick={handleAnalyze} disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 animate-spin" /> : <Sparkles className="mr-2" />}
                    {isLoading ? 'Analizando...' : 'Analizar y Guardar'}
                </Button>
                <Button variant="outline" onClick={onCancel}>Cancelar</Button>
            </CardFooter>
        </Card>
    );
};


export default function SensitivitiesPage() {
    const { toast } = useToast();
    const [savedSensitivities, setSavedSensitivities] = useState<SavedSensitivity[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    
    const handleSaveNewSensitivity = (decodedData: DecodedSensitivity) => {
        const newSaved: SavedSensitivity = {
            ...decodedData,
            id: `sens-${Date.now()}`,
            userGivenName: decodedData.analysis.suggestedName || "Mi Nueva Sensibilidad",
        };
        setSavedSensitivities(prev => [newSaved, ...prev]);
        setIsAdding(false);
        toast({
            title: 'Sensibilidad Guardada',
            description: `"${newSaved.userGivenName}" ha sido añadido a tu arsenal.`,
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

    const toggleEdit = (id: string) => {
        setSavedSensitivities(prev => prev.map(s => s.id === id ? { ...s, isEditing: !s.isEditing } : s));
    };

    const handleNameChange = (id: string, newName: string) => {
        setSavedSensitivities(prev => prev.map(s => s.id === id ? { ...s, userGivenName: newName } : s));
    };


    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-2"><FileCode className="w-8 h-8 text-primary"/> Arsenal de Sensibilidad</h1>
                <p className="text-muted-foreground">Añade, gestiona y analiza tus configuraciones de sensibilidad. La IA te ayudará a entender sus fortalezas.</p>
            </div>

            {!isAdding && (
                 <Button onClick={() => setIsAdding(true)}>
                    <PlusCircle className="mr-2" />
                    Añadir Nueva Sensibilidad
                </Button>
            )}

            {isAdding && <NewSensitivityForm onSave={handleSaveNewSensitivity} onCancel={() => setIsAdding(false)}/>}
            
            {savedSensitivities.length > 0 && (
                 <div className="space-y-4 pt-8">
                    <h2 className="text-2xl font-bold">Mi Arsenal</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        {savedSensitivities.map(s => (
                            <Card key={s.id} className="flex flex-col">
                                <CardHeader>
                                    {s.isEditing ? (
                                        <div className="flex gap-2">
                                            <Input value={s.userGivenName} onChange={(e) => handleNameChange(s.id, e.target.value)} />
                                            <Button size="icon" onClick={() => toggleEdit(s.id)}><Save className="h-4 w-4"/></Button>
                                        </div>
                                    ) : (
                                        <CardTitle className="flex justify-between items-center">
                                            <span className="text-primary">{s.userGivenName}</span>
                                             <div className="flex items-center gap-1">
                                                <Button variant="ghost" size="icon" onClick={() => toggleEdit(s.id)}><Edit className="h-4 w-4"/></Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                                             </div>
                                        </CardTitle>
                                    )}
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
             {savedSensitivities.length === 0 && !isAdding && (
                 <Card className="h-full flex flex-col items-center justify-center text-center p-8 border-dashed min-h-[300px]">
                    <div className="p-4 bg-primary/10 rounded-full mb-4">
                        <FileCode className="h-12 w-12 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold">Tu Arsenal está Vacío</h2>
                    <p className="text-muted-foreground max-w-md">
                       Haz clic en "Añadir Nueva Sensibilidad" para empezar a construir tu colección personal de configuraciones.
                    </p>
                </Card>
            )}
        </div>
    );
}
