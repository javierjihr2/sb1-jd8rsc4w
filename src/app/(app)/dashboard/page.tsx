
import Link from "next/link"
import {
  ShieldCheck,
  Swords,
  Users2,
  ChevronRight,
  MessageSquare,
  BrainCircuit
} from "lucide-react"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { playerProfile, tournaments, recentChats } from "@/lib/data"


export default function DashboardPage() {
  return (
    <>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">¡Bienvenido a SquadUp, {playerProfile.name}!</CardTitle>
          <CardDescription className="text-base">
            Tu copiloto de IA para dominar el campo de batalla. Analiza, crea estrategias y encuentra a tu equipo perfecto.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            Esto es más que una simple aplicación; es tu centro de mando personal para llevar tu juego al siguiente nivel. Aquí tienes un resumen de lo que puedes hacer:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <h3 className="font-semibold flex items-center gap-2 mb-1"><BrainCircuit className="h-5 w-5 text-primary"/>Análisis con IA</h3>
              <p className="text-sm text-muted-foreground">Descubre tu estilo de juego, fortalezas y áreas de mejora con un análisis profundo de tus estadísticas.</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <h3 className="font-semibold flex items-center gap-2 mb-1"><Swords className="h-5 w-5 text-primary"/>Estrategias Tácticas</h3>
              <p className="text-sm text-muted-foreground">Genera planes de batalla completos para cualquier mapa y estilo de juego.</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <h3 className="font-semibold flex items-center gap-2 mb-1"><Users2 className="h-5 w-5 text-primary"/>Sinergia de Equipo</h3>
              <p className="text-sm text-muted-foreground">Compara perfiles con tus amigos para encontrar al compañero de dúo perfecto.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Victorias
            </CardTitle>
            <Users2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{playerProfile.stats.wins}</div>
            <p className="text-xs text-muted-foreground">
              +2 esta semana
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              K/D Ratio
            </CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{playerProfile.stats.kdRatio}</div>
            <p className="text-xs text-muted-foreground">
              Top 10% de jugadores
            </p>
          </CardContent>
        </Card>
          <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nivel</CardTitle>
            <Swords className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{playerProfile.level}</div>
            <p className="text-xs text-muted-foreground">
              Rango: {playerProfile.rank}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximo Torneo</CardTitle>
            <Swords className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">En 3 días</div>
              <p className="text-xs text-muted-foreground">
              PUBG Mobile Global Championship
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-row items-center">
            <div className="grid gap-2">
              <CardTitle>Torneos</CardTitle>
              <CardDescription>
                Compite por la gloria y grandes premios.
              </CardDescription>
            </div>
            <Button asChild size="sm" className="ml-auto gap-1">
              <Link href="/tournaments">
                Ver Todos
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Torneo</TableHead>
                  <TableHead className="hidden xl:table-column">
                    Modo
                  </TableHead>
                  <TableHead className="hidden xl:table-column">
                    Estado
                  </TableHead>
                  <TableHead className="text-right">Premio</TableHead>
                    <TableHead className="text-right sr-only">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tournaments.slice(0, 4).map((tournament) => (
                  <TableRow key={tournament.id}>
                    <TableCell>
                      <div className="font-medium">{tournament.name}</div>
                      <div className="hidden text-sm text-muted-foreground md:inline">
                        {tournament.date}
                      </div>
                    </TableCell>
                    <TableCell className="hidden xl:table-column">
                      <Badge variant="outline">{tournament.mode}</Badge>
                    </TableCell>
                    <TableCell className="hidden xl:table-column">
                      <Badge variant={tournament.status === "Abierto" ? "secondary" : tournament.status === "Próximamente" ? "default" : "destructive"}>{tournament.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right text-primary font-bold">{tournament.prize}</TableCell>
                    <TableCell className="text-right"><Button size="sm" variant="outline">Inscribirse</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Chats Recientes</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {recentChats.map((chat) => (
              <div key={chat.id} className="flex items-center gap-4">
                <Avatar className="hidden h-9 w-9 sm:flex">
                  <AvatarImage src={chat.avatarUrl} alt="Avatar" data-ai-hint="gaming character" />
                  <AvatarFallback>{chat.name.substring(0,2)}</AvatarFallback>
                </Avatar>
                <div className="grid gap-1">
                  <p className="text-sm font-medium leading-none">
                    {chat.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {chat.message}
                  </p>
                </div>
                {chat.unread && <div className="ml-auto h-2 w-2 rounded-full bg-primary" />}
              </div>
            ))}
          </CardContent>
          <CardFooter>
              <Button className="w-full" asChild>
                <Link href="/chats">
                  <MessageSquare className="mr-2 h-4 w-4" /> Ver todos los chats
                </Link>
              </Button>
          </CardFooter>
        </Card>
      </div>
        <Card>
        <CardHeader>
          <CardTitle>Matchmaking Inteligente</CardTitle>
          <CardDescription>Encuentra a tu compañero de equipo ideal. Filtra por región, modo y nivel.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Región" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="na">Norteamérica</SelectItem>
                <SelectItem value="eu">Europa</SelectItem>
                <SelectItem value="sa">Sudamérica</SelectItem>
                <SelectItem value="asia">Asia</SelectItem>
              </SelectContent>
            </Select>
              <Select>
              <SelectTrigger>
                <SelectValue placeholder="Modo de Juego" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="duo">Dúo</SelectItem>
                <SelectItem value="squad">Escuadra</SelectItem>
                <SelectItem value="solo">Solo</SelectItem>
              </SelectContent>
            </Select>
              <Select>
              <SelectTrigger>
                <SelectValue placeholder="Nivel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bronze">Bronce</SelectItem>
                <SelectItem value="silver">Plata</SelectItem>
                <SelectItem value="gold">Oro</SelectItem>
                <SelectItem value="platinum">Platino</SelectItem>
                <SelectItem value="diamond">Diamante</SelectItem>
                <SelectItem value="ace">As</SelectItem>
                <SelectItem value="conqueror">Conquistador</SelectItem>
              </SelectContent>
            </Select>
              <Button type="submit" className="w-full">Buscar Equipo</Button>
          </form>
        </CardContent>
      </Card>
    </>
  )
}
