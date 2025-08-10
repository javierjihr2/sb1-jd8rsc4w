
"use client"

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Briefcase, CheckCircle, Filter, MessageSquare, Search, Star, Medal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";

const services = [
    {
        id: 's1',
        creatorName: 'CoachMaster',
        avatarUrl: 'https://placehold.co/100x100.png',
        serviceTitle: 'Coaching de Puntería y Estrategia',
        description: 'Sesiones personalizadas para mejorar tu KD, control de retroceso y toma de decisiones. Analizo tus partidas y te doy feedback para subir de rango.',
        price: '3 Regalos "Avión"',
        rating: 4.9,
        reviews: 28,
        isVerified: true,
        isFeatured: true,
    },
    {
        id: 's2',
        creatorName: 'DuoPerfecto',
        avatarUrl: 'https://placehold.co/100x100.png',
        serviceTitle: 'Compañero Profesional para Dúos',
        description: '¿Cansado de jugar con randoms? Te acompaño en tus partidas de ranking para asegurar victorias y subir puntos. Paciencia y buena comunicación garantizadas.',
        price: '1 Regalo "Moto"',
        rating: 5.0,
        reviews: 42,
        isVerified: true,
        isFeatured: false,
    },
     {
        id: 's3',
        creatorName: 'AnalistaTáctico',
        avatarUrl: 'https://placehold.co/100x100.png',
        serviceTitle: 'Análisis de Partidas de Torneo',
        description: 'Reviso las grabaciones de tus partidas de scrims o torneos y te entrego un informe detallado sobre rotaciones, posicionamiento y errores a corregir.',
        price: '5 Regalos "Casco Nivel 3"',
        rating: 4.8,
        reviews: 15,
        isVerified: false,
        isFeatured: false,
    },
     {
        id: 's4',
        creatorName: 'LaJefa',
        avatarUrl: 'https://placehold.co/100x100.png',
        serviceTitle: 'IGL para tu Squad',
        description: 'Lidero a tu equipo en partidas de ranking. Me encargo de las calls, rotaciones y estrategia para que ustedes solo se preocupen por disparar.',
        price: '2 Regalos "Coche Deportivo"',
        rating: 5.0,
        reviews: 31,
        isVerified: true,
        isFeatured: false,
    },
]

export default function ServicesPage() {
    const { toast } = useToast();

    const handleContact = (creatorName: string) => {
        toast({
            title: "Solicitud de Contacto Enviada",
            description: `Se ha notificado a ${creatorName}. ¡Pronto se pondrá en contacto contigo a través del chat!`,
        });
    };
    
    return (
        <div className="space-y-8">
            <div className="text-center">
                <div className="inline-block p-4 bg-primary/10 rounded-full mb-4">
                    <Briefcase className="w-10 h-10 text-primary"/>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-primary">Centro de Creadores y Servicios</h1>
                <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">Encuentra coaches, analistas y compañeros de equipo verificados para llevar tu juego al siguiente nivel.</p>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-center gap-4 p-4 rounded-lg bg-card border">
                 <div className="relative w-full md:w-auto md:flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input placeholder="Buscar servicios (ej: 'puntería')" className="pl-10" />
                </div>
                <Select>
                    <SelectTrigger className="w-full md:w-[240px]">
                        <SelectValue placeholder="Filtrar por categoría" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="coaching">Coaching</SelectItem>
                        <SelectItem value="analysis">Análisis de Partidas</SelectItem>
                        <SelectItem value="teammate">Compañero Pro</SelectItem>
                        <SelectItem value="igl">IGL (Líder)</SelectItem>
                    </SelectContent>
                </Select>
                 <Button className="w-full md:w-auto">
                    <Filter className="mr-2 h-4 w-4" />
                    Aplicar
                 </Button>
            </div>


            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {services.map(service => (
                    <Card key={service.id} className={`flex flex-col overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${service.isFeatured ? 'border-amber-400 border-2 shadow-amber-500/10' : ''}`}>
                        <CardHeader className="p-0 relative">
                           <Image src="https://placehold.co/400x150/FF6B35/FFFFFF.png" data-ai-hint="abstract gradient" alt="Card Background" width={400} height={150} className="object-cover" />
                           <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"></div>
                           <div className="absolute top-0 right-0 m-2">
                                {service.isFeatured && <Badge variant="secondary" className="bg-amber-400 text-amber-900 border-amber-500"><Medal className="mr-1 h-4 w-4"/>Recomendado</Badge>}
                           </div>
                           <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
                                <Avatar className="w-24 h-24 border-4 border-background ring-2 ring-primary">
                                    <AvatarImage src={service.avatarUrl} data-ai-hint="gaming character"/>
                                    <AvatarFallback>{service.creatorName.substring(0,2)}</AvatarFallback>
                                </Avatar>
                           </div>
                        </CardHeader>
                        <CardContent className="pt-16 text-center">
                            <h3 className="text-xl font-bold text-primary">{service.serviceTitle}</h3>
                            <div className="flex items-center justify-center gap-2 mt-1">
                                <p className="font-semibold">{service.creatorName}</p>
                                {service.isVerified && <CheckCircle className="h-4 w-4 text-green-500" title="Verificado"/>}
                            </div>
                             <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mt-2">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" /> 
                                <span className="font-bold">{service.rating.toFixed(1)}</span>
                                <span>({service.reviews} reseñas)</span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-4 h-16 line-clamp-3">{service.description}</p>
                        </CardContent>
                        <CardFooter className="flex-col items-stretch gap-3 mt-auto p-4">
                            <div className="text-center font-bold text-lg py-2 border-y">{service.price}</div>
                            <div className="flex gap-2">
                                <Button className="flex-1" onClick={() => handleContact(service.creatorName)}>
                                    <MessageSquare className="mr-2 h-4 w-4" />
                                    Contactar
                                </Button>
                                <Button asChild variant="secondary" className="flex-1">
                                    <Link href="#">Ver Perfil</Link>
                                </Button>
                            </div>
                        </CardFooter>
                    </Card>
                ))}
            </div>

             <div className="text-center text-muted-foreground text-sm space-y-2 pt-8">
                <p><strong>Aviso de Seguridad:</strong> Todas las comunicaciones y acuerdos se realizan bajo tu propia responsabilidad.</p>
                <p>¿Quieres ofrecer tus servicios? <Link href="/support" className="text-primary underline">Contacta con nosotros</Link> para unirte al programa de creadores.</p>
            </div>
        </div>
    )
}
