
"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { Service } from "@/lib/types";
import { CheckCircle, Medal, Star, MessageSquare, User, Gift, Handshake, Heart } from "lucide-react";
import Link from "next/link";
import { ScrollArea } from "./ui/scroll-area";

interface ServiceDetailDialogProps {
  service: Service;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onContact: (creatorName: string) => void;
}

const voluntaryIcons: { [key: string]: React.ElementType } = {
    'Regalos UC': Gift,
    'Intercambio de Popularidad': Heart,
    'Agregar como Amigo': Handshake,
    'Soporte en Redes Sociales': User,
}

export function ServiceDetailDialog({ service, isOpen, onOpenChange, onContact }: ServiceDetailDialogProps) {

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-left">
             <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16 border-2 border-primary/50">
                    <AvatarImage src={service.avatarUrl} data-ai-hint="gaming character"/>
                    <AvatarFallback>{service.creatorName.substring(0,2)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <DialogTitle className="text-2xl">{service.creatorName}</DialogTitle>
                    <div className="flex items-center gap-2 mt-1">
                         {service.isVerified && <Badge variant="secondary"><CheckCircle className="mr-1 h-3 w-3 text-green-500"/> Verificado</Badge>}
                         {service.isFeatured && <Badge className="text-amber-900 bg-amber-400/80 border-amber-500/50"><Medal className="mr-1 h-3 w-3"/>Recomendado</Badge>}
                    </div>
                </div>
            </div>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] -mx-6">
        <div className="px-6 space-y-6 pb-6">
            <div className="space-y-2">
                <h3 className="text-xl font-bold text-primary">{service.serviceTitle}</h3>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> 
                    <span className="font-bold">{service.rating.toFixed(1)}</span>
                    <span>({service.reviews} reseñas)</span>
                </div>
            </div>

            <div className="space-y-1">
                <h4 className="font-semibold text-sm">Descripción del Servicio</h4>
                <p className="text-sm text-muted-foreground">{service.description}</p>
            </div>

            {service.price > 0 ? (
                <div className="space-y-1">
                    <h4 className="font-semibold text-sm">Precio</h4>
                     <p className="text-xs text-muted-foreground">Pago a coordinar con el creador</p>
                    <p className="text-2xl font-bold text-foreground">${service.price.toFixed(2)} USD</p>
                </div>
            ) : (
                <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Costo: Gratis / Intercambio</h4>
                     <p className="text-xs text-muted-foreground">Este servicio es gratuito, pero el creador está abierto a las siguientes formas de apoyo voluntario:</p>
                    <div className="grid grid-cols-2 gap-2">
                        {service.voluntaryOptions.map(option => {
                             const Icon = voluntaryIcons[option] || Handshake;
                             return (
                                <div key={option} className="flex items-center gap-2 text-sm p-2 bg-muted/50 rounded-md">
                                    <Icon className="h-4 w-4 text-primary"/>
                                    <span>{option}</span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
        </ScrollArea>
        <div className="flex flex-col sm:flex-row gap-2">
            <Button className="flex-1" onClick={() => onContact(service.creatorName)}>
                <MessageSquare className="mr-2 h-4 w-4" />
                Contactar al Creador
            </Button>
            <Button asChild variant="secondary" className="flex-1">
                <Link href={`/profile/${service.creatorId}`}>
                    <User className="mr-2 h-4 w-4" />
                    Ver Perfil Completo
                </Link>
            </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
