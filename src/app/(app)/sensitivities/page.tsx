
"use client"

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { FileCode, PlusCircle, Sparkles, Loader2, Terminal, ClipboardCopy, QrCode, Trash2, Edit, Save, X, Bot, Gamepad2, Crosshair, Brain } from 'lucide-react';
import { decodeSensitivity } from '@/ai/flows/decodeSensitivityFlow';
import type { DecodedSensitivity } from '@/ai/schemas';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

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

const ResultSkeleton = () => (
    <Card className="mt-6">
        <CardHeader>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="space-y-4">
                        <Skeleton className="h-8 w-1/2" />
                        <div className="border rounded-lg p-2 space-y-1">
                            {[...Array(8)].map((_, j) => <Skeleton key={j} className="h-8 w-full" />)}
                        </div>
                    </div>
                ))}
            </div>
             <div className="space-y-2">
                <Skeleton className="h-6 w-1/4" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-5/6" />
            </div>
        </CardContent>
    </Card>
);

export default function SensitivitiesPage() {
    const { toast } = useToast();
    const [sensitivityCode, setSensitivityCode] = useState('');
    const [decoded, setDecoded] = useState<DecodedSensitivity | null>(null);
    const [savedSensitivities, setSavedSensitivities] = useState<SavedSensitivity[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleDecode = async () => {
        if (!sensitivityCode.trim()) {
            setError('Por favor, introduce un código de sensibilidad.');
            return;
        }
        setError(null);
        setDecoded(null);
        setIsLoading(true);
        try {
            const result = await decodeSensitivity({ code: sensitivityCode });
            setDecoded(result);
        } catch (e) {
            console.error(e);
            setError('Error al decodificar el código. Asegúrate de que es válido e inténtalo de nuevo.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSave = () => {
        if (!decoded) return;
        const newSaved: SavedSensitivity = {
            ...decoded,
            id: `sens-${Date.now()}`,
            userGivenName: decoded.analysis.suggestedName,
        };
        setSavedSensitivities(prev => [newSaved, ...prev]);
        setDecoded(null);
        setSensitivityCode('');
        toast({
            title: 'Sensibilidad Guardada',
            description: `"${newSaved.userGivenName}" ha sido añadido a tu arsenal.`,
        });
    };
    
    const handleCopyCode = (code: string) => {
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
                <p className="text-muted-foreground">Pega tu código de sensibilidad para decodificarlo, analizarlo con IA y guardarlo en tu arsenal personal.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Decodificador de Sensibilidad</CardTitle>
                    <CardDescription>Introduce un código de sensibilidad de PUBG Mobile para empezar.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <Input 
                            placeholder="Ej: 7293-4161-3334-9493-294" 
                            value={sensitivityCode}
                            onChange={(e) => setSensitivityCode(e.target.value)}
                            disabled={isLoading}
                        />
                        <Button onClick={handleDecode} disabled={isLoading || !sensitivityCode.trim()} className="w-full sm:w-auto">
                            {isLoading ? <Loader2 className="mr-2 animate-spin" /> : <Sparkles className="mr-2" />}
                            {isLoading ? 'Analizando...' : 'Analizar Código'}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {error && !isLoading && <Alert variant="destructive"><Terminal className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
            {isLoading && <ResultSkeleton />}
            
            {decoded && !isLoading && (
                <Card className="animate-in fade-in-50">
                    <CardHeader>
                        <CardTitle>Análisis de IA: <span className="text-primary">{decoded.analysis.suggestedName}</span></CardTitle>
                        <CardDescription>Este es el análisis de tu código de sensibilidad. Puedes guardarlo en tu arsenal.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <SensitivityTable title="Sensibilidad de Cámara" data={decoded.settings.camera} />
                            <SensitivityTable title="Sensibilidad de ADS" data={decoded.settings.ads} />
                            {decoded.settings.gyroscope && <SensitivityTable title="Sensibilidad de Giroscopio" data={decoded.settings.gyroscope} />}
                        </div>
                        <div className="grid md:grid-cols-2 gap-6 pt-6 border-t">
                            <div className="space-y-3">
                                <h3 className="font-semibold text-lg flex items-center gap-2"><Brain className="w-5 h-5 text-accent"/>Análisis Táctico</h3>
                                <p className="text-sm text-muted-foreground">{decoded.analysis.tacticalAnalysis}</p>
                            </div>
                            <div className="space-y-3">
                                <h3 className="font-semibold text-lg flex items-center gap-2"><Crosshair className="w-5 h-5 text-accent"/>Armas Recomendadas</h3>
                                 <ul className="list-disc list-inside text-sm text-muted-foreground">
                                    {decoded.analysis.recommendedWeapons.map(w => <li key={w}>{w}</li>)}
                                </ul>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="gap-2">
                        <Button onClick={handleSave}><PlusCircle className="mr-2"/>Guardar en Arsenal</Button>
                        <Button variant="outline" onClick={() => setDecoded(null)}>Descartar</Button>
                    </CardFooter>
                </Card>
            )}

            {savedSensitivities.length > 0 && (
                 <div className="space-y-4">
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
                                     <div className="p-4 bg-muted/50 rounded-lg">
                                        <h4 className="font-semibold text-sm flex items-center gap-2 mb-2"><Bot className="h-4 w-4"/>Análisis de IA</h4>
                                        <p className="text-xs text-muted-foreground">{s.analysis.tacticalAnalysis}</p>
                                     </div>
                                    <div className="flex gap-2 justify-center">
                                       <QrCode className="w-24 h-24 text-muted-foreground"/>
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button variant="outline" className="w-full" onClick={() => handleCopyCode(s.code)}>
                                        <ClipboardCopy className="mr-2"/>
                                        Copiar Código: {s.code.substring(0, 9)}...
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

