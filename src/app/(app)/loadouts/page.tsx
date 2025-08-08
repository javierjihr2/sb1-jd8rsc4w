
"use client"

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wrench, PlusCircle, Eye, Trash2 } from "lucide-react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

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

export default function LoadoutsPage() {
    const { toast } = useToast();

    const handleCreateLoadout = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        toast({
            title: "Equipamiento Creado",
            description: "Tu nuevo equipamiento ha sido guardado.",
        });
        (e.target as HTMLFormElement).reset();
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 space-y-8">
                 <div>
                    <h1 className="text-3xl font-bold">Mis Equipamientos</h1>
                    <p className="text-muted-foreground">Tus configuraciones de armas guardadas para cada situación.</p>
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                    {initialLoadouts.map((loadout) => (
                        <Card key={loadout.id}>
                            <CardHeader>
                                <CardTitle className="flex justify-between items-center">
                                    {loadout.name}
                                    <Button variant="ghost" size="icon">
                                        <Trash2 className="h-4 w-4 text-muted-foreground"/>
                                    </Button>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Primary Weapon */}
                                <div className="space-y-3">
                                    <Label className="text-muted-foreground">Principal</Label>
                                    <div className="flex items-start gap-4">
                                        <Image src="https://placehold.co/120x60.png" alt={loadout.primary.name} width={120} height={60} className="rounded-md bg-muted object-cover" data-ai-hint="weapon"/>
                                        <div className="space-y-1 text-sm">
                                            <p className="font-bold text-base">{loadout.primary.name}</p>
                                            <p><span className="font-semibold">Mira:</span> {loadout.primary.sight}</p>
                                            <p><span className="font-semibold">Agarre:</span> {loadout.primary.grip}</p>
                                        </div>
                                    </div>
                                </div>
                                {/* Secondary Weapon */}
                                <div className="space-y-3">
                                    <Label className="text-muted-foreground">Secundaria</Label>
                                    <div className="flex items-start gap-4">
                                        <Image src="https://placehold.co/120x60.png" alt={loadout.secondary.name} width={120} height={60} className="rounded-md bg-muted object-cover" data-ai-hint="weapon"/>
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
                            <PlusCircle className="h-5 w-5 text-primary"/>
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
                                    <Input id="primary-weapon" placeholder="Ej: M416" required/>
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
                                    <Input id="secondary-weapon" placeholder="Ej: UMP45" required/>
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
    );
}
