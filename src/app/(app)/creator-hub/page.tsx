
"use client"

import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { services as initialServices, playerProfile, creators } from "@/lib/data";
import type { Service } from "@/lib/types";
import { Palette, PlusCircle, Pencil, Trash2, CheckCircle, Star, DollarSign } from "lucide-react";

export default function CreatorHubPage() {
  const { toast } = useToast();
  // Filtra los servicios para mostrar solo los del creador actual (simulado con playerProfile)
  const [myServices, setMyServices] = useState<Service[]>(
    initialServices.filter(s => s.creatorId === playerProfile.id)
  );

  const [serviceTitle, setServiceTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<string>("");
  const [voluntaryOptions, setVoluntaryOptions] = useState<Set<string>>(new Set());

  const handleCreateService = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!serviceTitle || !description) {
        toast({ variant: "destructive", title: "Campos Incompletos", description: "Por favor, completa todos los campos requeridos." });
        return;
    }

    const newService: Service = {
      id: `s${Date.now()}`,
      creatorId: playerProfile.id,
      creatorName: playerProfile.name,
      avatarUrl: playerProfile.avatarUrl,
      uid: playerProfile.id, // Usando el ID del perfil como UID
      serviceTitle: serviceTitle,
      description: description,
      price: parseFloat(price) || 0,
      voluntaryOptions: price === "0" ? Array.from(voluntaryOptions) : [],
      rating: 0,
      reviews: 0,
      isVerified: true, // Los creadores verificados crean servicios verificados
      isFeatured: false,
    };

    setMyServices(prev => [...prev, newService]);
    toast({
      title: "Servicio Publicado",
      description: `Tu nuevo servicio "${newService.serviceTitle}" está ahora visible.`,
    });

    // Reset form
    (event.target as HTMLFormElement).reset();
    setServiceTitle("");
    setDescription("");
    setPrice("");
    setVoluntaryOptions(new Set());
  };

  const handleVoluntaryOptionChange = (option: string, checked: boolean) => {
    setVoluntaryOptions(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(option);
      } else {
        newSet.delete(option);
      }
      return newSet;
    });
  };

  const handleDeleteService = (serviceId: string) => {
    setMyServices(prev => prev.filter(s => s.id !== serviceId));
    toast({
        variant: "destructive",
        title: "Servicio Eliminado",
        description: "Tu servicio ha sido eliminado de la plataforma.",
    })
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Palette className="w-8 h-8 text-primary" />
          Portal del Creador
        </h1>
        <p className="text-muted-foreground">
          Gestiona tus servicios, crea nuevas ofertas y conecta con la comunidad.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Columna de Creación/Edición */}
        <div className="lg:col-span-1 space-y-8 lg:sticky top-20">
          <Card>
            <form onSubmit={handleCreateService}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PlusCircle className="h-5 w-5 text-primary" />
                  Crear Nuevo Servicio
                </CardTitle>
                <CardDescription>
                  Rellena los detalles para publicar una nueva oferta.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="s-serviceTitle">Título del Servicio</Label>
                  <Select onValueChange={setServiceTitle} value={serviceTitle} required>
                    <SelectTrigger id="s-serviceTitle">
                      <SelectValue placeholder="Selecciona un tipo de servicio" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Coaching de Puntería y Estrategia">Coaching de Puntería y Estrategia</SelectItem>
                      <SelectItem value="Compañero Profesional para Dúos/Squads">Compañero Profesional para Dúos/Squads</SelectItem>
                      <SelectItem value="Análisis de Partidas de Torneo">Análisis de Partidas de Torneo</SelectItem>
                      <SelectItem value="IGL (In-Game Leader) para tu Squad">IGL (In-Game Leader) para tu Squad</SelectItem>
                      <SelectItem value="Entrenamiento de Control de Retroceso (Recoil)">Entrenamiento de Control de Retroceso (Recoil)</SelectItem>
                      <SelectItem value="Optimización de Sensibilidad y Controles (HUD)">Optimización de Sensibilidad y Controles (HUD)</SelectItem>
                      <SelectItem value="Entrenamiento de Rotaciones y Posicionamiento">Entrenamiento de Rotaciones y Posicionamiento</SelectItem>
                      <SelectItem value="Gestión y Creación de Equipos de Torneo">Gestión y Creación de Equipos de Torneo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="s-description">Descripción Detallada</Label>
                  <Textarea
                    id="s-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe qué ofreces, tu experiencia, y qué puede esperar el jugador..."
                    required
                    className="min-h-[120px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="s-price">Precio (USD)</Label>
                  <Input
                    id="s-price"
                    type="number"
                    step="0.01"
                    placeholder="Ej: 25.00 (0 para gratis/intercambio)"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                  />
                </div>
                {price === '0' && (
                  <div className="space-y-4 p-4 border rounded-lg bg-muted/50 animate-in fade-in-50">
                    <Label className="font-semibold">Opciones de Intercambio Voluntario</Label>
                    <div className="space-y-2">
                      {[
                        { id: 'pop', label: 'Intercambio de Popularidad' },
                        { id: 'uc', label: 'Regalos UC' },
                        { id: 'friend', label: 'Agregar como Amigo' },
                        { id: 'social', label: 'Soporte en Redes Sociales' },
                      ].map(opt => (
                        <div key={opt.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`opt-${opt.id}`}
                            onCheckedChange={(checked) => handleVoluntaryOptionChange(opt.label, checked as boolean)}
                          />
                          <label htmlFor={`opt-${opt.id}`} className="text-sm font-medium leading-none">
                            {opt.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full">
                  Publicar Servicio
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>

        {/* Columna de Servicios Publicados */}
        <div className="lg:col-span-2 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Mis Servicios Publicados</CardTitle>
                    <CardDescription>Aquí puedes ver y gestionar todas tus ofertas activas en la plataforma.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {myServices.length === 0 && (
                        <div className="text-center text-muted-foreground p-8 border-dashed border-2 rounded-lg">
                            <p>Aún no has publicado ningún servicio.</p>
                            <p className="text-sm">Usa el formulario de la izquierda para crear tu primera oferta.</p>
                        </div>
                    )}
                    {myServices.map(service => (
                        <Card key={service.id} className="bg-muted/30">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-lg">{service.serviceTitle}</CardTitle>
                                        <div className="flex items-center gap-2 mt-1">
                                            {service.isVerified && <Badge variant="secondary"><CheckCircle className="mr-1 h-3 w-3"/> Verificado</Badge>}
                                            {service.isFeatured && <Badge className="bg-amber-400 text-amber-900 hover:bg-amber-400/80"><Star className="mr-1 h-3 w-3"/> Destacado</Badge>}
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <Button variant="ghost" size="icon"><Pencil className="h-4 w-4" /></Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDeleteService(service.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground line-clamp-2">{service.description}</p>
                            </CardContent>
                            <CardFooter className="flex justify-between items-center text-sm">
                                <div className="font-bold text-primary">
                                    <DollarSign className="inline-block h-4 w-4 mr-1"/>
                                    {service.price > 0 ? service.price.toFixed(2) : 'Gratis / Intercambio'}
                                </div>
                                <div className="text-muted-foreground">
                                    <Star className="inline-block fill-amber-400 text-amber-400 h-4 w-4 mr-1" />
                                    {service.rating.toFixed(1)} ({service.reviews} reseñas)
                                </div>
                            </CardFooter>
                        </Card>
                    ))}
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}

    