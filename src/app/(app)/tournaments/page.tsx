
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
import { PlusCircle, Filter, ChevronRight } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export default function TournamentsPage() {
  const { toast } = useToast();
  
  const naTournaments = tournaments.filter(t => t.region === 'N.A.');
  const saTournaments = tournaments.filter(t => t.region === 'S.A.');
  const canCreate = playerProfile.role === 'Admin' || playerProfile.role === 'Creador';

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
            {canCreate && (
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
                  {naTournaments.map((tournament) => (
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
                           <Button asChild size="sm" variant="outline">
                              <Link href={`/tournaments/${tournament.id}`}>
                                Ver Detalles
                                <ChevronRight className="h-4 w-4 ml-2" />
                              </Link>
                           </Button>
                        </TableCell>
                      </TableRow>
                  ))}
                </TableBody>
              </Table>
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
                  {saTournaments.map((tournament) => (
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
                           <Button asChild size="sm" variant="outline">
                              <Link href={`/tournaments/${tournament.id}`}>
                                Ver Detalles
                                <ChevronRight className="h-4 w-4 ml-2" />
                              </Link>
                           </Button>
                        </TableCell>
                      </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

    