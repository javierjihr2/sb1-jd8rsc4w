
"use client"

import { useState } from "react";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { HelpCircle, Send, MessageCircle, Mail, Phone, Clock, ChevronDown, ChevronUp, Search, Book, Users, Shield, Gamepad2 } from "lucide-react";

// Datos de FAQ
const faqData = [
  {
    id: 1,
    category: "Cuenta",
    icon: Users,
    question: "¿Cómo puedo cambiar mi contraseña?",
    answer: "Puedes cambiar tu contraseña desde Configuraciones > Seguridad > Cambiar Contraseña. Necesitarás tu contraseña actual para confirmar el cambio."
  },
  {
    id: 2,
    category: "Cuenta",
    icon: Users,
    question: "¿Cómo elimino mi cuenta?",
    answer: "Para eliminar tu cuenta, ve a Configuraciones > Zona de Peligro > Eliminar Cuenta. Esta acción es irreversible y eliminará todos tus datos."
  },
  {
    id: 3,
    category: "Matchmaking",
    icon: Gamepad2,
    question: "¿Cómo funciona el sistema de matchmaking?",
    answer: "El sistema de matchmaking te conecta con jugadores de nivel similar. Puedes filtrar por rango, ubicación, idioma y más. Envía solicitudes de match y cuando ambos se envían solicitudes, se crea un match automáticamente."
  },
  {
    id: 4,
    category: "Matchmaking",
    icon: Gamepad2,
    question: "¿Por qué no encuentro matches?",
    answer: "Asegúrate de que tus filtros no sean muy restrictivos. También verifica que tengas una buena conexión a internet y que tu perfil esté completo."
  },
  {
    id: 5,
    category: "Privacidad",
    icon: Shield,
    question: "¿Cómo puedo hacer mi perfil privado?",
    answer: "Ve a Configuraciones > Privacidad de la Cuenta y activa 'Hacer mi cuenta privada'. Solo tus amigos podrán ver tu información."
  },
  {
    id: 6,
    category: "Privacidad",
    icon: Shield,
    question: "¿Cómo bloqueo a un usuario?",
    answer: "Puedes bloquear usuarios desde su perfil o desde el chat. Los usuarios bloqueados no podrán contactarte ni ver tu perfil."
  },
  {
    id: 7,
    category: "Técnico",
    icon: HelpCircle,
    question: "La aplicación se cierra inesperadamente",
    answer: "Intenta cerrar y abrir la aplicación. Si el problema persiste, limpia la caché desde Configuraciones > Datos y Almacenamiento > Limpiar Caché."
  },
  {
    id: 8,
    category: "Técnico",
    icon: HelpCircle,
    question: "No recibo notificaciones",
    answer: "Verifica que las notificaciones estén habilitadas en Configuraciones > Notificaciones y también en la configuración de tu dispositivo."
  }
];

export default function SupportPage() {
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [openFAQs, setOpenFAQs] = useState<string[]>([]);
    const [showConfirmation, setShowConfirmation] = useState(false);
    
    const categories = ["all", "Cuenta", "Matchmaking", "Privacidad", "Técnico"];
    
    const filteredFAQs = faqData.filter(faq => {
        const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === "all" || faq.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });
    
    const toggleFAQ = (id: number) => {
        const idStr = id.toString();
        setOpenFAQs(prev => 
            prev.includes(idStr) 
                ? prev.filter(faqId => faqId !== idStr)
                : [...prev, idStr]
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setShowConfirmation(true);
        toast({
            title: "Solicitud enviada",
            description: "Hemos recibido tu solicitud. Te responderemos pronto.",
        });
    };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold flex items-center justify-center gap-3 mb-4">
          <HelpCircle className="w-10 h-10 text-primary" />
          Centro de Ayuda y Soporte
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Encuentra respuestas rápidas en nuestras FAQ o contáctanos directamente. Estamos aquí para ayudarte.
        </p>
      </div>

      {/* Opciones de Contacto Rápido */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6 text-center">
            <MessageCircle className="w-12 h-12 text-blue-500 mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Chat en Vivo</h3>
            <p className="text-sm text-muted-foreground mb-4">Respuesta inmediata de nuestro equipo</p>
            <Button className="w-full" variant="outline">
              Iniciar Chat
            </Button>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6 text-center">
            <Mail className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Email</h3>
            <p className="text-sm text-muted-foreground mb-4">Respuesta en 24-48 horas</p>
            <Button className="w-full" variant="outline">
              Enviar Email
            </Button>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6 text-center">
            <Clock className="w-12 h-12 text-orange-500 mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Horarios</h3>
            <p className="text-sm text-muted-foreground mb-2">Lun - Vie: 9:00 - 18:00</p>
            <p className="text-sm text-muted-foreground mb-4">Sáb: 10:00 - 14:00</p>
            <Badge variant="secondary">GMT-5</Badge>
          </CardContent>
        </Card>
      </div>

      {/* FAQ Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Book className="w-6 h-6" />
            Preguntas Frecuentes
          </CardTitle>
          <CardDescription>
            Encuentra respuestas rápidas a las preguntas más comunes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Búsqueda y Filtros */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar en FAQ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {categories.slice(1).map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* FAQ Items */}
          <div className="space-y-4">
            {filteredFAQs.length > 0 ? (
              filteredFAQs.map((faq) => {
                const Icon = faq.icon;
                const isOpen = openFAQs.includes(faq.id.toString());
                
                return (
                  <Collapsible key={faq.id} open={isOpen} onOpenChange={() => toggleFAQ(faq.id)}>
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3 text-left">
                          <Icon className="w-5 h-5 text-primary" />
                          <div>
                            <h4 className="font-medium">{faq.question}</h4>
                            <Badge variant="secondary" className="mt-1">{faq.category}</Badge>
                          </div>
                        </div>
                        {isOpen ? (
                          <ChevronUp className="w-5 h-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="px-4 pb-4 pt-2">
                        <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })
            ) : (
              <div className="text-center py-8">
                <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No se encontraron resultados para tu búsqueda.</p>
                <p className="text-sm text-muted-foreground mt-2">Intenta con otros términos o contacta con soporte.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Formulario de Contacto */}
      <Card>
        <CardHeader>
          <CardTitle>¿No encontraste lo que buscabas?</CardTitle>
          <CardDescription>
            Envíanos tu consulta y nuestro equipo te responderá lo antes posible.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <SelectItem value="account">Problemas con la Cuenta</SelectItem>
                    <SelectItem value="matchmaking">Matchmaking</SelectItem>
                    <SelectItem value="privacy">Privacidad y Seguridad</SelectItem>
                    <SelectItem value="billing">Facturación y Pagos</SelectItem>
                    <SelectItem value="feedback">Sugerencias y Comentarios</SelectItem>
                    <SelectItem value="other">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
                placeholder="Por favor, proporciona todos los detalles posibles para que podamos ayudarte mejor. Incluye pasos para reproducir el problema si es técnico."
                className="min-h-[150px]"
                required
              />
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">💡 Consejos para obtener ayuda más rápida:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Incluye capturas de pantalla si es posible</li>
                <li>• Describe los pasos exactos que llevaron al problema</li>
                <li>• Menciona tu dispositivo y versión del sistema operativo</li>
                <li>• Indica si el problema ocurre siempre o solo a veces</li>
              </ul>
            </div>
            <Button type="submit" className="w-full">
              <Send className="mr-2 h-4 w-4"/>
              Enviar Solicitud de Soporte
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
