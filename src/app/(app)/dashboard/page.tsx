
"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import Autoplay from "embla-carousel-autoplay"
import {
  Rss,
  Swords,
  ChevronRight,
  ArrowRight,
  User,
  Users,
  Trophy,
  Calendar,
  Globe,
  Plus,
  Loader2,
  AlertTriangle
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { tournaments, newsArticles } from "@/lib/data"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/app/auth-provider"
import type { NewsArticle } from "@/lib/types"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { CreatePost } from "@/components/create-post"
import { FeedPost } from "@/components/feed-post"
import { NewsDetailDialog } from "@/components/news-detail-dialog"
import { usePosts } from "@/hooks/use-posts"
import { useUserStore } from "@/store"

const tournamentBackgrounds = {
    'Solo': 'bg-gradient-to-r from-blue-500/10 to-blue-900/10',
    'Dúo': 'bg-gradient-to-r from-purple-500/10 to-purple-900/10',
    'Escuadra': 'bg-gradient-to-r from-red-500/10 to-red-900/10',
}

const tournamentIcons = {
    'Solo': <User className="h-8 w-8 text-blue-400"/>,
    'Dúo': <Users className="h-8 w-8 text-purple-400"/>,
    'Escuadra': <Swords className="h-8 w-8 text-red-400"/>,
}


export default function DashboardPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null)
  
  // Usar hooks de React Query y Zustand
  const { posts = [], isLoading, error: postsError } = usePosts()
  const { user: currentUser } = useUserStore()

  const upcomingTournaments = tournaments.filter(t => t.status === 'Abierto' || t.status === 'Próximamente').slice(0, 3)

  const plugin = useRef(
    Autoplay({ delay: 3500, stopOnInteraction: true, stopOnMouseEnter: true })
  )

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
        {/* Hero Section with Featured News */}
        <div className="relative">
            <Carousel
                plugins={[plugin.current]}
                opts={{
                    align: "start",
                    loop: true,
                }}
                className="w-full"
                onMouseEnter={plugin.current.stop}
                onMouseLeave={plugin.current.reset}
            >
                <CarouselContent>
                    {newsArticles.slice(0, 3).map((article, index) => (
                        <CarouselItem key={index}>
                             <Card className="overflow-hidden relative border-0 shadow-2xl">
                                <Image 
                                    src={article.imageUrl} 
                                    alt={article.title} 
                                    width={1200} height={400} 
                                    className="w-full h-56 md:h-72 lg:h-80 object-cover" 
                                    data-ai-hint="gaming news splash"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                                    <Badge variant="secondary" className="mb-3 bg-primary/90 text-white border-0">{article.category}</Badge>
                                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2 leading-tight">{article.title}</h2>
                                    <p className="text-sm md:text-base text-white/90 mb-4 max-w-3xl leading-relaxed">{article.summary}</p>
                                    <Button 
                                        onClick={() => setSelectedArticle(article)}
                                        className="bg-primary hover:bg-primary/90 text-white border-0"
                                    >
                                        Leer Más <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </div>
                            </Card>
                        </CarouselItem>
                    ))}
                </CarouselContent>
                <CarouselPrevious className="hidden sm:flex left-4 bg-black/50 border-0 text-white hover:bg-black/70" />
                <CarouselNext className="hidden sm:flex right-4 bg-black/50 border-0 text-white hover:bg-black/70" />
            </Carousel>
        </div>
        
        {/* Próximos Torneos */}
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Swords className="text-primary h-6 w-6"/> 
                    </div>
                    Próximos Torneos
                </h2>
                <Button variant="outline" asChild className="hidden md:flex">
                    <Link href="/tournaments">Ver Todos <ChevronRight className="ml-2 h-4 w-4"/></Link>
                </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                 {upcomingTournaments.map(tournament => (
                    <Card key={tournament.id} className={`overflow-hidden relative group transition-all duration-300 hover:shadow-xl hover:-translate-y-2 border-0 ${tournamentBackgrounds[tournament.mode] || 'bg-muted/30'}`}>
                       <div className="p-6 flex flex-col justify-between h-full relative">
                           <div className="absolute top-4 right-4 opacity-20 group-hover:opacity-30 transition-opacity">
                               {tournamentIcons[tournament.mode]}
                           </div>
                           <div className="space-y-4">
                                <div>
                                    <h3 className="text-xl font-bold mb-2 pr-12">{tournament.name}</h3>
                                    <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30">{tournament.status}</Badge>
                                </div>
                                <div className="space-y-3 text-sm">
                                    <div className="flex items-center gap-3 p-2 bg-card/50 rounded-lg">
                                        <Trophy className="h-4 w-4 text-amber-400 flex-shrink-0"/> 
                                        <div>
                                            <span className="text-muted-foreground">Premio:</span>
                                            <span className="font-semibold ml-2">{tournament.prize}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-2 bg-card/50 rounded-lg">
                                        <Calendar className="h-4 w-4 text-blue-400 flex-shrink-0"/> 
                                        <div>
                                            <span className="text-muted-foreground">Fecha:</span>
                                            <span className="font-semibold ml-2">{tournament.date}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-2 bg-card/50 rounded-lg">
                                        <Globe className="h-4 w-4 text-green-400 flex-shrink-0"/> 
                                        <div>
                                            <span className="text-muted-foreground">Región:</span>
                                            <span className="font-semibold ml-2">{tournament.region}</span>
                                        </div>
                                    </div>
                                </div>
                           </div>
                           <Button asChild className="w-full mt-6 bg-primary hover:bg-primary/90 text-white border-0 group-hover:scale-105 transition-transform">
                               <Link href={`/tournaments/${tournament.id}`}>Unirse al Torneo <ChevronRight className="ml-2 h-4 w-4"/></Link>
                           </Button>
                       </div>
                    </Card>
                ))}
            </div>
        </div>


        {/* Feed y Actividad */}
        <div className="space-y-6">
            {/* Friend Activity Feed */}
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Rss className="text-primary h-5 w-5"/> 
                    </div>
                    <div>
                        <h3 className="text-2xl md:text-3xl font-bold">Feed de Actividad</h3>
                        <p className="text-muted-foreground">Descubre las últimas publicaciones de la comunidad</p>
                    </div>
                </div>
                {/* Crear nueva publicación */}
                <CreatePost />
                
                <div className="space-y-4">
                    {isLoading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <Card key={i} className="animate-pulse">
                                    <CardContent className="p-6">
                                        {/* Post header */}
                                        <div className="flex items-start gap-3 mb-4">
                                            <div className="h-10 w-10 bg-muted rounded-full flex-shrink-0" />
                                            <div className="flex-1 space-y-2">
                                                <div className="h-4 bg-muted rounded w-1/4" />
                                                <div className="h-3 bg-muted rounded w-1/6" />
                                            </div>
                                            <div className="h-6 w-6 bg-muted rounded" /> {/* Menu button */}
                                        </div>
                                        
                                        {/* Post content */}
                                        <div className="space-y-3 mb-4">
                                            <div className="h-4 bg-muted rounded" />
                                            <div className="h-4 bg-muted rounded w-3/4" />
                                            <div className="h-4 bg-muted rounded w-1/2" />
                                        </div>
                                        
                                        {/* Post image placeholder (sometimes) */}
                                        {i === 2 && (
                                            <div className="h-48 bg-muted rounded-lg mb-4" />
                                        )}
                                        
                                        {/* Post actions */}
                                        <div className="flex items-center justify-between pt-4 border-t">
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-5 w-5 bg-muted rounded" />
                                                    <div className="h-4 bg-muted rounded w-8" />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="h-5 w-5 bg-muted rounded" />
                                                    <div className="h-4 bg-muted rounded w-8" />
                                                </div>
                                            </div>
                                            <div className="h-5 w-5 bg-muted rounded" /> {/* Share button */}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : postsError ? (
                        <Card>
                            <CardContent className="p-8 text-center">
                                <div className="flex flex-col items-center gap-4">
                                    <div className="p-4 bg-destructive/10 rounded-full">
                                        <AlertTriangle className="h-8 w-8 text-destructive" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold mb-2 text-destructive">Error al cargar publicaciones</h3>
                                        <p className="text-muted-foreground text-sm">
                                            {postsError}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ) : posts.length > 0 ? (
                        posts.map(post => (
                            <FeedPost 
                                key={post.id} 
                                post={post}
                            />
                        ))
                    ) : (
                        <Card>
                            <CardContent className="p-8 text-center">
                                <div className="flex flex-col items-center gap-4">
                                    <div className="p-4 bg-muted rounded-full">
                                        <Rss className="h-8 w-8 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold mb-2">No hay publicaciones aún</h3>
                                        <p className="text-muted-foreground text-sm mb-4">
                                            Sé el primero en compartir algo con la comunidad
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
        
        {/* News Detail Dialog */}
        <NewsDetailDialog 
            article={selectedArticle}
            open={!!selectedArticle}
            onOpenChange={(open) => !open && setSelectedArticle(null)}
        />
    </div>
  )
}
