
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
  Smartphone,
  Gamepad2,
  Users,
  Loader2,
  Rss,
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
import { cn } from "@/lib/utils"
import { recentChats, playerProfile } from "@/lib/data"
import { useAuth } from "../auth-provider"
import { useEffect } from "react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // if (!loading && !user) {
    //   router.push('/login');
    // }
  }, [user, loading, router]);

  const navItems = [
    { href: "/dashboard", label: "Inicio", icon: Home, badge: 0 },
    { href: "/feed", label: "Feed", icon: Rss, badge: 0 },
    { href: "/tournaments", label: "Torneos", icon: Swords, badge: 0 },
    { href: "/chats", label: "Chats", icon: MessageSquare, badge: recentChats.filter(c => c.unread).length },
    { href: "/friends", label: "Amigos", icon: Users2, badge: 0 },
    { href: "/matchmaking", label: "Buscar Equipo", icon: Search, badge: 0 },
    { href: "/loadouts", label: "Equipamiento", icon: Wrench, badge: 0 },
    { href: "/recharge", label: "Recargar UC", icon: DollarSign, badge: 0 },
    { href: "/news", label: "Noticias", icon: Newspaper, badge: 0 },
  ]
  
  const aiNavItems = [
      { href: "/player-analysis", label: "Análisis de Jugador", icon: BrainCircuit },
      { href: "/strategies", label: "Estrategias de Mapa", icon: Map },
      { href: "/compare", label: "Comparador de Dúos", icon: Users2 },
      { href: "/sensitivity", label: "Asistente de Sensibilidad", icon: Smartphone },
      { href: "/controls", label: "Generador de Controles", icon: Gamepad2 },
  ]

  if (playerProfile.isAdmin) {
    navItems.push({ href: "/admin", label: "Admin", icon: ShieldCheck, badge: 0 });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-sidebar text-sidebar-foreground md:block">
        <div className="flex h-full max-h-screen flex-col gap-4 pt-4">
          <div className="flex h-14 items-center justify-center border-b border-sidebar-border px-4 lg:h-[60px] lg:px-6">
            <Link href="/" className="flex items-center gap-2 font-semibold text-sidebar-primary">
              <Icons.logo className="h-8 w-8" />
              <span className="text-2xl">SquadUp</span>
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground transition-all hover:text-white hover:bg-sidebar-accent/20",
                    pathname === item.href ? "bg-sidebar-accent/10 text-sidebar-primary font-bold" : ""
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                  {item.badge > 0 && (
                     <Badge className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              ))}
              <div className="my-2 border-t border-sidebar-border/50" />
              <h3 className="px-3 py-2 text-xs font-semibold uppercase text-sidebar-foreground/70 tracking-wider">Copiloto IA</h3>
               {aiNavItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground transition-all hover:text-white hover:bg-sidebar-accent/20",
                    pathname === item.href ? "bg-sidebar-accent/10 text-sidebar-primary font-bold" : ""
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="mt-auto p-4">
            <Card className="bg-sidebar-background/50 border-sidebar-border/50">
              <CardHeader className="p-2 pt-0 md:p-4">
                <CardTitle className="text-white">Sistema de Soporte</CardTitle>
                <CardDescription>
                  ¿Necesitas ayuda? Contacta con nuestro equipo de soporte.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-2 pt-0 md:p-4 md:pt-0">
                <Button size="sm" className="w-full">
                  <HelpCircle className="mr-2 h-4 w-4"/>
                  Solicitar Asistencia
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 lg:h-[60px] lg:px-6 sticky top-0 z-10">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden"
              >
                <PanelLeft className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col bg-sidebar text-sidebar-foreground pt-4 border-r-0">
              <nav className="grid gap-6 text-lg font-medium">
                <Link
                  href="/"
                  className="flex items-center justify-center gap-2 text-lg font-semibold text-sidebar-primary mb-4"
                >
                  <Icons.logo className="h-6 w-6" />
                  <span className="text-2xl">SquadUp</span>
                </Link>
                {[...navItems, ...aiNavItems].map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                     className={cn(
                      "flex items-center gap-4 rounded-xl px-3 py-2 text-sidebar-foreground hover:text-white hover:bg-sidebar-accent/20",
                      pathname === item.href ? "bg-sidebar-accent/10 text-sidebar-primary font-bold" : ""
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                    {item.badge && item.badge > 0 && (
                      <Badge className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                ))}
              </nav>
              <div className="mt-auto">
                <Card className="bg-sidebar-background/50 border-sidebar-border/50">
                  <CardHeader>
                    <CardTitle className="text-white">Sistema de Soporte</CardTitle>
                    <CardDescription>
                      ¿Necesitas ayuda? Contacta con nuestro equipo de soporte.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button size="sm" className="w-full">
                      <HelpCircle className="mr-2 h-4 w-4" />
                      Solicitar Asistencia
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </SheetContent>
          </Sheet>
          <div className="w-full flex-1">
            <form>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar jugadores..."
                  className="w-full appearance-none bg-background pl-8 shadow-none md:w-2/3 lg:w-1/3"
                />
              </div>
            </form>
          </div>
          <Button variant="ghost" size="icon" className="ml-auto h-8 w-8">
              <Bell className="h-4 w-4" />
              <span className="sr-only">Toggle notifications</span>
          </Button>
          <UserNav />
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 bg-background pb-24 md:pb-8">
          {children}
        </main>
        {/* Mobile Nav */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t p-2 grid grid-cols-5 gap-1">
            {navItems.slice(0, 5).map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 p-2 rounded-lg transition-all text-muted-foreground",
                  pathname.startsWith(item.href) ? "text-primary bg-primary/10" : ""
                )}
              >
                <div className="relative">
                  <item.icon className="h-6 w-6" />
                  {item.badge > 0 && (
                     <Badge className="absolute -top-2 -right-2 flex h-4 w-4 shrink-0 items-center justify-center rounded-full p-0 text-xs bg-primary text-primary-foreground">
                      {item.badge}
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-center">{item.label}</span>
              </Link>
            ))}
        </div>
      </div>
    </div>
  );
}
