
"use client"

import Link from "next/link"
import Image from "next/image"
import {
  Send,
  ImageIcon,
  Sticker,
  Heart,
  MessageCircle,
  Rss
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
import { playerProfile, feedPosts } from "@/lib/data"

export default function DashboardPage() {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
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
  )
}
