
"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { playerProfile, ADMIN_EMAIL } from "@/lib/data"
import { User, Settings, LogOut, ShieldCheck, Moon, Sun } from "lucide-react"
import Link from "next/link"
import { useTheme } from "next-themes"
import { useAuth } from "@/app/auth-provider"
import { auth } from "@/lib/firebase"
import { signOut } from "firebase/auth"
import { useRouter } from "next/navigation"
import type { PlayerProfile } from "@/lib/types"

export function UserNav() {
  const { setTheme, theme } = useTheme()
  const { user } = useAuth()
  const router = useRouter()
  const [currentProfile, setCurrentProfile] = useState<PlayerProfile>(playerProfile)

  // Función para cargar perfil desde localStorage con múltiples fuentes
  const loadLocalProfile = (): PlayerProfile | null => {
    if (typeof window === 'undefined') return null
    try {
      const userId = user?.uid
      if (!userId) return null
      
      // Try to load from multiple sources for maximum reliability
      const keys = [
        `profile_${userId}`,
        `profile_backup_${userId}`,
        `pending_profile_${userId}`,
        'currentProfile' // Legacy fallback
      ]
      
      let mostRecentProfile = null
      let mostRecentTimestamp = 0
      
      for (const key of keys) {
        try {
          const saved = localStorage.getItem(key)
          if (saved) {
            const profile = JSON.parse(saved)
            const timestamp = profile.lastModified || profile.lastUpdate || 0
            if (timestamp > mostRecentTimestamp) {
              mostRecentTimestamp = timestamp
              mostRecentProfile = profile
            }
          }
        } catch (error) {
          console.warn(`Error loading profile from ${key}:`, error)
        }
      }
      
      return mostRecentProfile
    } catch (error) {
      console.log('Error loading profile from localStorage:', error)
      return null
    }
  }

  // Cargar perfil desde localStorage al montar el componente
  useEffect(() => {
    const localProfile = loadLocalProfile()
    if (localProfile) {
      setCurrentProfile(localProfile)
    }
  }, [user?.uid])

  // Escuchar cambios en localStorage para actualizar el perfil automáticamente
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (user?.uid && (
        e.key === `profile_${user.uid}` ||
        e.key === `profile_backup_${user.uid}` ||
        e.key === `pending_profile_${user.uid}` ||
        e.key === 'currentProfile'
      )) {
        const localProfile = loadLocalProfile()
        if (localProfile) {
          setCurrentProfile(localProfile)
        }
      }
    }

    // Listener personalizado para cambios desde la misma pestaña
    const handleCustomProfileUpdate = (event: CustomEvent) => {
      const { userId, profile } = event.detail
      if (userId === user?.uid && profile) {
        setCurrentProfile(profile)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('profileUpdated', handleCustomProfileUpdate as EventListener)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('profileUpdated', handleCustomProfileUpdate as EventListener)
    }
  }, [user?.uid])

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/login');
  }

  const userDisplayName = user?.displayName || currentProfile.name;
  const userDisplayEmail = user?.email || currentProfile.email;
  const userDisplayAvatar = user?.photoURL || currentProfile.avatarUrl || '';
  
  const isAdmin = user?.email === ADMIN_EMAIL;


  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full user-nav-trigger">
          <Avatar className="h-9 w-9">
            <AvatarImage src={userDisplayAvatar} alt={`@${userDisplayName}`} data-ai-hint="gaming character" />
            <AvatarFallback>{userDisplayName?.substring(0, 2) || 'U'}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{userDisplayName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {userDisplayEmail}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/profile">
              <User className="mr-2 h-4 w-4" />
              <span>Perfil</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/settings">
              <Settings className="mr-2 h-4 w-4" />
              <span>Ajustes</span>
            </Link>
          </DropdownMenuItem>
          {isAdmin && (
            <DropdownMenuItem asChild>
              <Link href="/admin">
                <ShieldCheck className="mr-2 h-4 w-4" />
                <span>Panel de Admin</span>
              </Link>
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
           {theme === 'dark' ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
          <span>{theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Cerrar sesión</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
