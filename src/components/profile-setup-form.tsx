"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { createUserProfile } from "@/lib/database"
import { useAuth } from "@/app/auth-provider"
import { useRouter } from "next/navigation"
import { User, Gamepad2, Globe, Calendar, Camera } from "lucide-react"
import { ImageUpload } from "@/components/image-upload"
import type { PlayerProfile } from "@/lib/types"

interface ProfileSetupFormProps {
  onComplete: () => void;
}

const servers = [
  { value: "na", label: "América del Norte" },
  { value: "sa", label: "América del Sur" },
  { value: "eu", label: "Europa" },
  { value: "asia", label: "Asia" },
  { value: "kr-jp", label: "Corea/Japón" },
  { value: "me", label: "Medio Oriente" },
];

const weapons = [
  "M416", "AKM", "SCAR-L", "M16A4", "Groza", "AUG A3",
  "Kar98k", "M24", "AWM", "Mini14", "SLR", "SKS",
  "UMP45", "Vector", "Thompson", "PP-19 Bizon",
  "S686", "S1897", "S12K", "DBS"
];

const maps = [
  { value: "erangel", label: "Erangel" },
  { value: "miramar", label: "Miramar" },
  { value: "sanhok", label: "Sanhok" },
  { value: "vikendi", label: "Vikendi" },
  { value: "livik", label: "Livik" },
  { value: "rondo", label: "Rondo" },
];

const ranks = [
  "Bronce", "Plata", "Oro", "Platino", "Diamante", "Corona", "As", "Conquistador"
];

const playSchedules = [
  "Mañana (6:00 - 12:00)",
  "Tarde (12:00 - 18:00)", 
  "Noche (18:00 - 24:00)",
  "Madrugada (00:00 - 6:00)",
  "Fines de semana",
  "Horario flexible"
];

