
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lock, Sparkles, Map } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function StrategiesPage() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Generador de Estrategias IA</h1>
                <p className="text-muted-foreground">Planifica tu partida perfecta con estrategias de nivel profesional generadas por IA.</p>
            </div>

            <Card className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10 flex flex-col items-center justify-center p-8 text-center">
                    <div className="p-3 bg-primary/20 rounded-full mb-4 border border-primary/50">
                        <Lock className="h-8 w-8 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Función Premium</h2>
                    <p className="text-primary-foreground/80 max-w-md mb-4">
                        Obtén acceso ilimitado al generador de estrategias, con análisis de mapas y recomendaciones personalizadas, suscribiéndote a nuestro plan Premium.
                    </p>
                    <Button>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Desbloquear Premium
                    </Button>
                </div>
                <div className="filter blur-sm pointer-events-none">
                     <CardHeader>
                        <CardTitle>Configura tu Estrategia</CardTitle>
                        <CardDescription>Selecciona el mapa y tu estilo de juego para obtener una estrategia a medida.</CardDescription>
                    </CardHeader>
                     <CardContent className="space-y-4">
                         <div className="space-y-2">
                             <label className="font-medium">Mapa</label>
                             <Select disabled>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona un mapa" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="erangel">Erangel</SelectItem>
                                    <SelectItem value="miramar">Miramar</SelectItem>
                                    <SelectItem value="sanhok">Sanhok</SelectItem>
                                    <SelectItem value="vikendi">Vikendi</SelectItem>
                                </SelectContent>
                             </Select>
                         </div>
                         <div className="space-y-2">
                             <label className="font-medium">Estilo de Juego del Equipo</label>
                             <Select disabled>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona un estilo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="aggressive">Agresivo</SelectItem>
                                    <SelectItem value="passive">Pasivo / Supervivencia</SelectItem>
                                    <SelectItem value="balanced">Equilibrado</SelectItem>
                                </SelectContent>
                             </Select>
                         </div>
                         <Button disabled>Generar Estrategia</Button>
                     </CardContent>
                </div>
            </Card>
        </div>
    );
}
