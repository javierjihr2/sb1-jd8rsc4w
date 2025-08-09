
"use client"

import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { feedPosts } from "@/lib/data"
import { Heart, MessageCircle, Send, ImageIcon, Sticker, Rss } from "lucide-react"

export default function FeedPage() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start max-w-6xl mx-auto">
        <div className="md:col-span-2 space-y-6">
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-2"><Rss className="h-8 w-8 text-primary" /> Feed de Actividad</h1>
                <p className="text-muted-foreground">Mantente al día con las últimas publicaciones de tus amigos.</p>
            </div>
             <Card>
                <CardHeader>
                    <CardTitle>Crear Publicación</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid w-full gap-2">
                        <Textarea placeholder="¿Qué estás pensando?" />
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
        <div className="md:col-span-1 space-y-6 sticky top-20">
            <Card>
                <CardHeader>
                    <CardTitle>Amigos Activos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {feedPosts.map(p => p.author).slice(0, 5).map(friend => (
                        <div key={friend.id} className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 relative">
                                <AvatarImage src={friend.avatarUrl} data-ai-hint="gaming character"/>
                                <AvatarFallback>{friend.name.substring(0, 2)}</AvatarFallback>
                                <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-card" />
                            </Avatar>
                             <div>
                                <p className="font-semibold">{friend.name}</p>
                                <p className="text-xs text-muted-foreground">{friend.rank}</p>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    </div>
  )
}
