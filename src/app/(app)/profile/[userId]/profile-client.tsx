"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { getUserProfile } from "@/lib/database"
import { useAuth } from "@/app/auth-provider"
import { Trophy, Shield, Swords, BarChart2, Award, Medal, MessageSquare, UserPlus, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import type { PlayerProfile } from "@/lib/types"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface Achievement {
  id: string
  title: string
  description: string
  icon: string
}

interface ProfileClientProps {
  userId: string
}

export default function ProfileClient({ userId }: ProfileClientProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [profile, setProfile] = useState<PlayerProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [achievements] = useState<Achievement[]>([
    {
      id: '1',
      title: 'Pollo para Cenar x50',
      description: 'Gana 50 partidas.',
      icon: 'trophy'
    },
    {
      id: '2',
      title: 'Experto en Asalto',
      description: '1000 bajas con rifles de asalto.',
      icon: 'swords'
    },
    {
      id: '3',
      title: 'Rango Conquistador',
      description: 'Alcanza el máximo rango.',
      icon: 'award'
    }
  ])

  const isOwnProfile = user?.uid === userId

  useEffect(() => {
    const loadUserProfile = async () => {
      if (!userId) return
      
      try {
        setLoading(true)
        const userProfile = await getUserProfile(userId)
        if (userProfile) {
          setProfile(userProfile)
        } else {
          // Si no se encuentra el perfil, redirigir al dashboard
          router.push('/dashboard')
        }
      } catch (error) {
        console.error('Error loading user profile:', error)
        router.push('/dashboard')
      } finally {
        setLoading(false)
      }
    }

    loadUserProfile()
  }, [userId, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-muted-foreground">Cargando perfil...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Perfil no encontrado</h2>
          <p className="text-muted-foreground">El perfil que buscas no existe o ha sido eliminado.</p>
          <Button asChild>
            <Link href="/dashboard">Volver al Dashboard</Link>
          </Button>
        </div>
      </div>
    )
  }

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'trophy':
        return <Trophy className="h-6 w-6" />
      case 'swords':
        return <Swords className="h-6 w-6" />
      case 'award':
        return <Award className="h-6 w-6" />
      default:
        return <Medal className="h-6 w-6" />
    }
  }

  const getRankColor = (rank: string) => {
    if (rank.includes('Bronce')) return 'bg-amber-600'
    if (rank.includes('Plata')) return 'bg-gray-400'
    if (rank.includes('Oro')) return 'bg-yellow-500'
    if (rank.includes('Platino')) return 'bg-blue-400'
    if (rank.includes('Diamante')) return 'bg-cyan-400'
    if (rank.includes('Corona')) return 'bg-purple-500'
    if (rank.includes('As')) return 'bg-red-500'
    if (rank.includes('Conquistador')) return 'bg-gradient-to-r from-yellow-400 to-red-500'
    return 'bg-gray-500'
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header con botón de volver */}
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" asChild className="mr-4">
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Perfil de Jugador</h1>
      </div>

      {/* Perfil Principal */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={profile.avatarUrl} alt={profile.name} />
              <AvatarFallback>{(profile.name || 'U').charAt(0)}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-2">
              <div className="flex items-center space-x-3">
                <h2 className="text-2xl font-bold">{profile.name}</h2>
                <Badge variant="outline" className={cn("text-white", getRankColor(profile.rank || 'Bronce'))}>
                  {profile.rank}
                </Badge>
              </div>
              
              <p className="text-muted-foreground">{profile.bio}</p>
              
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <span>Nivel {profile.level}</span>
                <span>•</span>
                <span>{profile.countryCode}</span>
                <span>•</span>
                <span>{profile.role}</span>
              </div>
            </div>
            
            {!isOwnProfile && (
              <div className="flex space-x-2">
                <Button size="sm">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Mensaje
                </Button>
                <Button size="sm" variant="outline">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Agregar
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Estadísticas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart2 className="h-5 w-5 mr-2" />
              Estadísticas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-green-600">{profile.stats.wins}</div>
                <div className="text-sm text-muted-foreground">Victorias</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-red-600">0</div>
                <div className="text-sm text-muted-foreground">Eliminaciones</div>
              </div>
            </div>
            
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{profile.stats.kda}</div>
              <div className="text-sm text-muted-foreground">K/D Ratio</div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progreso al siguiente nivel</span>
                <span>{(profile.level || 1) * 15}%</span>
              </div>
              <Progress value={(profile.level || 1) * 15} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Logros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Trophy className="h-5 w-5 mr-2" />
              Logros
            </CardTitle>
            <CardDescription>
              Logros desbloqueados recientemente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {achievements.map((achievement) => (
                <div key={achievement.id} className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                  <div className="text-yellow-500">
                    {getIconComponent(achievement.icon)}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{achievement.title}</h4>
                    <p className="text-sm text-muted-foreground">{achievement.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Información de Juego */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Información de Juego
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Armas Favoritas</h4>
              <div className="flex flex-wrap gap-2">
                {(profile.favoriteWeapons || []).map((weapon, index) => (
                  <Badge key={index} variant="secondary">{weapon}</Badge>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Horario de Juego</h4>
              <p className="text-muted-foreground">{profile.playSchedule}</p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Mapa Favorito</h4>
              <Badge variant="outline">{profile.favoriteMap}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Actividad Reciente */}
        <Card>
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Victoria en Sanhok - hace 2 horas</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Nuevo logro desbloqueado - hace 1 día</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span>Subió de nivel - hace 3 días</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}