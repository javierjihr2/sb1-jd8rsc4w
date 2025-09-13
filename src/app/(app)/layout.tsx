
"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Bell,
  Home,
  MessageSquare,
  PanelLeft,
  Search,
  Swords,
  Users2,
  HelpCircle,
  ShieldCheck,
  Newspaper,
  BrainCircuit,
  Map,
  Wrench,
  DollarSign,
  Users,
  Loader2,
  Rss,
  ImageIcon,
  Target,
  FileCode,
  Briefcase,
  Palette,
  Rocket,
  Settings,
  Star,
  Heart,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import { UserNav } from "@/components/user-nav"
import { Icons } from "@/components/icons"
import { Badge } from "@/components/ui/badge"
import { LocationStatus } from "@/components/location-status"
import { PermissionsDialog } from "@/components/permissions-dialog"
import NotificationCenter from "@/components/notifications/notification-center"
import { OfflineStatus } from "@/components/offline-status"
import { cn } from "@/lib/utils"
import { recentChats, playerProfile } from "@/lib/data"
import { useAuth } from "../auth-provider"
import { useEffect, useState } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AppTour } from "@/components/app-tour"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log('🔍 AppLayout - Verificando autenticación:', {
      user: !!user,
      loading,
      pathname: typeof window !== 'undefined' ? window.location.pathname : 'unknown'
    });
    
    // Solo redirigir si estamos seguros de que no hay usuario y no estamos cargando
    if (!loading && !user && typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      // Evitar redirecciones innecesarias si ya estamos en login o home
      if (currentPath !== '/login' && currentPath !== '/' && currentPath !== '/register') {
        console.log('🔄 AppLayout - Usuario no autenticado, redirigiendo a login desde:', currentPath);
        router.replace('/login');
      }
    }
  }, [user, loading, router]);
  
  // Mostrar loading solo por un tiempo limitado
  if (loading) {
    console.log('⏳ AppLayout - Cargando estado de autenticación...');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    );
  }
  
  // Si no hay usuario después de cargar, redirigir en lugar de bloquear
  if (!user) {
    console.log('🚫 AppLayout - Sin usuario autenticado, redirigiendo a login');
    if (typeof window !== 'undefined') {
      router.replace('/login');
    }
    return null;
  }

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent mb-4" />
          <p className="text-white text-lg">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  // Si no hay usuario autenticado, no renderizar el contenido
  if (!user) {
    return null;
  }

  const navItems = [
    { href: "/dashboard", label: "Inicio", icon: Home, badge: 0, id: 'nav-dashboard' },
    { href: "/matchmaking", label: "MATCH PUBGM", icon: Search, badge: 0, id: 'nav-matchmaking' },
    { href: "/connections", label: "Mis Conexiones", icon: Heart, badge: 0, id: 'nav-connections' },
    { href: "/tournaments", label: "Torneos", icon: Swords, badge: 0, id: 'nav-tournaments' },
    { href: "/chats", label: "Chats", icon: MessageSquare, badge: recentChats.filter(c => c.unread).length, id: 'nav-chats' },
    { href: "/services", label: "Servicios", icon: Briefcase, badge: 0, id: 'nav-services' },
    { type: 'divider', label: 'Herramientas de IA' },
    { href: "/player-analysis", label: "Análisis de Jugador", icon: BrainCircuit, id: 'nav-player-analysis' },
    { href: "/equipment", label: "Taller de Precisión", icon: Target, badge: 0, id: 'nav-equipment' },
    { href: "/sensitivities", label: "Arsenal de Sensibilidad", icon: FileCode, id: 'nav-sensitivities' },
    { href: "/play-map", label: "Estrategias de Mapas", icon: Map, id: 'nav-play-map' },
    { href: "/compare", label: "Comparador de Dúos", icon: Users, id: 'nav-compare' },
    { type: 'divider', label: 'Ecosistema' },
    { href: "/creator-hub", label: "Portal del Creador", icon: Palette, badge: 0, id: 'nav-creator-hub' },
    { href: "/creator-application", label: "Conviértete en Creador", icon: Rocket, badge: 0, id: 'nav-creator-app' },
    { href: "/subscription", label: "Suscripciones", icon: Star, badge: 0, id: 'nav-subscription' },
    { href: "/recharge", label: "Recargar UC", icon: DollarSign, badge: 0, id: 'nav-recharge' },
    { href: "/support", label: "Soporte", icon: HelpCircle, badge: 0, id: 'nav-support' },
  ];
  
  const mobileNavItems = [
     { href: "/dashboard", label: "Inicio", icon: Home, badge: 0, id: 'nav-dashboard' },
     { href: "/matchmaking", label: "Match", icon: Search, badge: 0, id: 'nav-matchmaking' },
     { href: "/connections", label: "Conexiones", icon: Heart, badge: 0, id: 'nav-connections' },
     { href: "/tournaments", label: "Torneos", icon: Swords, badge: 0, id: 'nav-tournaments' },
     { href: "/chats", label: "Chats", icon: MessageSquare, badge: recentChats.filter(c => c.unread).length, id: 'nav-chats' },
     { href: "/profile", label: "Perfil", icon: Users, badge: 0, id: 'nav-profile' },
  ]
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
    <AppTour />
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-gradient-to-b from-sidebar to-sidebar/95 text-sidebar-foreground md:block shadow-lg">
        <div className="flex h-full max-h-screen flex-col gap-4 pt-4">
          <div className="flex h-14 items-center justify-center border-b border-sidebar-border/50 px-4 lg:h-[60px] lg:px-6">
            <Link href="/" className="flex items-center gap-2 font-semibold hover:scale-105 transition-transform duration-300" id="app-logo">
                 <img src="/logo.png" alt="SquadGO Logo" className="h-12 w-12 mr-2" />
              <span className="text-2xl font-bold">
                <span className="text-yellow-400">Squad</span>
                <span className="text-white">GO</span>
              </span>
            </Link>
          </div>
          <ScrollArea className="flex-1">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4 space-y-1">
              {navItems.map((item, index) => (
                item.type === 'divider' ? (
                  <p key={index} className="px-3 pt-4 pb-2 text-xs font-semibold uppercase text-sidebar-foreground/50 border-b border-sidebar-border/30">{item.label}</p>
                ) : (
                <Link
                  key={item.label}
                  href={item.href!}
                  id={item.id}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-3 text-sidebar-foreground transition-all duration-300 hover:text-white hover:bg-sidebar-accent/30 hover:scale-105 hover:shadow-md relative",
                    pathname === item.href ? "bg-gradient-to-r from-sidebar-accent/20 to-sidebar-accent/10 text-sidebar-primary font-bold shadow-md scale-105 border-l-4 border-sidebar-primary" : ""
                  )}
                >
                  {item.icon && <item.icon className="h-5 w-5" />}
                  {item.label}
                  {item.badge! > 0 && (
                     <Badge className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md">
                      {item.badge}
                    </Badge>
                  )}
                </Link>
                )
              ))}
            </nav>
          </ScrollArea>
           <div className="mt-auto p-4 space-y-2 border-t border-sidebar-border/30">
            <LocationStatus />
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b border-border/50 bg-gradient-to-r from-background/95 to-background/80 backdrop-blur-md px-4 lg:h-[60px] lg:px-6 sticky top-0 z-10 shadow-sm">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden border-muted-foreground/20 hover:bg-muted/50 hover:border-primary/30 transition-all duration-300"
              >
                <PanelLeft className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col bg-sidebar text-sidebar-foreground pt-4 border-r-0">
              <nav className="grid gap-2 text-lg font-medium">
                <Link
                      href="/"
                      className="flex items-center justify-center gap-2 text-lg font-semibold mb-4"
                    >
                     <img src="/logo.png" alt="SquadGO Logo" className="h-16 w-16 mr-2" />
                  <span className="text-2xl font-bold">
                    <span className="text-yellow-400">Squad</span>
                    <span className="text-white">GO</span>
                  </span>
                </Link>
              </nav>
              <ScrollArea className="flex-1">
                <nav className="grid gap-4 text-base font-medium px-4">
                  {navItems.map((item, index) => (
                    item.type === 'divider' ? (
                        <p key={index} className="px-3 pt-4 pb-2 text-xs font-semibold uppercase text-sidebar-foreground/50">{item.label}</p>
                    ) : (
                    <Link
                      key={item.label}
                      href={item.href!}
                       className={cn(
                        "flex items-center gap-4 rounded-xl px-3 py-2 text-sidebar-foreground hover:text-white hover:bg-sidebar-accent/20",
                        pathname === item.href ? "bg-sidebar-accent/10 text-sidebar-primary font-bold" : ""
                      )}
                    >
                      {item.icon && <item.icon className="h-5 w-5" />}
                      {item.label}
                      {item.badge! > 0 && (
                        <Badge className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                    )
                  ))}
                </nav>
              </ScrollArea>
            </SheetContent>
          </Sheet>
          <div className="w-full flex-1">
            <form>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar jugadores, equipos, torneos..."
                  className="w-full appearance-none bg-muted/30 border-muted-foreground/20 pl-10 pr-4 py-2 rounded-xl shadow-none md:w-2/3 lg:w-1/3 focus:bg-background focus:border-primary/50 transition-all duration-300 hover:bg-muted/50"
                />
              </div>
            </form>
          </div>
          <NotificationCenter />
          <OfflineStatus />
          <UserNav />
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 bg-background pb-24 md:pb-8">
          {children}
        </main>
        {/* Mobile Nav */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-background to-background/95 border-t border-border/50 md:hidden backdrop-blur-md shadow-lg">
          <div className="grid h-16 max-w-lg grid-cols-5 mx-auto">
            {mobileNavItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "inline-flex flex-col items-center justify-center px-5 hover:bg-muted/50 group transition-all duration-300 relative",
                  pathname.startsWith(item.href) ? "text-primary" : "text-muted-foreground"
                )}
              >
                <div className={cn(
                  "p-2 rounded-xl transition-all duration-300",
                  pathname.startsWith(item.href) ? "bg-primary/10 scale-110" : "group-hover:bg-muted/50 group-hover:scale-105"
                )}>
                  <item.icon className={cn(
                    "w-5 h-5 transition-colors duration-300",
                    pathname.startsWith(item.href) ? "text-primary" : "text-muted-foreground group-hover:text-primary"
                  )} />
                  {item.badge > 0 && (
                    <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className={cn(
                  "text-xs mt-1 transition-colors duration-300",
                  pathname.startsWith(item.href) ? "text-primary font-semibold" : "text-muted-foreground group-hover:text-primary"
                )}>{item.label}</span>
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </div>
    <PermissionsDialog 
      open={false}
      onOpenChange={() => {}}
    />
    </>
  );
}
