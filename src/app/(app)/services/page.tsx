
"use client"

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Briefcase, CheckCircle, Filter, MessageSquare, Search, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

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
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-2"><Briefcase className="w-8 h-8 text-primary"/> Centro de Creadores y Servicios</h1>
                <p className="text-muted-foreground">Encuentra coaches, analistas y compañeros de equipo verificados para llevar tu juego al siguiente nivel.</p>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <CardTitle>Buscar Servicios</CardTitle>
                        <div className="flex gap-2 items-center">
                            <div className="relative flex-1">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="Buscar por palabra clave..." className="pl-8" />
                            </div>
                            <Select>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Filtrar por categoría" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="coaching">Coaching</SelectItem>
                                    <SelectItem value="analysis">Análisis de Partidas</SelectItem>
                                    <SelectItem value="teammate">Compañero Pro</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="grid gap-6 md:grid-cols-2">
                    {services.map(service => (
                        <Card key={service.id} className={`flex flex-col ${service.isFeatured ? 'border-primary border-2 shadow-lg' : ''}`}>
                            {service.isFeatured && <Badge className="w-fit m-2">Destacado</Badge>}
                            <CardHeader className="flex-row gap-4 items-start pt-2">
                                <Avatar className="w-16 h-16 border">
                                    <AvatarImage src={service.avatarUrl} data-ai-hint="gaming character"/>
                                    <AvatarFallback>{service.creatorName.substring(0,2)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-primary">{service.serviceTitle}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <p className="text-sm font-semibold">{service.creatorName}</p>
                                        {service.isVerified && <CheckCircle className="h-4 w-4 text-green-500" />}
                                    </div>
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" /> 
                                        <span>{service.rating.toFixed(1)}</span>
                                        <span>({service.reviews} reseñas)</span>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <p className="text-sm text-muted-foreground line-clamp-3">{service.description}</p>
                            </CardContent>
                            <CardFooter className="flex-col items-stretch gap-3">
                                <div className="text-center font-bold text-lg">{service.price}</div>
                                <div className="flex gap-2">
                                    <Button className="flex-1" onClick={() => handleContact(service.creatorName)}>
                                        <MessageSquare className="mr-2 h-4 w-4" />
                                        Contactar
                                    </Button>
                                    <Button asChild variant="outline" className="flex-1">
                                        <Link href="#">Ver Perfil</Link>
                                    </Button>
                                </div>
                            </CardFooter>
                        </Card>
                    ))}
                </CardContent>
            </Card>

             <div className="text-center text-muted-foreground text-sm space-y-2">
                <p><strong>Aviso de Seguridad:</strong> Todas las comunicaciones y acuerdos se realizan bajo tu propia responsabilidad.</p>
                <p>¿Quieres ofrecer tus servicios? <Link href="/support" className="text-primary underline">Contacta con nosotros</Link> para unirte al programa de creadores.</p>
            </div>
        </div>
    )
}
