
"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { tournaments, playerProfile } from "@/lib/data"
import { PlusCircle, Filter } from "lucide-react"
import type { Tournament } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

const TournamentTable = ({ 
  tournaments,
  onRegister,
  registeredTournamentIds,
}: { 
  tournaments: Tournament[],
  onRegister: (tournament: Tournament) => void,
  registeredTournamentIds: Set<string>
}) => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Torneo</TableHead>
        <TableHead className="hidden sm:table-cell">Modo</TableHead>
        <TableHead className="hidden md:table-cell">Estado</TableHead>
        <TableHead className="text-right">Premio</TableHead>
        <TableHead className="text-right sr-only md:not-sr-only">Acción</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {tournaments.map((tournament) => {
        const isRegistered = registeredTournamentIds.has(tournament.id);
        return (
          <TableRow key={tournament.id}>
            <TableCell>
              <div className="font-medium">{tournament.name}</div>
              <div className="text-sm text-muted-foreground md:hidden">
                {tournament.mode} - {tournament.prize}
              </div>
            </TableCell>
            <TableCell className="hidden sm:table-cell">
              <Badge variant="outline">{tournament.mode}</Badge>
            </TableCell>
            <TableCell className="hidden md:table-cell">
              <Badge variant={tournament.status === "Abierto" ? "secondary" : tournament.status === "Próximamente" ? "default" : "destructive"}>{tournament.status}</Badge>
            </TableCell>
            <TableCell className="text-right text-primary font-bold hidden sm:table-cell">{tournament.prize}</TableCell>
            <TableCell className="text-right">
              <Button 
                size="sm" 
                variant={isRegistered ? "default" : "outline"}
                disabled={tournament.status !== 'Abierto' || isRegistered}
                onClick={() => onRegister(tournament)}
              >
                {isRegistered ? "Inscrito" : "Inscribirse"}
              </Button>
            </TableCell>
          </TableRow>
        )
      })}
    </TableBody>
  </Table>
);


export default function TournamentsPage() {
  const { toast } = useToast();
  const [registeredTournamentIds, setRegisteredTournamentIds] = useState(new Set<string>());

  const handleRegister = (tournament: Tournament) => {
    setRegisteredTournamentIds(prev => new Set(prev).add(tournament.id));
    toast({
      title: "¡Inscripción Exitosa!",
      description: `Te has inscrito correctamente en el torneo "${tournament.name}".`,
    })
  }

  const naTournaments = tournaments.filter(t => t.region === 'N.A.');
  const saTournaments = tournaments.filter(t => t.region === 'S.A.');

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Torneos</h1>
          <p className="text-muted-foreground">Encuentra y participa en competiciones por región.</p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Filtrar
            </Button>
            {playerProfile.isAdmin && (
              <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Crear Torneo
              </Button>
            )}
        </div>
      </div>

      <Tabs defaultValue="na">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="na">Torneos N.A.</TabsTrigger>
          <TabsTrigger value="sa">Torneos S.A.</TabsTrigger>
        </TabsList>
        <TabsContent value="na">
          <Card>
            <CardHeader>
              <CardTitle>Torneos de Norteamérica</CardTitle>
              <CardDescription>
                Compite contra los mejores jugadores de la región N.A.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TournamentTable tournaments={naTournaments} onRegister={handleRegister} registeredTournamentIds={registeredTournamentIds} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="sa">
          <Card>
            <CardHeader>
              <CardTitle>Torneos de Sudamérica</CardTitle>
              <CardDescription>
                Demuestra tu habilidad en las competiciones de la región S.A.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TournamentTable tournaments={saTournaments} onRegister={handleRegister} registeredTournamentIds={registeredTournamentIds} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
