
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Rocket, Check, DollarSign, Crown, Eye, Send } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

const plans = [
    {
        name: "Plan Creador Básico",
        price: "$2.99",
        priceSuffix: "/ mes",
        features: ["Acceso al Portal del Creador", "Publica hasta 5 servicios", "Soporte estándar"],
        isPopular: false,
    },
    {
        name: "Plan Creador Pro",
        price: "$4.99",
        priceSuffix: "/ mes",
        features: ["Acceso al Portal del Creador", "Servicios ilimitados", "Soporte prioritario", "Insignia de Creador Destacado", "Mejor posicionamiento"],
        isPopular: true,
    }
]

export default function CreatorApplicationPage() {
    const { toast } = useToast()
    const [selectedPlan, setSelectedPlan] = useState("Plan Creador Pro")

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        toast({
            title: "Solicitud Enviada con Éxito",
            description: "Hemos recibido tu solicitud. Nuestro equipo la revisará y te notificará una vez que sea aprobada. ¡Gracias por tu interés!",
        });
        (e.target as HTMLFormElement).reset()
    }

    return (
        <div className="space-y-12">
            <div className="text-center space-y-4">
                <div className="inline-block p-4 bg-primary/10 rounded-full">
                    <Rocket className="w-12 h-12 text-primary"/>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold">Conviértete en Creador de SquadUp</h1>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                    Únete a nuestro programa exclusivo para creadores y ofrece tus habilidades a miles de jugadores. Monetiza tu talento y construye tu reputación en la comunidad.
                </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 text-center max-w-4xl mx-auto">
                <div className="space-y-2">
                    <div className="p-3 bg-card rounded-full inline-block border">
                        <DollarSign className="w-6 h-6 text-primary"/>
                    </div>
                    <h3 className="font-bold text-lg">Monetiza tu Talento</h3>
                    <p className="text-sm text-muted-foreground">Ofrece servicios de coaching, análisis o compañía en partidas y obtén ingresos por tu experiencia.</p>
                </div>
                 <div className="space-y-2">
                    <div className="p-3 bg-card rounded-full inline-block border">
                        <Crown className="w-6 h-6 text-primary"/>
                    </div>
                    <h3 className="font-bold text-lg">Estatus Exclusivo</h3>
                    <p className="text-sm text-muted-foreground">Recibe una insignia de Creador Verificado en tu perfil, dándote prestigio y visibilidad en la plataforma.</p>
                </div>
                 <div className="space-y-2">
                    <div className="p-3 bg-card rounded-full inline-block border">
                        <Eye className="w-6 h-6 text-primary"/>
                    </div>
                    <h3 className="font-bold text-lg">Aumenta tu Visibilidad</h3>
                    <p className="text-sm text-muted-foreground">Tus servicios aparecerán en el Centro de Creadores, llegando a una audiencia de jugadores que buscan mejorar.</p>
                </div>
            </div>


            <Card className="max-w-4xl mx-auto">
                <form onSubmit={handleSubmit}>
                    <CardHeader>
                        <CardTitle>Formulario de Solicitud</CardTitle>
                        <CardDescription>
                            Cuéntanos sobre ti. Este es el primer paso para unirte a nuestro programa de creadores.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8">
                        <div className="space-y-2">
                            <Label htmlFor="experience">Tu Experiencia en el Juego</Label>
                            <Textarea 
                                id="experience"
                                placeholder="Describe tu experiencia en PUBG Mobile, tus logros, rangos alcanzados, si has participado en torneos, etc."
                                required
                                className="min-h-[120px]"
                            />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="service-idea">¿Qué tipo de servicios te gustaría ofrecer?</Label>
                             <Textarea 
                                id="service-idea"
                                placeholder="Ej: Me especializo en el control de recoil de la M762 y puedo enseñar a otros jugadores a dominarla. También soy un buen IGL para equipos que buscan mejorar su estrategia de rotación."
                                required
                                className="min-h-[120px]"
                            />
                        </div>

                        <div className="space-y-4">
                            <Label className="text-base font-semibold">Selecciona tu Plan de Suscripción</Label>
                            <div className="grid md:grid-cols-2 gap-4">
                                {plans.map(plan => (
                                     <div 
                                        key={plan.name}
                                        className={cn(
                                            "p-6 rounded-lg border cursor-pointer transition-all relative",
                                            selectedPlan === plan.name ? 'border-primary ring-2 ring-primary' : 'border-border'
                                        )}
                                        onClick={() => setSelectedPlan(plan.name)}
                                     >
                                        {plan.isPopular && <Badge className="absolute -top-3 right-3">Más Popular</Badge>}
                                        <h3 className="font-bold text-lg">{plan.name}</h3>
                                        <p className="text-2xl font-bold mt-2">{plan.price} <span className="text-sm font-normal text-muted-foreground">{plan.priceSuffix}</span></p>
                                        <ul className="space-y-2 mt-4 text-sm text-muted-foreground">
                                            {plan.features.map(feature => (
                                                <li key={feature} className="flex items-center gap-2">
                                                    <Check className="h-4 w-4 text-green-500"/>
                                                    {feature}
                                                </li>
                                            ))}
                                        </ul>
                                     </div>
                                ))}
                            </div>
                        </div>

                    </CardContent>
                    <CardFooter>
                        <Button type="submit" size="lg">
                            <Send className="mr-2"/>
                            Enviar Solicitud y Suscribirse
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
