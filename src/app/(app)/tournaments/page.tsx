
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
import { tournaments, playerProfile } from "@/lib/data"
import { PlusCircle, Filter } from "lucide-react"

export default function TournamentsPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Torneos</h1>
          <p className="text-muted-foreground">Encuentra y participa en competiciones.</p>
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

      <Card>
        <CardHeader>
          <CardTitle>Torneos Disponibles</CardTitle>
          <CardDescription>
            Inscríbete en los torneos abiertos o revisa los próximos eventos.
          </CardDescription>
        </CardHeader>
        <CardContent>
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
              {tournaments.map((tournament) => (
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
                    <Button size="sm" variant="outline" disabled={tournament.status !== 'Abierto'}>
                        Inscribirse
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
