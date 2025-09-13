

"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { playerProfile } from "@/lib/data"
import { updateUserProfile } from "@/lib/database"
import { useAuth } from "@/app/auth-provider"
import { getUltraPersistence } from "@/lib/ultra-persistence"
import { Edit, Camera, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { ImageUpload } from "@/components/image-upload"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { PlayerProfile } from "@/lib/types"

interface EditProfileDialogProps {
  onProfileUpdate?: (profile: Partial<PlayerProfile>) => void
}

export function EditProfileDialog({ onProfileUpdate }: EditProfileDialogProps = {}) {
  const { toast } = useToast()
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [profileData, setProfileData] = useState({
    displayName: playerProfile.displayName || playerProfile.name || "",
    username: playerProfile.username || "",
    bio: playerProfile.bio || "",
    avatarUrl: playerProfile.avatarUrl || "",
    coverPhotoUrl: playerProfile.coverPhotoUrl || "",
    region: playerProfile.region || playerProfile.countryCode || "",
    language: playerProfile.language || "es",
    mic: playerProfile.mic || false,
    roles: playerProfile.roles || [],
    rankTier: playerProfile.rankTier || playerProfile.rank || "",
    gameId: playerProfile.gameId || ""
  })

  // Load current profile using ultra-persistence
  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.uid) return
      
      try {
        const ultraPersistence = await getUltraPersistence()
        if (!ultraPersistence) {
          console.warn('Ultra persistence no disponible')
          return
        }
        const savedProfile = await ultraPersistence.loadProfile()
        
        if (savedProfile) {
          setProfileData({
            displayName: savedProfile.displayName || savedProfile.name || playerProfile.displayName || playerProfile.name || "",
            username: savedProfile.username || playerProfile.username || "",
            bio: savedProfile.bio || playerProfile.bio || "",
            avatarUrl: savedProfile.avatarUrl || playerProfile.avatarUrl || "",
            coverPhotoUrl: savedProfile.coverPhotoUrl || playerProfile.coverPhotoUrl || "",
            region: savedProfile.region || savedProfile.countryCode || playerProfile.region || playerProfile.countryCode || "",
            language: savedProfile.language || playerProfile.language || "es",
            mic: savedProfile.mic !== undefined ? savedProfile.mic : playerProfile.mic || false,
            roles: savedProfile.roles || playerProfile.roles || [],
            rankTier: savedProfile.rankTier || savedProfile.rank || playerProfile.rankTier || playerProfile.rank || "",
            gameId: savedProfile.gameId || playerProfile.gameId || ""
          })
        }
      } catch (error) {
        console.warn('Error loading profile from ultra-persistence:', error)
      }
    }

    loadProfile()
    
    // Listen for profile updates
    const handleStorageChange = (e: StorageEvent) => {
      if (user?.uid && (e.key === `profile_${user.uid}` || e.key === 'currentProfile')) {
        loadProfile()
      }
    }
    
    const handleProfileUpdate = (event: CustomEvent) => {
      const { userId } = event.detail || {}
      if (userId === user?.uid) {
        loadProfile()
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('profileUpdated', handleProfileUpdate as EventListener)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('profileUpdated', handleProfileUpdate as EventListener)
    }
  }, [user?.uid])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    
    if (!user) {
      toast({
        title: "Error",
        description: "Debes estar autenticado para actualizar tu perfil.",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    
    // Timeout para evitar que el loading se quede activo indefinidamente
    const timeoutId = setTimeout(() => {
      setIsLoading(false)
      toast({
        title: "Error de Conexión",
        description: "La operación tardó demasiado. Verifica tu conexión e inténtalo de nuevo.",
        variant: "destructive"
      })
    }, 30000) // 30 segundos timeout
    
    try {
      // Validar datos antes de enviar
      if (!profileData.displayName.trim()) {
        throw new Error('El nombre para mostrar es requerido')
      }
      if (!profileData.username.trim()) {
        throw new Error('El nombre de usuario es requerido')
      }

      console.log('🔄 Actualizando perfil para usuario:', user.uid)
      
      // Actualizar perfil en la base de datos
      const result = await updateUserProfile(user.uid, {
        displayName: profileData.displayName.trim(),
        username: profileData.username.trim(),
        bio: profileData.bio.trim(),
        avatarUrl: profileData.avatarUrl,
        coverPhotoUrl: profileData.coverPhotoUrl,
        region: profileData.region,
        language: profileData.language,
        mic: profileData.mic,
        roles: profileData.roles,
        rankTier: profileData.rankTier,
        gameId: profileData.gameId.trim(),
        // Campos de compatibilidad
        name: profileData.displayName.trim(),
        countryCode: profileData.region,
        rank: profileData.rankTier,
        updatedAt: new Date()
      })

      clearTimeout(timeoutId) // Limpiar timeout si la operación fue exitosa

      if (result.success) {
        console.log('✅ Perfil actualizado exitosamente')
        
        const timestamp = Date.now()
        const sessionId = Math.random().toString(36).substr(2, 9)
        
        const updatedProfile = {
          id: user?.uid || '',
          displayName: profileData.displayName.trim(),
          username: profileData.username.trim(),
          bio: profileData.bio.trim(),
          avatarUrl: profileData.avatarUrl,
          coverPhotoUrl: profileData.coverPhotoUrl,
          region: profileData.region,
          language: profileData.language,
          mic: profileData.mic,
          roles: profileData.roles,
          rankTier: profileData.rankTier,
          gameId: profileData.gameId.trim(),
          // Propiedades requeridas por PlayerProfile
          stats: {
            kda: 0,
            wins: 0,
            matches: 0
          },
          createdAt: new Date(),
          updatedAt: new Date(),
          // Campos de compatibilidad
          name: profileData.displayName.trim(),
          countryCode: profileData.region,
          rank: profileData.rankTier,
          lastModified: timestamp,
          lastUpdate: timestamp,
          sessionId,
          syncStatus: 'updated'
        }
        
        // Update profile using ultra-persistence for maximum reliability
        if (user?.uid) {
          
          try {
            const ultraPersistence = await getUltraPersistence()
            if (!ultraPersistence) {
              console.warn('Ultra persistence no disponible para guardar')
            } else {
              await ultraPersistence.saveProfile(updatedProfile)
            }
            
            console.log('💾 Perfil guardado con ultra-persistencia:', {
              uid: user.uid,
              timestamp,
              sessionId
            })
          } catch (persistenceError) {
            console.error('Error guardando con ultra-persistencia:', persistenceError)
          }
        }
        
        // Dispatch custom event to notify other components
        window.dispatchEvent(new CustomEvent('profileUpdated', {
          detail: {
            userId: user?.uid,
            profile: updatedProfile,
            timestamp: Date.now()
          }
        }))
        
        // Actualizar estado local
        onProfileUpdate?.(updatedProfile)
        
        toast({
          title: "Perfil Actualizado",
          description: "Tus cambios han sido guardados con éxito.",
        })
        setIsOpen(false)
      } else {
        console.error('❌ Error en la respuesta del servidor:', 'error' in result ? result.error : 'Unknown error')
        throw new Error('error' in result && result.error?.message ? result.error.message : 'Error al actualizar el perfil')
      }
    } catch (error) {
      clearTimeout(timeoutId) // Limpiar timeout en caso de error
      console.error('❌ Error updating profile:', error)
      
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      
      toast({
        title: "Error al Guardar",
        description: `No se pudieron guardar los cambios: ${errorMessage}. Inténtalo de nuevo.`,
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="mt-4 sm:mb-2 w-full sm:w-auto">
          <Edit className="mr-2 h-4 w-4" />
          Editar Perfil
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Editar Perfil</DialogTitle>
          <DialogDescription>
            Realiza cambios en tu perfil aquí. Haz clic en guardar cuando hayas terminado.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          <form onSubmit={handleSubmit}>
            <div className="grid gap-6 py-4">
              {/* Fotos de Perfil */}
              <div className="space-y-4">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  Fotos de Perfil
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Foto de Perfil</Label>
                    <div className="flex justify-center">
                      <ImageUpload
                        currentImage={profileData.avatarUrl}
                        onImageChange={(imageData) => setProfileData(prev => ({ ...prev, avatarUrl: imageData || "" }))}
                        type="avatar"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Foto de Portada</Label>
                    <ImageUpload
                      currentImage={profileData.coverPhotoUrl}
                      onImageChange={(imageData) => setProfileData(prev => ({ ...prev, coverPhotoUrl: imageData || "" }))}
                      type="cover"
                    />
                  </div>
                </div>
              </div>
              {/* Información Personal */}
              <div className="space-y-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="displayName" className="text-right">
                    Nombre para Mostrar
                  </Label>
                  <Input 
                    id="displayName" 
                    value={profileData.displayName}
                    onChange={(e) => setProfileData(prev => ({ ...prev, displayName: e.target.value }))}
                    className="col-span-3"
                    placeholder="Tu nombre visible para otros usuarios" 
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="username" className="text-right">
                    Nombre de Usuario
                  </Label>
                  <Input 
                    id="username" 
                    value={profileData.username}
                    onChange={(e) => setProfileData(prev => ({ ...prev, username: e.target.value }))}
                    className="col-span-3"
                    placeholder="Tu nombre de usuario único" 
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="gameId" className="text-right">
                    ID del Juego
                  </Label>
                  <Input 
                    id="gameId" 
                    value={profileData.gameId}
                    onChange={(e) => setProfileData(prev => ({ ...prev, gameId: e.target.value }))}
                    className="col-span-3"
                    placeholder="Tu ID numérico de PUBG Mobile" 
                  />
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="bio" className="text-right pt-2">
                    Biografía
                  </Label>
                  <Textarea 
                    id="bio" 
                    value={profileData.bio}
                    onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                    className="col-span-3"
                    placeholder="Cuéntanos sobre ti..." 
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="region" className="text-right">
                    Región
                  </Label>
                  <Select 
                    value={profileData.region}
                    onValueChange={(value) => setProfileData(prev => ({ ...prev, region: value }))}
                  >
                    <SelectTrigger id="region" className="col-span-3">
                        <SelectValue placeholder="Selecciona tu región" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="LATAM">Latinoamérica</SelectItem>
                        <SelectItem value="NA">Norteamérica</SelectItem>
                        <SelectItem value="EU">Europa</SelectItem>
                        <SelectItem value="ASIA">Asia</SelectItem>
                        <SelectItem value="OCE">Oceanía</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="language" className="text-right">
                    Idioma
                  </Label>
                  <Select 
                    value={profileData.language}
                    onValueChange={(value) => setProfileData(prev => ({ ...prev, language: value }))}
                  >
                    <SelectTrigger id="language" className="col-span-3">
                        <SelectValue placeholder="Selecciona tu idioma" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="es">Español</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="pt">Português</SelectItem>
                        <SelectItem value="fr">Français</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="mic" className="text-right">
                    Micrófono
                  </Label>
                  <Select 
                    value={profileData.mic ? "yes" : "no"}
                    onValueChange={(value) => setProfileData(prev => ({ ...prev, mic: value === "yes" }))}
                  >
                    <SelectTrigger id="mic" className="col-span-3">
                        <SelectValue placeholder="¿Tienes micrófono?" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="yes">Sí, tengo micrófono</SelectItem>
                        <SelectItem value="no">No tengo micrófono</SelectItem>
                        <SelectItem value="sometimes">A veces</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="roles" className="text-right">
                    Roles Preferidos
                  </Label>
                  <Select 
                    value={profileData.roles[0] || ""}
                    onValueChange={(value) => setProfileData(prev => ({ ...prev, roles: [value] }))}
                  >
                    <SelectTrigger id="roles" className="col-span-3">
                        <SelectValue placeholder="Selecciona tu rol preferido" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="assault">Asalto</SelectItem>
                        <SelectItem value="support">Soporte</SelectItem>
                        <SelectItem value="sniper">Francotirador</SelectItem>
                        <SelectItem value="igl">Líder (IGL)</SelectItem>
                        <SelectItem value="flex">Flexible</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="rankTier" className="text-right">
                    Rango
                  </Label>
                  <Select 
                    value={profileData.rankTier}
                    onValueChange={(value) => setProfileData(prev => ({ ...prev, rankTier: value }))}
                  >
                    <SelectTrigger id="rankTier" className="col-span-3">
                        <SelectValue placeholder="Selecciona tu rango" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="bronze">Bronce</SelectItem>
                        <SelectItem value="silver">Plata</SelectItem>
                        <SelectItem value="gold">Oro</SelectItem>
                        <SelectItem value="platinum">Platino</SelectItem>
                        <SelectItem value="diamond">Diamante</SelectItem>
                        <SelectItem value="crown">Corona</SelectItem>
                        <SelectItem value="ace">As</SelectItem>
                        <SelectItem value="conqueror">Conquistador</SelectItem>
                     </SelectContent>
                   </Select>
                 </div>
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Guardar Cambios"
                )}
              </Button>
            </DialogFooter>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