export function ProfileSetupForm({ onComplete }: ProfileSetupFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    nickname: "",
    username: "",
    gameId: "",
    currentServer: "",
    gender: "",
    age: "",
    rank: "",
    bio: "",
    favoriteMap: "",
    playSchedule: "",
    favoriteWeapons: [] as string[],
    level: "",
    wins: "",
    kills: "",
    kdRatio: "",
    avatarUrl: "",
    coverPhotoUrl: ""
  });

  const handleWeaponToggle = (weapon: string) => {
    setFormData(prev => ({
      ...prev,
      favoriteWeapons: prev.favoriteWeapons.includes(weapon)
        ? prev.favoriteWeapons.filter(w => w !== weapon)
        : [...prev.favoriteWeapons, weapon].slice(0, 3) // Máximo 3 armas
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    
    try {
      const profileData: Partial<PlayerProfile> = {
        name: formData.nickname || formData.username,
        nickname: formData.nickname,
        username: formData.username,
        gameId: formData.gameId,
        currentServer: formData.currentServer,
        gender: formData.gender as PlayerProfile['gender'],
        age: formData.age ? parseInt(formData.age) : undefined,
        rank: formData.rank,
        bio: formData.bio,
        favoriteMap: formData.favoriteMap,
        playSchedule: formData.playSchedule,
        favoriteWeapons: formData.favoriteWeapons,
        level: formData.level ? parseInt(formData.level) : 1,
        stats: {
          kda: formData.kdRatio ? parseFloat(formData.kdRatio) : 0,
          wins: formData.wins ? parseInt(formData.wins) : 0,
          matches: 0
        },
        // Campos opcionales de compatibilidad
        kills: formData.kills ? parseInt(formData.kills) : 0,
        kdRatio: formData.kdRatio ? parseFloat(formData.kdRatio) : 0,
        role: 'Jugador' as const,
        avatarUrl: user.photoURL || 'https://placehold.co/100x100.png',
        email: user.email || '',
        location: { lat: 0, lon: 0 }, // Se puede actualizar después
        countryCode: 'MX' // Se puede obtener del país seleccionado
      };

      const result = await createUserProfile(user.uid, profileData);
      
      if (result.success) {
        toast({
          title: "¡Perfil completado!",
          description: "Tu perfil ha sido configurado exitosamente."
        });
        onComplete();
        router.push('/dashboard');
      } else {
        throw new Error('Error al crear el perfil');
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "No se pudo completar tu perfil. Inténtalo de nuevo.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">¡Completa tu perfil de jugador!</h1>
        <p className="text-muted-foreground">
          Ayúdanos a conocerte mejor para conectarte con los jugadores perfectos
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Información Personal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Información Personal
            </CardTitle>
            <CardDescription>
              Cuéntanos sobre ti como jugador
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nickname">Nickname del Juego *</Label>
              <Input
                id="nickname"
                placeholder="Tu nombre en PUBG Mobile"
                value={formData.nickname}
                onChange={(e) => setFormData(prev => ({ ...prev, nickname: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Nombre de Usuario *</Label>
              <Input
                id="username"
                placeholder="Como quieres que te conozcan"
                value={formData.username}
                onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gameId">ID del Juego *</Label>
              <Input
                id="gameId"
                placeholder="Tu ID numérico de PUBG Mobile"
                value={formData.gameId}
                onChange={(e) => setFormData(prev => ({ ...prev, gameId: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="age">Edad *</Label>
              <Input
                id="age"
                type="number"
                min="13"
                max="99"
                placeholder="Tu edad"
                value={formData.age}
                onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Género</Label>
              <Select onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona tu género" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Masculino">Masculino</SelectItem>
                  <SelectItem value="Femenino">Femenino</SelectItem>
                  <SelectItem value="Otro">Otro</SelectItem>
                  <SelectItem value="Prefiero no decir">Prefiero no decir</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Fotos de Perfil */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Fotos de Perfil
            </CardTitle>
            <CardDescription>
              Agrega tu foto de perfil y portada (opcional)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Foto de Perfil</Label>
                <div className="flex justify-center">
                  <ImageUpload
                    currentImage={formData.avatarUrl}
                    onImageChange={(imageData) => setFormData(prev => ({ ...prev, avatarUrl: imageData || "" }))}
                    type="avatar"
                  />
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Opcional - Puedes agregar tu foto después
                </p>
              </div>
              <div className="space-y-2">
                <Label>Foto de Portada</Label>
                <ImageUpload
                  currentImage={formData.coverPhotoUrl}
                  onImageChange={(imageData) => setFormData(prev => ({ ...prev, coverPhotoUrl: imageData || "" }))}
                  type="cover"
                />
                <p className="text-xs text-muted-foreground">
                  Opcional - Personaliza tu perfil con una imagen de portada
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Información del Juego */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gamepad2 className="h-5 w-5" />
              Información del Juego
            </CardTitle>
            <CardDescription>
              Detalles sobre tu experiencia en PUBG Mobile
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currentServer">Servidor Actual *</Label>
              <Select onValueChange={(value) => setFormData(prev => ({ ...prev, currentServer: value }))} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona tu servidor" />
                </SelectTrigger>
                <SelectContent>
                  {servers.map(server => (
                    <SelectItem key={server.value} value={server.value}>
                      {server.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rank">Rango Actual *</Label>
              <Select onValueChange={(value) => setFormData(prev => ({ ...prev, rank: value }))} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona tu rango" />
                </SelectTrigger>
                <SelectContent>
                  {ranks.map(rank => (
                    <SelectItem key={rank} value={rank}>
                      {rank}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="level">Nivel</Label>
              <Input
                id="level"
                type="number"
                min="1"
                max="100"
                placeholder="Tu nivel actual"
                value={formData.level}
                onChange={(e) => setFormData(prev => ({ ...prev, level: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="favoriteMap">Mapa Favorito</Label>
              <Select onValueChange={(value) => setFormData(prev => ({ ...prev, favoriteMap: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona tu mapa favorito" />
                </SelectTrigger>
                <SelectContent>
                  {maps.map(map => (
                    <SelectItem key={map.value} value={map.value}>
                      {map.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Estadísticas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Estadísticas
            </CardTitle>
            <CardDescription>
              Comparte tus estadísticas para mejores recomendaciones
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="wins">Victorias</Label>
              <Input
                id="wins"
                type="number"
                min="0"
                placeholder="Número de victorias"
                value={formData.wins}
                onChange={(e) => setFormData(prev => ({ ...prev, wins: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kills">Bajas Totales</Label>
              <Input
                id="kills"
                type="number"
                min="0"
                placeholder="Número de bajas"
                value={formData.kills}
                onChange={(e) => setFormData(prev => ({ ...prev, kills: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kdRatio">K/D Ratio</Label>
              <Input
                id="kdRatio"
                type="number"
                step="0.1"
                min="0"
                placeholder="Tu K/D ratio"
                value={formData.kdRatio}
                onChange={(e) => setFormData(prev => ({ ...prev, kdRatio: e.target.value }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Preferencias */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Preferencias de Juego
            </CardTitle>
            <CardDescription>
              Ayúdanos a encontrar compañeros compatibles
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="playSchedule">Horario de Juego</Label>
              <Select onValueChange={(value) => setFormData(prev => ({ ...prev, playSchedule: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="¿Cuándo sueles jugar?" />
                </SelectTrigger>
                <SelectContent>
                  {playSchedules.map(schedule => (
                    <SelectItem key={schedule} value={schedule}>
                      {schedule}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Armas Favoritas (máximo 3)</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {weapons.map(weapon => (
                  <div key={weapon} className="flex items-center space-x-2">
                    <Checkbox
                      id={weapon}
                      checked={formData.favoriteWeapons.includes(weapon)}
                      onCheckedChange={() => handleWeaponToggle(weapon)}
                      disabled={!formData.favoriteWeapons.includes(weapon) && formData.favoriteWeapons.length >= 3}
                    />
                    <Label htmlFor={weapon} className="text-sm">
                      {weapon}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bio">Biografía</Label>
              <Textarea
                id="bio"
                placeholder="Cuéntanos sobre tu estilo de juego, experiencia y qué buscas en un compañero de equipo..."
                value={formData.bio}
                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                className="min-h-[100px]"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center">
          <Button type="submit" size="lg" disabled={loading} className="w-full md:w-auto">
            {loading ? "Guardando..." : "Completar Perfil"}
          </Button>
        </div>
      </form>
    </div>
  );
}