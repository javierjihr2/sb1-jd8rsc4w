
"use client"

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getServices, orderService } from "@/lib/database";
import { useAuth } from "@/app/auth-provider";
import { Briefcase, CheckCircle, Filter, MessageSquare, Search, Star, Medal, Eye } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Service } from "@/lib/types";
import { ServiceDetailDialog } from "@/components/service-detail-dialog";

export default function ServicesPage() {
    const { toast } = useToast();
    const { user } = useAuth();
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    const categories = [
        { value: 'all', label: 'Todas las categorías' },
        { value: 'coaching', label: 'Coaching' },
        { value: 'analysis', label: 'Análisis de Partidas' },
        { value: 'teammate', label: 'Compañero Pro' },
        { value: 'igl', label: 'IGL (Líder)' }
    ];

    useEffect(() => {
        loadServices();
    }, [selectedCategory]);

    const loadServices = async () => {
        try {
            setLoading(true);
            const fetchedServices = await getServices(
                selectedCategory === 'all' ? undefined : selectedCategory,
                undefined,
                20
            );
            setServices(fetchedServices);
        } catch (error) {
            console.error('Error loading services:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredServices = services.filter(service =>
        service.serviceTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.creatorName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleContact = async (creatorName: string) => {
        if (!user || !selectedService) {
            toast({
                title: "Error",
                description: "Debes iniciar sesión para contactar a un creador.",
                variant: "destructive"
            });
            return;
        }

        try {
            await orderService(selectedService.id, user.uid, {
                description: `Solicitud de contacto para: ${selectedService.serviceTitle}`,
                amount: selectedService.price
            });
            
            toast({
                title: "Solicitud de Contacto Enviada",
                description: `Se ha notificado a ${creatorName}. ¡Pronto se pondrá en contacto contigo a través del chat!`,
            });
            setSelectedService(null);
        } catch (error) {
            console.error('Error contacting creator:', error);
            toast({
                title: "Error",
                description: "No se pudo enviar la solicitud. Inténtalo de nuevo.",
                variant: "destructive"
            });
        }
    };
    
    return (
        <>
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
                    <Input 
                        placeholder="Buscar servicios (ej: 'puntería')" 
                        className="pl-10" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-full md:w-[240px]">
                        <SelectValue placeholder="Filtrar por categoría" />
                    </SelectTrigger>
                    <SelectContent>
                        {categories.map(category => (
                            <SelectItem key={category.value} value={category.value}>
                                {category.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Button className="w-full md:w-auto" onClick={loadServices}>
                    <Filter className="mr-2 h-4 w-4" />
                    Aplicar
                </Button>
            </div>

            {!loading && filteredServices.length === 0 && (
                <div className="text-center py-12">
                    <div className="text-muted-foreground">
                        <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No se encontraron servicios</p>
                        <p className="text-sm">Intenta con otros términos de búsqueda o categoría</p>
                    </div>
                </div>
            )}




            {loading ? (
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {[...Array(6)].map((_, i) => (
                        <Card key={i} className="animate-pulse">
                            <CardHeader>
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-muted rounded-full" />
                                    <div className="space-y-2">
                                        <div className="h-4 bg-muted rounded w-24" />
                                        <div className="h-3 bg-muted rounded w-16" />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <div className="h-4 bg-muted rounded" />
                                    <div className="h-3 bg-muted rounded w-3/4" />
                                </div>
                            </CardContent>
                            <CardFooter>
                                <div className="h-10 bg-muted rounded w-full" />
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {filteredServices.map(service => (
                        <Card 
                        key={service.id} 
                        className={cn(
                            "flex flex-col overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer",
                            service.isFeatured ? 'border-amber-400/50 bg-amber-500/5' : ''
                        )}
                        onClick={() => setSelectedService(service)}
                    >
                        <CardHeader className="flex-row items-center gap-4">
                           <Avatar className="w-14 h-14 border-2 border-primary/50">
                                <AvatarImage src={service.avatarUrl} data-ai-hint="gaming character"/>
                                <AvatarFallback>{service.creatorName.substring(0,2)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <CardTitle className="text-base flex items-center gap-2">
                                    {service.creatorName}
                                    {service.isVerified && <CheckCircle className="h-4 w-4 text-green-500"/>}
                                </CardTitle>
                                <CardDescription className="text-xs">
                                     {service.isFeatured ? (
                                        <Badge variant="secondary" className="mt-1 text-amber-900 bg-amber-400/80 border-amber-500/50">
                                            <Medal className="mr-1 h-3 w-3"/>Recomendado
                                        </Badge>
                                     ) : (
                                        `UID: ${service.uid}`
                                     )}
                                </CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 space-y-3">
                           <h3 className="text-lg font-bold text-primary leading-tight">{service.serviceTitle}</h3>
                           <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> 
                                <span className="font-bold">{service.rating.toFixed(1)}</span>
                                <span>({service.reviews} reseñas)</span>
                            </div>
                            <p className="text-sm text-muted-foreground h-12 line-clamp-2">{service.description}</p>
                        </CardContent>
                        <CardFooter className="flex-col items-stretch gap-3 mt-auto pt-4 border-t">
                            <div className="text-center font-bold text-lg py-1">
                                {service.price > 0 ? `$${service.price.toFixed(2)} USD` : 'Gratis / Intercambio'}
                            </div>
                             <Button variant="secondary" className="w-full">
                                <Eye className="mr-2 h-4 w-4" />
                                Ver Detalles
                            </Button>
                        </CardFooter>
                        </Card>
                    ))}
                </div>
            )}

            <div className="text-center text-muted-foreground text-sm space-y-2 pt-8">
                <p><strong>Aviso de Seguridad:</strong> Todas las comunicaciones y acuerdos de pago se realizan directamente entre el usuario y el creador. La aplicación no se hace responsable de las transacciones.</p>
                <p>¿Quieres ofrecer tus servicios? <Link href="/creator-application" className="text-primary underline">Aplica para ser creador</Link> para empezar.</p>
            </div>
        </div>

        {selectedService && (
            <ServiceDetailDialog
                service={selectedService}
                isOpen={!!selectedService}
                onOpenChange={(isOpen) => {
                    if (!isOpen) {
                        setSelectedService(null);
                    }
                }}
                onContact={handleContact}
            />
        )}
        </>
    )
}
