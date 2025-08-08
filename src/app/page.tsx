
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"
import { Swords, Trophy, MessageSquare } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="container mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold text-primary">
          <Icons.logo className="h-8 w-8" />
          <span className="text-xl font-bold">TeamUp: PUBG</span>
        </Link>
        <nav className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link href="/dashboard">Iniciar Sesión</Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard">Registrarse</Link>
          </Button>
        </nav>
      </header>

      <main className="flex-1">
        <section className="relative h-[60vh] md:h-[calc(100vh-5rem)] flex items-center justify-center text-center text-white">
          <Image
            src="https://placehold.co/1920x1080.png"
            alt="PUBG Mobile battle scene"
            data-ai-hint="pubg mobile battle"
            fill
            className="object-cover -z-10"
          />
          <div className="absolute inset-0 bg-black/70 -z-10" />
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl md:text-6xl font-headline font-extrabold tracking-tight leading-tight mb-4 text-shadow-lg">
              Encuentra tu Escuadra Perfecta en PUBG Mobile
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/80 max-w-3xl mx-auto mb-8">
              Conéctate con jugadores, únete a torneos y chatea con amigos. Tu próxima victoria comienza aquí.
            </p>
            <Button size="lg" asChild>
              <Link href="/dashboard">¡Empezar ahora!</Link>
            </Button>
          </div>
        </section>

        <section className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-headline font-bold text-center mb-12">
              Funcionalidades Principales
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center text-center p-6 bg-card text-card-foreground rounded-lg shadow-lg border">
                <div className="p-4 bg-primary/10 rounded-full mb-4">
                  <Swords className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Matchmaking Inteligente</h3>
                <p className="text-muted-foreground">
                  Filtra por región, nivel y modo de juego para encontrar a los compañeros de equipo ideales para ti.
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-6 bg-card text-card-foreground rounded-lg shadow-lg border">
                 <div className="p-4 bg-primary/10 rounded-full mb-4">
                  <Trophy className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Torneos y Competición</h3>
                <p className="text-muted-foreground">
                  Participa en torneos emocionantes, sigue los resultados en tiempo real y gana premios increíbles.
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-6 bg-card text-card-foreground rounded-lg shadow-lg border">
                 <div className="p-4 bg-primary/10 rounded-full mb-4">
                   <MessageSquare className="h-8 w-8 text-primary" />
                 </div>
                <h3 className="text-xl font-semibold mb-2">Chat Avanzado</h3>
                <p className="text-muted-foreground">
                  Comunícate con tus amigos y equipo a través de chats privados y grupales con soporte multimedia.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-card border-t">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} TeamUp: PUBG Mobile. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
