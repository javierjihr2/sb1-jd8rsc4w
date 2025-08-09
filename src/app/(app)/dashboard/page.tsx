
import Link from "next/link"
import Image from "next/image"
import {
  MessageSquare,
  BrainCircuit,
  Swords,
  Users2,
  Newspaper,
  ChevronRight,
  Send,
  ImageIcon,
  Sticker,
  Heart,
  MessageCircle,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { playerProfile, newsArticles, feedPosts } from "@/lib/data"


export default function DashboardPage() {
  const latestPost = feedPosts[0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      <div className="lg:col-span-2 space-y-8">
         <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold">¡Bienvenido a SquadUp, {playerProfile.name}!</CardTitle>
            <CardDescription className="text-base">
              Tu copiloto de IA para dominar el campo de batalla. Analiza, crea estrategias y encuentra a tu equipo perfecto.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              Esto es más que una simple aplicación; es tu centro de mando personal para llevar tu juego al siguiente nivel. Aquí tienes un resumen de lo que puedes hacer:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <h3 className="font-semibold flex items-center gap-2 mb-1"><BrainCircuit className="h-5 w-5 text-primary"/>Análisis con IA</h3>
                <p className="text-sm text-muted-foreground">Descubre tu estilo de juego, fortalezas y áreas de mejora con un análisis profundo de tus estadísticas.</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <h3 className="font-semibold flex items-center gap-2 mb-1"><Swords className="h-5 w-5 text-primary"/>Estrategias Tácticas</h3>
                <p className="text-sm text-muted-foreground">Genera planes de batalla completos para cualquier mapa y estilo de juego.</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <h3 className="font-semibold flex items-center gap-2 mb-1"><Users2 className="h-5 w-5 text-primary"/>Sinergia de Equipo</h3>
                <p className="text-sm text-muted-foreground">Compara perfiles con tus amigos para encontrar al compañero de dúo perfecto.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Create Post */}
        <Card>
            <CardHeader>
                <CardTitle>Crear Publicación</CardTitle>
                <CardDescription>Comparte tus logros o busca nuevos compañeros de equipo.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid w-full gap-2">
                    <Textarea placeholder="¿Qué estás pensando, Pro_Player1?" />
                      <div className="flex justify-between items-center">
                        <div className="flex gap-1">
                            <Button variant="ghost" size="icon">
                                <ImageIcon className="h-5 w-5 text-muted-foreground" />
                            </Button>
                            <Button variant="ghost" size="icon">
                                <Sticker className="h-5 w-5 text-muted-foreground" />
                            </Button>
                        </div>
                        <Button>
                            <Send className="mr-2 h-4 w-4"/>
                            Publicar
                        </Button>
                      </div>
                </div>
            </CardContent>
        </Card>

        {/* Friend Activity Feed */}
        <Card>
            <CardHeader>
                <CardTitle>Actividad de Amigos</CardTitle>
                <Button asChild variant="link" className="p-0 h-auto text-primary">
                  <Link href="/feed">Ver todo</Link>
                </Button>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-start gap-4">
                  <Avatar className="h-10 w-10 border">
                        <AvatarImage src={latestPost.author.avatarUrl} data-ai-hint="gaming character"/>
                        <AvatarFallback>{latestPost.author.name.substring(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 bg-muted/30 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold">{latestPost.author.name}</p>
                            <p className="text-xs text-muted-foreground">{latestPost.timestamp}</p>
                          </div>
                          <Badge variant="outline">{latestPost.author.rank}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">{latestPost.content}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-3">
                          <Button variant="ghost" size="sm" className="flex items-center gap-1 -ml-2">
                            <Heart className="h-4 w-4"/> {latestPost.likes}
                          </Button>
                           <Button variant="ghost" size="sm" className="flex items-center gap-1">
                            <MessageCircle className="h-4 w-4"/> {latestPost.comments}
                          </Button>
                      </div>
                  </div>
              </div>
            </CardContent>
        </Card>

      </div>

      <div className="lg:col-span-1 space-y-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Noticias Express</CardTitle>
            <Button asChild size="sm" variant="outline">
              <Link href="/news">
                Ver Todas
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {newsArticles.slice(0, 3).map((article) => (
              <Link href="#" key={article.id} className="flex items-start gap-4 group">
                <Image 
                  src={article.imageUrl} 
                  alt={article.title} 
                  width={150} 
                  height={84} 
                  className="rounded-md object-cover aspect-video"
                  data-ai-hint="gaming news"
                />
                <div className="flex-1">
                  <Badge variant="secondary" className="mb-1">{article.category}</Badge>
                  <p className="text-sm font-semibold leading-tight group-hover:underline">{article.title}</p>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
         <Card>
          <CardHeader>
            <CardTitle>Matchmaking Inteligente</CardTitle>
            <CardDescription>Encuentra a tu compañero de equipo ideal.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">
              <Users2 className="mr-2"/>
              Buscar Equipo
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
