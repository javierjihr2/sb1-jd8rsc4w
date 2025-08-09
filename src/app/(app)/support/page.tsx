
"use client"

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
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
import { useToast } from "@/hooks/use-toast";
import { HelpCircle, Send } from "lucide-react";

export default function SupportPage() {
    const { toast } = useToast();

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        toast({
            title: "Solicitud de Soporte Enviada",
            description: "Gracias por contactarnos. Nuestro equipo revisará tu solicitud y te responderá lo antes posible.",
        });
        (e.target as HTMLFormElement).reset();
    }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <HelpCircle className="w-8 h-8 text-primary" />
          Centro de Soporte
        </h1>
        <p className="text-muted-foreground">
          ¿Tienes alguna pregunta o problema? Rellena el formulario y te
          ayudaremos.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Enviar una Solicitud</CardTitle>
          <CardDescription>
            Nuestro tiempo de respuesta habitual es de 24 a 48 horas.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Tu Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Categoría del Problema</Label>
              <Select required>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technical">Problema Técnico</SelectItem>
                  <SelectItem value="billing">Facturación y Pagos</SelectItem>
                  <SelectItem value="feedback">Sugerencias y Comentarios</SelectItem>
                  <SelectItem value="account">Problemas con la Cuenta</SelectItem>
                  <SelectItem value="other">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Asunto</Label>
              <Input
                id="subject"
                placeholder="Ej: Problema al iniciar sesión"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Describe tu problema</Label>
              <Textarea
                id="description"
                placeholder="Por favor, proporciona todos los detalles posibles para que podamos ayudarte mejor."
                className="min-h-[150px]"
                required
              />
            </div>
             <Button type="submit" className="w-full">
                <Send className="mr-2 h-4 w-4"/>
                Enviar Solicitud
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
