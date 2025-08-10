
"use client"

import { useState, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import Autoplay from "embla-carousel-autoplay"
import {
  Send,
  ImageIcon,
  Sticker,
  Heart,
  MessageCircle,
  Rss,
  Swords,
  ChevronRight,
  ArrowRight,
  User,
  Users,
  Trophy,
  Calendar,
  Globe
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
import { playerProfile, feedPosts as initialFeedPosts, newsArticles, tournaments } from "@/lib/data"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import type { FeedPost } from "@/lib/types"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"

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
  const { toast } = useToast()
  const [feedPosts, setFeedPosts] = useState<FeedPost[]>(initialFeedPosts.map(p => ({...p, commentsList: p.commentsList || [], liked: false })));
  const [newComments, setCommentText] = useState<{[key: string]: string}>({});

  const upcomingTournaments = tournaments.filter(t => t.status === 'Abierto' || t.status === 'Próximamente').slice(0, 3);

  const plugin = useRef(
    Autoplay({ delay: 3500, stopOnInteraction: true, stopOnMouseEnter: true })
  )

  const handleLike = (postId: string) => {
    setFeedPosts(posts => posts.map(p => {
      if (p.id === postId) {
        const liked = !p.liked;
        const likes = liked ? p.likes + 1 : p.likes - 1;
        return { ...p, liked, likes };
      }
      return p;
    }));
  };

  const handleShare = () => {
    toast({
      title: "Publicación Compartida",
      description: "Has compartido esta publicación con tus amigos.",
    });
  };
  
  const handleCommentSubmit = (e: React.FormEvent<HTMLFormElement>, postId: string) => {
    e.preventDefault();
    const commentText = newComments[postId];
    if (!commentText || !commentText.trim()) return;

    const newComment = {
        author: playerProfile.name,
        text: commentText,
    };

    setFeedPosts(posts => posts.map(p => {
        if (p.id === postId) {
            return { 
                ...p, 
                commentsList: [...p.commentsList, newComment],
                comments: p.comments + 1 
            };
        }
        return p;
    }));
    
    setNewComments(prev => ({...prev, [postId]: ''}));
  };

  return (
    <div className="space-y-8">
        {/* Featured News Carousel */}
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
                         <Card className="overflow-hidden relative">
                            <Image 
                                src={article.imageUrl} 
                                alt={article.title} 
                                width={1200} height={400} 
                                className="w-full h-48 md:h-64 object-cover" 
                                data-ai-hint="gaming news splash"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                            <div className="absolute bottom-0 left-0 p-6 text-white">
                                <Badge variant="secondary" className="mb-2">{article.category}</Badge>
                                <h2 className="text-2xl md:text-3xl font-bold">{article.title}</h2>
                                <p className="text-sm md:text-base text-white/80 mt-1 max-w-2xl">{article.summary}</p>
                                <Button asChild className="mt-4">
                                    <Link href="#">Leer Más <ArrowRight className="ml-2 h-4 w-4" /></Link>
                                </Button>
                            </div>
                        </Card>
                    </CarouselItem>
                ))}
            </CarouselContent>
            <CarouselPrevious className="hidden sm:flex" />
            <CarouselNext className="hidden sm:flex" />
        </Carousel>
        
        {/* Próximos Torneos */}
        <div className="space-y-4">
            <h2 className="text-2xl font-bold flex items-center gap-2"><Swords className="text-primary"/> Próximos Torneos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {upcomingTournaments.map(tournament => (
                    <Card key={tournament.id} className={`overflow-hidden relative group transition-all hover:shadow-lg hover:-translate-y-1 ${tournamentBackgrounds[tournament.mode] || 'bg-muted/30'}`}>
                       <div className="p-6 flex flex-col justify-between h-full">
                           <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-xl font-bold">{tournament.name}</h3>
                                    <Badge variant="secondary" className="mt-1">{tournament.status}</Badge>
                                </div>
                                <div className="p-3 bg-card/80 rounded-full">
                                    {tournamentIcons[tournament.mode]}
                                </div>
                           </div>
                           <div className="space-y-3 mt-4 text-sm">
                               <p className="flex items-center gap-2"><Trophy className="h-4 w-4 text-amber-400"/> <strong>Premio:</strong> {tournament.prize}</p>
                               <p className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground"/> <strong>Fecha:</strong> {tournament.date}</p>
                               <p className="flex items-center gap-2"><Globe className="h-4 w-4 text-muted-foreground"/> <strong>Región:</strong> {tournament.region}</p>
                           </div>
                           <Button asChild className="w-full mt-6">
                               <Link href={`/tournaments/${tournament.id}`}>Ver Torneo <ChevronRight className="ml-2 h-4 w-4"/></Link>
                           </Button>
                       </div>
                    </Card>
                ))}
            </div>
        </div>


        {/* Feed y Actividad */}
        <div className="space-y-8">
            <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Rss className="text-primary"/> Feed de Actividad</CardTitle>
                <CardDescription>Comparte tus logros, da la bienvenida a {playerProfile.name} o busca nuevos compañeros de equipo.</CardDescription>
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
                            {post.commentsList && post.commentsList.length > 0 && (
                                <div className="mt-4 pt-4 border-t space-y-3">
                                    {post.commentsList.map((comment, index) => (
                                        <div key={index} className="text-sm flex items-start gap-2">
                                            <Avatar className="h-6 w-6">
                                            <AvatarImage src={comment.author === playerProfile.name ? playerProfile.avatarUrl : undefined} data-ai-hint="gaming character"/>
                                                <AvatarFallback>{comment.author.substring(0,1)}</AvatarFallback>
                                            </Avatar>
                                            <p><span className="font-semibold">{comment.author}:</span> {comment.text}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="flex flex-col items-start gap-2">
                            <div className="flex items-center gap-2">
                                <Button variant="ghost" size="sm" className="flex items-center gap-2 text-muted-foreground" onClick={() => handleLike(post.id)}>
                                    <Heart className={`h-5 w-5 ${post.liked ? 'text-red-500 fill-current' : ''}`}/> <span>{post.likes}</span>
                                </Button>
                                <Button variant="ghost" size="sm" className="flex items-center gap-2 text-muted-foreground">
                                    <MessageCircle className="h-5 w-5"/> <span>{post.comments}</span>
                                </Button>
                                <Button variant="ghost" size="sm" className="flex items-center gap-2 text-muted-foreground ml-auto" onClick={handleShare}>
                                    <Send className="h-5 w-5"/> <span>Compartir</span>
                                </Button>
                            </div>
                            <form className="w-full flex items-center gap-2 pt-2" onSubmit={(e) => handleCommentSubmit(e, post.id)}>
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={playerProfile.avatarUrl} data-ai-hint="gaming character"/>
                                    <AvatarFallback>{playerProfile.name.substring(0,1)}</AvatarFallback>
                                </Avatar>
                                <Input 
                                    placeholder="Escribe un comentario..." 
                                    className="h-9"
                                    value={newComments[post.id] || ''}
                                    onChange={(e) => setNewComments(prev => ({...prev, [post.id]: e.target.value}))}
                                />
                                <Button type="submit" size="sm" disabled={!newComments[post.id]}>Enviar</Button>
                            </form>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    </div>
  )
}

    