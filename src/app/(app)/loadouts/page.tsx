
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wrench, PlusCircle, Eye } from "lucide-react";
import Image from "next/image";

export default function LoadoutsPage() {
    // Mock data for loadouts
    const loadouts = [
        { id: 1, name: "Asalto Agresivo", primary: "M416", secondary: "UMP45" },
        { id: 2, name: "Francotirador Letal", primary: "Kar98k", secondary: "Mini14" },
    ];

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Constructor de Equipamiento</h1>
                    <p className="text-muted-foreground">Crea, guarda y comparte tus combinaciones de armas favoritas.</p>
                </div>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Crear Nuevo Equipamiento
                </Button>
            </div>

             <Card>
                <CardHeader>
                    <CardTitle>Mis Equipamientos</CardTitle>
                    <CardDescription>Tus configuraciones de armas guardadas.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6 md:grid-cols-2">
                    {loadouts.map((loadout) => (
                        <Card key={loadout.id} className="p-4">
                            <h3 className="text-lg font-semibold mb-4">{loadout.name}</h3>
                            <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <Image src="https://placehold.co/100x50.png" alt={loadout.primary} width={100} height={50} className="rounded-md bg-muted" data-ai-hint="weapon"/>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Principal</p>
                                        <p className="font-medium">{loadout.primary}</p>
                                    </div>
                                </div>
                                 <div className="flex items-center gap-4">
                                     <Image src="https://placehold.co/100x50.png" alt={loadout.secondary} width={100} height={50} className="rounded-md bg-muted" data-ai-hint="weapon"/>
                                     <div>
                                        <p className="text-sm text-muted-foreground">Secundaria</p>
                                        <p className="font-medium">{loadout.secondary}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end mt-4">
                                <Button variant="outline" size="sm">
                                    <Eye className="mr-2 h-4 w-4" />
                                    Ver Detalles
                                </Button>
                            </div>
                        </Card>
                    ))}
                     <div className="border-2 border-dashed rounded-lg flex flex-col items-center justify-center p-8 text-center">
                        <Wrench className="h-10 w-10 text-muted-foreground mb-4"/>
                        <h3 className="text-lg font-semibold mb-2">Crea tu primer equipamiento</h3>
                        <p className="text-muted-foreground mb-4">Combina armas y accesorios para estar listo para cualquier situación.</p>
                        <Button variant="secondary">
                             <PlusCircle className="mr-2 h-4 w-4" />
                            Empezar
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
