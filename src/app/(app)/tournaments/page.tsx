
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
import { tournaments } from "@/lib/data"
import { PlusCircle, Filter } from "lucide-react"

export default function TournamentsPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Torneos</h1>
          <p className="text-muted-foreground">Encuentra y participa en competiciones.</p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Filtrar
            </Button>
            <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Crear Torneo
            </Button>
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
                <TableHead>Modo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Premio</TableHead>
                <TableHead className="text-right">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tournaments.map((tournament) => (
                <TableRow key={tournament.id}>
                  <TableCell>
                    <div className="font-medium">{tournament.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {tournament.date}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{tournament.mode}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={tournament.status === "Abierto" ? "secondary" : tournament.status === "Próximamente" ? "default" : "destructive"}>{tournament.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right text-accent font-bold">{tournament.prize}</TableCell>
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
