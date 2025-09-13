"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Calendar, Clock, Share2, Bookmark, ExternalLink } from "lucide-react"
import { NewsArticle } from "@/lib/types"
import Image from "next/image"
import { toast } from "@/hooks/use-toast"

interface NewsDetailDialogProps {
  article: NewsArticle | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NewsDetailDialog({ article, open, onOpenChange }: NewsDetailDialogProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)

  if (!article) return null

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: article.title,
        text: article.summary,
        url: window.location.href
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast({
        title: "Enlace copiado",
        description: "El enlace del artículo ha sido copiado al portapapeles."
      })
    }
  }

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked)
    toast({
      title: isBookmarked ? "Marcador eliminado" : "Artículo guardado",
      description: isBookmarked 
        ? "El artículo ha sido eliminado de tus marcadores."
        : "El artículo ha sido guardado en tus marcadores."
    })
  }

  // Contenido expandido simulado basado en el tipo de artículo
  const getExpandedContent = () => {
    switch (article.category) {
      case 'Actualizaciones':
        return {
          sections: [
            {
              title: "Novedades Principales",
              content: "Esta actualización introduce características revolucionarias que cambiarán completamente la experiencia de juego. Los desarrolladores han trabajado durante meses para perfeccionar cada detalle."
            },
            {
              title: "Mejoras de Rendimiento",
              content: "Se han optimizado los gráficos y la estabilidad del juego. Los jugadores experimentarán una mejora significativa en los FPS y una reducción en los tiempos de carga."
            },
            {
              title: "Nuevas Características",
              content: "• Nuevo sistema de progresión\n• Mapas rediseñados\n• Armas balanceadas\n• Interfaz mejorada\n• Sistema de clanes actualizado"
            }
          ]
        }
      case 'eSports':
        return {
          sections: [
            {
              title: "Equipos Participantes",
              content: "Los mejores equipos de todo el mundo se enfrentarán en una batalla épica por el título mundial. Cada equipo ha demostrado su valía en torneos regionales."
            },
            {
              title: "Formato del Torneo",
              content: "El torneo se desarrollará en formato de eliminación directa con partidas al mejor de 5 mapas. Los equipos competirán en múltiples modalidades de juego."
            },
            {
              title: "Premios y Reconocimientos",
              content: "El premio total asciende a $2,000,000 USD distribuidos entre los primeros 16 equipos. Además, habrá reconocimientos especiales para MVP y mejores jugadas."
            }
          ]
        }
      case 'Guías':
        return {
          sections: [
            {
              title: "Estrategias Básicas",
              content: "Dominar este mapa requiere conocer las rutas principales y los puntos de control estratégicos. La posición inicial es crucial para el éxito."
            },
            {
              title: "Ubicaciones Clave",
              content: "• Zona Norte: Ideal para equipos agresivos\n• Centro: Control de rotaciones\n• Zona Sur: Posición defensiva\n• Edificios altos: Ventaja de francotirador"
            },
            {
              title: "Consejos Avanzados",
              content: "Los jugadores experimentados recomiendan mantener siempre una ruta de escape planificada y coordinar los movimientos del equipo para maximizar las oportunidades."
            }
          ]
        }
      default:
        return {
          sections: [
            {
              title: "Información Detallada",
              content: article.summary + " Mantente atento a futuras actualizaciones y novedades que seguiremos compartiendo contigo."
            }
          ]
        }
    }
  }

  const expandedContent = getExpandedContent()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        <div className="relative">
          {/* Header Image */}
          <div className="relative h-64 md:h-80">
            <Image 
              src={article.imageUrl} 
              alt={article.title}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute top-4 right-4 flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleBookmark}
                className="bg-black/50 hover:bg-black/70 text-white border-0"
              >
                <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`} />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleShare}
                className="bg-black/50 hover:bg-black/70 text-white border-0"
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <ScrollArea className="h-[calc(90vh-20rem)] md:h-[calc(90vh-22rem)]">
            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                    {article.category}
                  </Badge>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {new Date(article.date).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    5 min de lectura
                  </div>
                </div>
                
                <DialogHeader>
                  <DialogTitle className="text-2xl md:text-3xl font-bold leading-tight">
                    {article.title}
                  </DialogTitle>
                </DialogHeader>
                
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {article.summary}
                </p>
              </div>

              <Separator />

              {/* Expanded Content */}
              <div className="space-y-8">
                {expandedContent.sections.map((section, index) => (
                  <div key={index} className="space-y-4">
                    <h3 className="text-xl font-semibold">{section.title}</h3>
                    <div className="prose prose-neutral dark:prose-invert max-w-none">
                      {section.content.split('\n').map((paragraph, pIndex) => (
                        <p key={pIndex} className="text-muted-foreground leading-relaxed mb-4 last:mb-0">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer Actions */}
              <Separator />
              
              <div className="flex items-center justify-between pt-4">
                <div className="flex items-center gap-4">
                  <Button variant="outline" onClick={handleShare}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Compartir
                  </Button>
                  <Button variant="outline" onClick={handleBookmark}>
                    <Bookmark className={`h-4 w-4 mr-2 ${isBookmarked ? 'fill-current' : ''}`} />
                    {isBookmarked ? 'Guardado' : 'Guardar'}
                  </Button>
                </div>
                
                <Button variant="outline">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Ver más noticias
                </Button>
              </div>
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}