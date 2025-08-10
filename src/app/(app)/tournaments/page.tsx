
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
import { tournaments, playerProfile, myApprovedRegistrations } from "@/lib/data"
import { PlusCircle, Filter, ChevronRight, MessageSquare, ListVideo } from "lucide-react"
import Link from "next/link"

export default function TournamentsPage() {
  const canCreate = playerProfile.role === 'Admin' || playerProfile.role === 'Creador';
  
  const naTournaments = tournaments.filter(t => t.region === 'N.A.');
  const saTournaments = tournaments.filter(t => t.region === 'S.A.');

  const accessibleChats = tournaments.filter(t => 
    myApprovedRegistrations.some(reg => reg.tournamentId === t.id && reg.status === 'approved')
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Torneos y Salas</h1>
          <p className="text-muted-foreground">Explora torneos, inscríbete y accede a las salas de chat.</p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Filtrar
            </Button>
            {canCreate && (
              <Button asChild>
                  <Link href="/admin">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Crear Torneo
                  </Link>
              </Button>
            )}
        </div>
      </div>

      <Tabs defaultValue="explore">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="explore">Explorar Torneos</TabsTrigger>
          <TabsTrigger value="chats">Mis Salas de Chat <Badge className="ml-2">{accessibleChats.length}</Badge></TabsTrigger>
        </TabsList>
        
        <TabsContent value="explore" className="space-y-6">
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
        
        <TabsContent value="chats">
            <Card>
                <CardHeader>
                    <CardTitle>Mis Salas de Chat</CardTitle>
                    <CardDescription>Accede a los chats de los torneos en los que estás inscrito y aprobado.</CardDescription>
                </CardHeader>
                <CardContent>
                    {accessibleChats.length > 0 ? (
                        <div className="space-y-4">
                            {accessibleChats.map(tournament => (
                                <div key={tournament.id} className="p-4 bg-muted/50 rounded-lg flex items-center justify-between">
                                    <div>
                                        <h3 className="font-bold text-lg">{tournament.name}</h3>
                                        <p className="text-sm text-muted-foreground">{tournament.date} - {tournament.mode}</p>
                                    </div>
                                    <Button asChild>
                                        <Link href={`/tournaments/${tournament.id}/chat`}>
                                            <MessageSquare className="mr-2"/>
                                            Entrar a la Sala
                                        </Link>
                                    </Button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-muted-foreground py-8 border-2 border-dashed rounded-lg">
                            <ListVideo className="mx-auto h-12 w-12 mb-4" />
                            <h3 className="text-lg font-semibold">No tienes acceso a ninguna sala de chat</h3>
                            <p className="text-sm">Inscríbete a un torneo y espera la aprobación de un administrador para poder chatear.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
