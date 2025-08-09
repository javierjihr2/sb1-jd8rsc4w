
import Link from "next/link"
import Image from "next/image"
import {
  BrainCircuit,
  Swords,
  Users2,
  Newspaper,
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
                    <Textarea placeholder={`¿Qué estás pensando, ${playerProfile.name}?`} />
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
        <div className="space-y-6">
            <CardTitle>Actividad Reciente</CardTitle>
            {feedPosts.map(post => (
                <Card key={post.id}>
                    <CardHeader>
                        <div className="flex items-start gap-4">
                            <Avatar className="h-12 w-12 border">
                                    <AvatarImage src={post.author.avatarUrl} data-ai-hint="gaming character"/>
                                    <AvatarFallback>{post.author.name.substring(0, 2)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-semibold text-lg">{post.author.name}</p>
                                        <p className="text-xs text-muted-foreground">{post.timestamp}</p>
                                    </div>
                                    <Badge variant="outline">{post.author.rank}</Badge>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground mb-4">{post.content}</p>
                        {post.imageUrl && (
                            <div className="rounded-lg overflow-hidden border mb-4">
                                <Image src={post.imageUrl} alt="Imagen de la publicación" width={800} height={400} className="w-full h-auto object-cover" data-ai-hint="gaming screenshot"/>
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="flex items-center gap-4">
                        <Button variant="ghost" className="flex items-center gap-2 text-muted-foreground">
                            <Heart className="h-5 w-5"/> <span>{post.likes}</span>
                        </Button>
                        <Button variant="ghost" className="flex items-center gap-2 text-muted-foreground">
                            <MessageCircle className="h-5 w-5"/> <span>{post.comments}</span>
                        </Button>
                         <Button variant="ghost" className="flex items-center gap-2 text-muted-foreground ml-auto">
                            <Send className="h-5 w-5"/> <span>Compartir</span>
                        </Button>
                    </CardFooter>
                </Card>
            ))}
        </div>
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
      </div>
    </div>
  )
}
