
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Code, UserPlus, Newspaper, Check, X, Users, Swords, PlusCircle, Pencil, Trash2, LayoutDashboard, Settings, DollarSign, BarChart, BellRing, Wrench, Link as LinkIcon, KeyRound, RefreshCw, Briefcase, Star, CheckCircle, Banknote, Flag, Calendar as CalendarIcon, Clock, Info, Map, Video } from "lucide-react"
import { initialRegistrationRequests, tournaments as initialTournaments, newsArticles, friendsForComparison as initialUsers, rechargeProviders, developers, services as initialServices, creators, bankAccounts, initialTransactions, addTournament, tournaments, updateTournament, mapOptions } from "@/lib/data"
import type { RegistrationRequest, Tournament, NewsArticle, Service, UserWithRole, BankAccount, Transaction } from "@/lib/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import Image from "next/image"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format, parseISO } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"


export default function AdminPage() {
  const { toast } = useToast()
  const [requests, setRequests] = useState<RegistrationRequest[]>(initialRegistrationRequests)
  const [currentTournaments, setTournaments] = useState<Tournament[]>(initialTournaments)
  const [services, setServices] = useState<Service[]>(initialServices);
  const [users, setUsers] = useState<UserWithRole[]>(initialUsers);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  
  // State for the new service form
  const [serviceTitle, setServiceTitle] = useState("");
  const [creatorId, setCreatorId] = useState("");
  const [price, setPrice] = useState<string>("");
  const [voluntaryOptions, setVoluntaryOptions] = useState<Set<string>>(new Set());

  // State for finance withdrawal
  const [withdrawalAmount, setWithdrawalAmount] = useState<number | string>('');
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const currentBalance = transactions.reduce((acc, t) => acc + t.amount, 0);

  // State for tournament creation/editing
  const [tournamentDate, setTournamentDate] = useState<Date>();
  const [tournamentType, setTournamentType] = useState<string>('');
  const [hasStream, setHasStream] = useState(false);
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);


  const handleCreateProfile = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    toast({
      title: "Perfil Creado",
      description: "El perfil de desarrollador ha sido creado con éxito.",
    })
  }

  const handleCreateArticle = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    toast({
      title: "Artículo Creado",
      description: "El nuevo artículo de noticias ha sido publicado.",
    })
  }
  
  const handleTournamentSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const maps = [
        formData.get('t-map-1') as string,
        formData.get('t-map-2') as string,
        formData.get('t-map-3') as string,
        formData.get('t-map-4') as string,
    ].filter(Boolean);

    const tournamentData: Partial<Tournament> = {
        name: formData.get('t-name') as string,
        date: tournamentDate ? format(tournamentDate, 'yyyy-MM-dd') : undefined,
        prize: formData.get('t-prize') as string,
        mode: formData.get('t-mode') as 'Solo' | 'Dúo' | 'Escuadra',
        region: formData.get('t-region') as 'N.A.' | 'S.A.',
        type: tournamentType as any,
        description: formData.get('t-description') as string,
        maxTeams: parseInt(formData.get('t-max-teams') as string),
        startTime: formData.get('t-time') as string,
        timeZone: formData.get('t-timezone') as string,
        infoSendTime: formData.get('t-info-send-time') as string,
        maps: maps,
        streamLink: hasStream ? (formData.get('t-stream-link') as string) : undefined,
    };
    
    if (editingTournament) {
        // Update existing tournament
        updateTournament(editingTournament.id, tournamentData);
        toast({
            title: "Torneo Actualizado",
            description: `El torneo "${tournamentData.name}" ha sido actualizado.`,
        });
        // Dispatch event to notify other components, like the chat
        window.dispatchEvent(new Event('tournamentUpdated'));
        toast({
            title: "Notificación Enviada",
            description: `Se envió un mensaje de actualización al chat del torneo.`,
        });

    } else {
        // Create new tournament
        const newTournament: Tournament = {
            id: `t${Date.now()}`,
            ...tournamentData,
            status: 'Próximamente',
        } as Tournament;
        
        addTournament(newTournament);
        toast({
          title: "Torneo Creado",
          description: `El torneo "${newTournament.name}" ha sido añadido a la lista.`,
        });
    }
    
    setTournaments([...tournaments]); // Force re-render

    // Reset form and modals
    (event.target as HTMLFormElement).reset();
    setTournamentDate(undefined);
    setTournamentType('');
    setHasStream(false);
    setEditingTournament(null);
    setIsEditModalOpen(false);
  }

  const openEditModal = (tournament: Tournament) => {
    setEditingTournament(tournament);
    setTournamentDate(tournament.date ? parseISO(tournament.date) : undefined);
    setTournamentType(tournament.type);
    setHasStream(!!tournament.streamLink);
    setIsEditModalOpen(true);
  }

  const handleCreateService = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const selectedCreator = creators.find(c => c.id === creatorId);

    if (!selectedCreator) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Por favor, selecciona un creador válido.",
        });
        return;
    }

    const newService: Service = {
        id: `s${services.length + 1}`,
        creatorId: selectedCreator.id,
        creatorName: selectedCreator.name,
        uid: formData.get('s-uid') as string,
        serviceTitle: serviceTitle,
        description: formData.get('s-description') as string,
        price: parseFloat(price) || 0,
        voluntaryOptions: price === "0" ? Array.from(voluntaryOptions) : [],
        rating: 0,
        reviews: 0,
        isVerified: false,
        isFeatured: false,
    };
    setServices(prev => [...prev, newService]);
    toast({
      title: "Servicio Creado",
      description: `El servicio "${newService.serviceTitle}" ha sido añadido.`,
    });
    
    // Reset form state
    (event.target as HTMLFormElement).reset();
    setServiceTitle("");
    setCreatorId("");
    setPrice("");
    setVoluntaryOptions(new Set());
  }

  const handleVoluntaryOptionChange = (option: string, checked: boolean) => {
    setVoluntaryOptions(prev => {
        const newSet = new Set(prev);
        if (checked) {
            newSet.add(option);
        } else {
            newSet.delete(option);
        }
        return newSet;
    });
  }
  
  const handleSaveSettings = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    toast({
      title: "Ajustes Guardados",
      description: "Las configuraciones globales de la aplicación han sido actualizadas.",
    })
  }

  const handleRequest = (requestId: string, status: "Aprobado" | "Rechazado") => {
    setRequests(prev => prev.map(req => req.id === requestId ? { ...req, status } : req))
    toast({
        title: `Solicitud ${status}`,
        description: `El equipo ha sido ${status.toLowerCase()} para el torneo.`,
    })
    
     if (status === 'Aprobado') {
        window.dispatchEvent(new Event('tournamentUpdated'));
        toast({
            title: "Notificación Enviada",
            description: `Se envió un mensaje de actualización al chat del torneo con el nuevo equipo.`,
        });
    }
  }
  
  const handleWithdrawal = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const amount = parseFloat(withdrawalAmount as string);

    if (!amount || amount <= 0) {
      toast({ variant: 'destructive', title: 'Monto Inválido', description: 'Por favor, introduce un monto válido para retirar.' });
      return;
    }
    if (amount > currentBalance) {
      toast({ variant: 'destructive', title: 'Saldo Insuficiente', description: 'No puedes retirar más de lo que tienes en tu saldo disponible.' });
      return;
    }
    if (!selectedAccount) {
      toast({ variant: 'destructive', title: 'Cuenta no Seleccionada', description: 'Por favor, selecciona una cuenta bancaria para el retiro.' });
      return;
    }

    const accountDetails = bankAccounts.find(acc => acc.id === selectedAccount);

    // Simulate withdrawal
    const newTransaction: Transaction = {
        id: `txn-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        description: `Retiro a ${accountDetails?.bankName} (CTA: ...${accountDetails?.accountNumber.slice(-4)})`,
        amount: -amount,
        type: 'Retiro',
    };
    setTransactions(prev => [newTransaction, ...prev]);

    toast({
      title: 'Retiro Procesado',
      description: `Se ha iniciado la transferencia de $${amount.toFixed(2)} a tu cuenta. Puede tardar de 2 a 3 días hábiles en reflejarse.`,
    });
    
    // Reset form
    setWithdrawalAmount('');
    setSelectedAccount('');
  };

  const TournamentForm = ({ onSubmit, defaultValues }: { onSubmit: (e: React.FormEvent<HTMLFormElement>) => void, defaultValues?: Tournament | null }) => (
    <form onSubmit={onSubmit}>
        <CardContent className="grid gap-4 max-h-[70vh] overflow-y-auto p-6">
            <div className="space-y-2">
                <Label htmlFor="t-name">Nombre del Torneo</Label>
                <Input id="t-name" name="t-name" placeholder="Ej: Copa de Verano" defaultValue={defaultValues?.name} required />
            </div>
            <div className="space-y-2">
                <Label htmlFor="t-type">Tipo de Torneo</Label>
                <Select name="t-type" onValueChange={setTournamentType} defaultValue={defaultValues?.type || tournamentType} required>
                    <SelectTrigger id="t-type"><SelectValue placeholder="Selecciona un tipo" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="competitivo">Competitivo</SelectItem>
                        <SelectItem value="scrim">Scrim (Práctica)</SelectItem>
                        <SelectItem value="puntos">Por Puntos</SelectItem>
                        <SelectItem value="wow">Evento WOW</SelectItem>
                        <SelectItem value="amistoso">Amistoso</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label htmlFor="t-date">Fecha del Torneo</Label>
                    <Popover>
                    <PopoverTrigger asChild>
                    <Button
                        variant={"outline"}
                        className={cn(
                        "w-full justify-start text-left font-normal",
                        !tournamentDate && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {tournamentDate ? format(tournamentDate, "PPP") : <span>Elige una fecha</span>}
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                    <Calendar
                        mode="single"
                        selected={tournamentDate}
                        onSelect={setTournamentDate}
                        initialFocus
                    />
                    </PopoverContent>
                </Popover>
            </div>
            {(tournamentType === 'competitivo' || tournamentType === 'scrim' || tournamentType === 'wow') && (
                <>
                    <div className="grid grid-cols-2 gap-4 animate-in fade-in-50">
                        <div className="space-y-2">
                            <Label htmlFor="t-time">Hora de Inicio</Label>
                            <Input id="t-time" name="t-time" type="time" defaultValue={defaultValues?.startTime} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="t-timezone">Zona Horaria</Label>
                            <Select name="t-timezone" defaultValue={defaultValues?.timeZone} required>
                                <SelectTrigger id="t-timezone"><SelectValue placeholder="País" /></SelectTrigger>
                                <SelectContent className="max-h-60">
                                    <SelectGroup>
                                        <Label className="px-2 py-1.5 text-xs font-semibold">Norteamérica</Label>
                                        <SelectItem value="US">Estados Unidos</SelectItem>
                                        <SelectItem value="CA">Canadá</SelectItem>
                                        <SelectItem value="MX">México</SelectItem>
                                    </SelectGroup>
                                    <SelectGroup>
                                        <Label className="px-2 py-1.5 text-xs font-semibold">Centroamérica</Label>
                                        <SelectItem value="GT">Guatemala</SelectItem>
                                        <SelectItem value="BZ">Belice</SelectItem>
                                        <SelectItem value="SV">El Salvador</SelectItem>
                                        <SelectItem value="HN">Honduras</SelectItem>
                                        <SelectItem value="NI">Nicaragua</SelectItem>
                                        <SelectItem value="CR">Costa Rica</SelectItem>
                                        <SelectItem value="PA">Panamá</SelectItem>
                                    </SelectGroup>
                                    <SelectGroup>
                                        <Label className="px-2 py-1.5 text-xs font-semibold">Caribe</Label>
                                        <SelectItem value="CU">Cuba</SelectItem>
                                        <SelectItem value="DO">Rep. Dominicana</SelectItem>
                                        <SelectItem value="PR">Puerto Rico</SelectItem>
                                        <SelectItem value="JM">Jamaica</SelectItem>
                                        <SelectItem value="HT">Haití</SelectItem>
                                        <SelectItem value="BS">Bahamas</SelectItem>
                                    </SelectGroup>
                                        <SelectGroup>
                                        <Label className="px-2 py-1.5 text-xs font-semibold">Sudamérica</Label>
                                        <SelectItem value="CO">Colombia</SelectItem>
                                        <SelectItem value="VE">Venezuela</SelectItem>
                                        <SelectItem value="GY">Guyana</SelectItem>
                                        <SelectItem value="SR">Surinam</SelectItem>
                                        <SelectItem value="EC">Ecuador</SelectItem>
                                        <SelectItem value="PE">Perú</SelectItem>
                                        <SelectItem value="BR">Brasil</SelectItem>
                                        <SelectItem value="BO">Bolivia</SelectItem>
                                        <SelectItem value="PY">Paraguay</SelectItem>
                                        <SelectItem value="CL">Chile</SelectItem>
                                        <SelectItem value="AR">Argentina</SelectItem>
                                        <SelectItem value="UY">Uruguay</SelectItem>
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="space-y-2 animate-in fade-in-50">
                        <Label>Horario de envío de información</Label>
                        <Select name="t-info-send-time" defaultValue={defaultValues?.infoSendTime}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar cuándo se envían los códigos"/>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="7">7 minutos antes del inicio</SelectItem>
                                <SelectItem value="10">10 minutos antes del inicio</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground flex items-center gap-1"><Info className="h-3 w-3"/>El sistema notificará a los participantes con los datos de la sala en el momento elegido.</p>
                    </div>
                </>
            )}
            <div className="space-y-2">
                <Label htmlFor="t-prize">Premio</Label>
                <Input id="t-prize" name="t-prize" placeholder="Ej: $1,000 USD o 'Premios en UC'" defaultValue={defaultValues?.prize} required />
            </div>
            
            {(tournamentType === 'competitivo' || tournamentType === 'scrim' || tournamentType === 'wow') && (
                <div className="space-y-4 p-4 border rounded-lg animate-in fade-in-50">
                    <Label className="font-semibold flex items-center gap-2"><Map className="h-5 w-5 text-primary"/> Selección de Mapas</Label>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="t-map-1">Mapa 1</Label>
                             <Select name="t-map-1" defaultValue={defaultValues?.maps?.[0]}>
                                <SelectTrigger><SelectValue placeholder="Seleccionar mapa"/></SelectTrigger>
                                <SelectContent>
                                    {mapOptions.map(m => <SelectItem key={m.value} value={m.label}>{m.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="t-map-2">Mapa 2</Label>
                             <Select name="t-map-2" defaultValue={defaultValues?.maps?.[1]}>
                                <SelectTrigger><SelectValue placeholder="Seleccionar mapa"/></SelectTrigger>
                                <SelectContent>
                                    {mapOptions.map(m => <SelectItem key={m.value} value={m.label}>{m.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="t-map-3">Mapa 3</Label>
                             <Select name="t-map-3" defaultValue={defaultValues?.maps?.[2]}>
                                <SelectTrigger><SelectValue placeholder="Seleccionar mapa"/></SelectTrigger>
                                <SelectContent>
                                    {mapOptions.map(m => <SelectItem key={m.value} value={m.label}>{m.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="t-map-4">Mapa 4 (Opcional)</Label>
                             <Select name="t-map-4" defaultValue={defaultValues?.maps?.[3]}>
                                <SelectTrigger><SelectValue placeholder="Seleccionar mapa"/></SelectTrigger>
                                <SelectContent>
                                    {mapOptions.map(m => <SelectItem key={m.value} value={m.label}>{m.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            )}
            
            <div className="space-y-2">
                <Label htmlFor="t-max-teams">Máximo de Equipos</Label>
                <Input id="t-max-teams" name="t-max-teams" type="number" placeholder="Ej: 64" defaultValue={defaultValues?.maxTeams} required />
            </div>
            <div className="space-y-2">
                <Label htmlFor="t-mode">Modo</Label>
                <Select name="t-mode" defaultValue={defaultValues?.mode} required>
                    <SelectTrigger id="t-mode"><SelectValue placeholder="Selecciona un modo" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Solo">Solo</SelectItem>
                        <SelectItem value="Dúo">Dúo</SelectItem>
                        <SelectItem value="Escuadra">Escuadra</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label htmlFor="t-region">Región</Label>
                <Select name="t-region" defaultValue={defaultValues?.region} required>
                    <SelectTrigger id="t-region"><SelectValue placeholder="Selecciona una región" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="N.A.">Norteamérica</SelectItem>
                        <SelectItem value="S.A.">Sudamérica</SelectItem>
                    </SelectContent>
                </Select>
            </div>
             <div className="space-y-2">
                <Label htmlFor="t-description">Reglas y Descripción</Label>
                <Textarea id="t-description" name="t-description" placeholder="Describe el formato del torneo, sistema de puntos, reglas de conducta, etc." defaultValue={defaultValues?.description}/>
            </div>
             <div className="space-y-4 p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                    <Label htmlFor="has-stream" className="flex items-center gap-2 font-semibold"><Video className="h-5 w-5 text-primary"/>¿Habrá Transmisión en Vivo?</Label>
                    <Switch id="has-stream" checked={hasStream} onCheckedChange={setHasStream} />
                </div>
                {hasStream && (
                    <div className="space-y-2 animate-in fade-in-50">
                        <Label htmlFor="t-stream-link">Enlace de la Transmisión</Label>
                        <Input id="t-stream-link" name="t-stream-link" placeholder="https://twitch.tv/..." defaultValue={defaultValues?.streamLink} />
                    </div>
                )}
            </div>
        </CardContent>
        <CardFooter>
            <Button type="submit" className="w-full">{defaultValues ? "Guardar Cambios" : "Crear Torneo"}</Button>
        </CardFooter>
    </form>
  )

  return (
    <div className="space-y-8">
       <div>
          <h1 className="text-3xl font-bold">Panel de Administración</h1>
          <p className="text-muted-foreground">Gestiona los perfiles, solicitudes y configuraciones de la aplicación.</p>
        </div>
      
       <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-7">
            <TabsTrigger value="dashboard"><LayoutDashboard className="mr-2"/>Dashboard</TabsTrigger>
            <TabsTrigger value="users"><Users className="mr-2"/>Usuarios</TabsTrigger>
            <TabsTrigger value="tournaments"><Swords className="mr-2"/>Torneos</TabsTrigger>
            <TabsTrigger value="services"><Briefcase className="mr-2"/>Servicios</TabsTrigger>
            <TabsTrigger value="finances"><DollarSign className="mr-2"/>Finanzas</TabsTrigger>
            <TabsTrigger value="news"><Newspaper className="mr-2"/>Noticias</TabsTrigger>
            <TabsTrigger value="settings"><Settings className="mr-2"/>Ajustes</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard" className="mt-6">
            <Card>
                <CardHeader>
                    <CardTitle>Dashboard</CardTitle>
                    <CardDescription>Una vista general y rápida del estado de la aplicación.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total de Usuarios</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{users.length}</div>
                            <p className="text-xs text-muted-foreground">+5% que el mes pasado</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Torneos Activos</CardTitle>
                            <Swords className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{tournaments.filter(t => t.status === 'Abierto').length}</div>
                            <p className="text-xs text-muted-foreground">{tournaments.length} torneos en total</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Ingresos del Mes</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">${currentBalance.toFixed(2)}</div>
                             <p className="text-xs text-muted-foreground">Basado en Suscripciones</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Solicitudes Pendientes</CardTitle>
                            <BarChart className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{requests.filter(r => r.status === 'Pendiente').length}</div>
                            <p className="text-xs text-muted-foreground">{requests.length} solicitudes en total</p>
                        </CardContent>
                    </Card>
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="users" className="mt-6">
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2 space-y-8">
                     <Card>
                        <CardHeader>
                            <CardTitle>Gestionar Usuarios</CardTitle>
                            <CardDescription>Busca, edita o elimina perfiles de usuario.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Usuario</TableHead>
                                        <TableHead>Rango</TableHead>
                                        <TableHead>Rol</TableHead>
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={user.avatarUrl} />
                                                    <AvatarFallback>{user.name.substring(0,2)}</AvatarFallback>
                                                </Avatar>
                                                <span className="font-medium">{user.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{user.rank}</TableCell>
                                         <TableCell>
                                            <Badge variant={user.role === 'Admin' ? 'destructive' : user.role === 'Creador' ? 'default' : 'outline'}>
                                                {user.role}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button size="sm" variant="outline" className="mr-2"><Pencil className="h-4 w-4 mr-1"/>Editar</Button>
                                            <Button size="sm" variant="destructive"><Trash2 className="h-4 w-4 mr-1"/>Eliminar</Button>
                                        </TableCell>
                                    </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
                 <div className="lg:col-span-1 space-y-8">
                    <Card>
                        <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <UserPlus className="h-5 w-5 text-primary" />
                            Crear Perfil
                        </CardTitle>
                        <CardDescription>
                            Añade un nuevo perfil con un rol específico al sistema.
                        </CardDescription>
                        </CardHeader>
                        <form onSubmit={handleCreateProfile}>
                        <CardContent className="grid gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nombre de Usuario</Label>
                                <Input id="name" placeholder="Ej: SuperDev" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Correo Electrónico</Label>
                                <Input id="email" type="email" placeholder="dev@example.com" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="role">Rol</Label>
                                <Select required>
                                    <SelectTrigger id="role">
                                        <SelectValue placeholder="Selecciona un rol" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="player">Jugador</SelectItem>
                                        <SelectItem value="creator">Creador de Contenido</SelectItem>
                                        <SelectItem value="developer">Desarrollador</SelectItem>
                                        <SelectItem value="admin">Administrador</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" className="w-full">
                            Crear Perfil
                            </Button>
                        </CardFooter>
                        </form>
                    </Card>
                 </div>
             </div>
        </TabsContent>

        <TabsContent value="tournaments" className="mt-6">
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2 space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5 text-primary" />
                                Gestionar Solicitudes de Torneos
                            </CardTitle>
                            <CardDescription>
                                Acepta o rechaza las solicitudes de inscripción a torneos.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {requests.map(request => (
                                <div key={request.id} className="p-4 bg-muted/50 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                    <div className="flex-1">
                                         <div className="flex items-center gap-2">
                                            {request.countryCode && (
                                                <Image 
                                                    src={`https://flagsapi.com/${request.countryCode}/shiny/64.png`}
                                                    alt={`${request.countryCode} flag`}
                                                    width={24}
                                                    height={18}
                                                    className="rounded-sm"
                                                />
                                            )}
                                            <p className="font-bold text-lg">{request.teamName} <span className="text-sm text-muted-foreground font-normal">[{request.teamTag}]</span></p>
                                        </div>
                                        <p className="text-sm text-muted-foreground mt-1">Para: {request.tournamentName}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <div className="relative h-10 w-10">
                                                <Avatar className="h-10 w-10 rounded-full ring-2 ring-background">
                                                    <AvatarImage src={request.players[0].avatarUrl} data-ai-hint="gaming character"/>
                                                    <AvatarFallback>{request.players[0].name.substring(0,1)}</AvatarFallback>
                                                </Avatar>
                                                <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                                                    +3
                                                </div>
                                            </div>
                                             <div className="text-sm">
                                                <p className="font-semibold">Inscrito por:</p>
                                                <p className="text-muted-foreground">{request.players[0].name}</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="sm:text-right">
                                        {request.status === 'Pendiente' ? (
                                            <div className="flex gap-2">
                                                <Button size="sm" onClick={() => handleRequest(request.id, 'Aprobado')}>
                                                    <Check className="h-4 w-4 mr-1"/>Aprobar
                                                </Button>
                                                <Button size="sm" variant="destructive" onClick={() => handleRequest(request.id, 'Rechazado')}>
                                                    <X className="h-4 w-4 mr-1"/>Rechazar
                                                </Button>
                                            </div>
                                        ) : (
                                            <p className={`font-semibold ${request.status === 'Aprobado' ? 'text-green-600' : 'text-red-600'}`}>
                                                Estado: {request.status}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {requests.filter(r => r.status === 'Pendiente').length === 0 && (
                                <p className="text-sm text-center text-muted-foreground py-4">No hay solicitudes pendientes.</p>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Swords className="h-5 w-5 text-primary" />
                                Gestionar Torneos
                            </CardTitle>
                            <CardDescription>
                                Edita o cancela torneos existentes.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {currentTournaments.map(tournament => (
                                <div key={tournament.id} className="p-4 bg-muted/50 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                    <div>
                                        <p className="font-bold">{tournament.name}</p>
                                        <p className="text-sm text-muted-foreground">{tournament.date} - {tournament.mode} - {tournament.region}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="outline" onClick={() => openEditModal(tournament)}><Pencil className="h-4 w-4 mr-1"/>Editar</Button>
                                        <Button size="sm" variant="destructive"><Trash2 className="h-4 w-4 mr-1"/>Cancelar</Button>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-1 space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><PlusCircle className="h-5 w-5 text-primary"/> Crear Torneo</CardTitle>
                            <CardDescription>Rellena los detalles para configurar un nuevo evento.</CardDescription>
                        </CardHeader>
                        <TournamentForm onSubmit={handleTournamentSubmit}/>
                    </Card>
                </div>
            </div>
        </TabsContent>

        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Editar Torneo</DialogTitle>
                    <DialogDescription>
                        Modifica los detalles del torneo. Los cambios se guardarán inmediatamente.
                    </DialogDescription>
                </DialogHeader>
                <TournamentForm onSubmit={handleTournamentSubmit} defaultValues={editingTournament}/>
            </DialogContent>
        </Dialog>


        <TabsContent value="services" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2 space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Gestionar Servicios de Creadores</CardTitle>
                            <CardDescription>Edita, verifica o elimina los servicios ofrecidos en la aplicación.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Servicio</TableHead>
                                        <TableHead>Creador</TableHead>
                                        <TableHead>Estado</TableHead>
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {services.map((service) => (
                                    <TableRow key={service.id}>
                                        <TableCell>
                                            <div className="font-medium">{service.serviceTitle}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {service.price > 0 ? `$${service.price.toFixed(2)}` : 'Gratis'}
                                            </div>
                                        </TableCell>
                                        <TableCell>{service.creatorName}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {service.isVerified && <Badge variant="secondary"><CheckCircle className="mr-1 h-3 w-3"/> Verificado</Badge>}
                                                {service.isFeatured && <Badge className="bg-amber-400 text-amber-900 hover:bg-amber-400/80"><Star className="mr-1 h-3 w-3"/> Destacado</Badge>}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button size="sm" variant="outline" className="mr-2"><Pencil className="h-4 w-4"/></Button>
                                            <Button size="sm" variant="destructive"><Trash2 className="h-4 w-4"/></Button>
                                        </TableCell>
                                    </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-1 space-y-8">
                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><PlusCircle className="h-5 w-5 text-primary"/> Añadir Servicio</CardTitle>
                            <CardDescription>Crea una nueva oferta de servicio en el Centro de Creadores.</CardDescription>
                        </CardHeader>
                        <form onSubmit={handleCreateService}>
                            <CardContent className="grid gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="s-creatorId">Nombre del Creador</Label>
                                    <Select onValueChange={setCreatorId} value={creatorId} required>
                                        <SelectTrigger id="s-creatorId">
                                            <SelectValue placeholder="Selecciona un creador" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {creators.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="s-uid">UID del Jugador</Label>
                                    <Input id="s-uid" name="s-uid" placeholder="5123456789" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="s-serviceTitle">Título del Servicio</Label>
                                     <Select onValueChange={setServiceTitle} value={serviceTitle} required>
                                        <SelectTrigger id="s-serviceTitle">
                                            <SelectValue placeholder="Selecciona un tipo de servicio" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Coaching de Puntería y Estrategia">Coaching de Puntería y Estrategia</SelectItem>
                                            <SelectItem value="Compañero Profesional para Dúos/Squads">Compañero Profesional para Dúos/Squads</SelectItem>
                                            <SelectItem value="Análisis de Partidas de Torneo">Análisis de Partidas de Torneo</SelectItem>
                                            <SelectItem value="IGL (In-Game Leader) para tu Squad">IGL (In-Game Leader) para tu Squad</SelectItem>
                                            <SelectItem value="Entrenamiento de Control de Retroceso (Recoil)">Entrenamiento de Control de Retroceso (Recoil)</SelectItem>
                                            <SelectItem value="Optimización de Sensibilidad y Controles (HUD)">Optimización de Sensibilidad y Controles (HUD)</SelectItem>
                                            <SelectItem value="Entrenamiento de Rotaciones y Posicionamiento">Entrenamiento de Rotaciones y Posicionamiento</SelectItem>
                                            <SelectItem value="Gestión y Creación de Equipos de Torneo">Gestión y Creación de Equipos de Torneo</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="s-description">Descripción</Label>
                                    <Textarea id="s-description" name="s-description" placeholder="Describe el servicio en detalle..." required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="s-price">Precio (USD)</Label>
                                    <Input 
                                        id="s-price" 
                                        name="s-price"
                                        type="number"
                                        step="0.01" 
                                        placeholder='Ej: 25.00 (0 para gratis)' 
                                        value={price}
                                        onChange={(e) => setPrice(e.target.value)}
                                        required 
                                    />
                                </div>

                                {price === '0' && (
                                    <div className="space-y-4 p-4 border rounded-lg bg-muted/50 animate-in fade-in-50">
                                        <Label className="font-semibold">Opciones de Intercambio Voluntario</Label>
                                        <div className="space-y-2">
                                            {[
                                                {id: 'pop', label: 'Intercambio de Popularidad'},
                                                {id: 'uc', label: 'Regalos UC'},
                                                {id: 'friend', label: 'Agregar como Amigo'},
                                                {id: 'social', label: 'Soporte en Redes Sociales'},
                                            ].map(opt => (
                                                <div key={opt.id} className="flex items-center space-x-2">
                                                    <Checkbox 
                                                        id={`opt-${opt.id}`} 
                                                        onCheckedChange={(checked) => handleVoluntaryOptionChange(opt.label, checked as boolean)}
                                                    />
                                                    <label htmlFor={`opt-${opt.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                                        {opt.label}
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                            <CardFooter>
                                <Button type="submit" className="w-full">Añadir Servicio</Button>
                            </CardFooter>
                        </form>
                    </Card>
                </div>
            </div>
        </TabsContent>

        <TabsContent value="finances" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2 space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Historial de Transacciones</CardTitle>
                            <CardDescription>Un registro de todos los ingresos y retiros de la plataforma.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead>Descripción</TableHead>
                                        <TableHead>Tipo</TableHead>
                                        <TableHead className="text-right">Monto</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {transactions.map(t => (
                                         <TableRow key={t.id}>
                                            <TableCell>{t.date}</TableCell>
                                            <TableCell>{t.description}</TableCell>
                                            <TableCell><Badge variant={t.type === 'Ingreso' ? 'secondary' : 'destructive'}>{t.type}</Badge></TableCell>
                                            <TableCell className={`text-right font-medium ${t.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {t.amount > 0 ? '+' : ''}${t.amount.toFixed(2)}
                                            </TableCell>
                                         </TableRow>
                                    ))}
                                </TableBody>
                             </Table>
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-1 space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Resumen Financiero</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-4 rounded-lg border bg-card flex justify-between items-center">
                                <div>
                                    <p className="text-sm text-muted-foreground">Saldo Disponible</p>
                                    <p className="text-2xl font-bold">${currentBalance.toFixed(2)}</p>
                                </div>
                                <Banknote className="h-8 w-8 text-primary"/>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <Card className="p-3">
                                    <p className="text-xs text-muted-foreground">Ingresos (Mes)</p>
                                    <p className="text-lg font-bold">${transactions.filter(t=>t.amount > 0).reduce((acc, t) => acc + t.amount, 0).toFixed(2)}</p>
                                </Card>
                                 <Card className="p-3">
                                    <p className="text-xs text-muted-foreground">Suscripciones Activas</p>
                                    <p className="text-lg font-bold">{creators.length}</p>
                                </Card>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Retirar Fondos</CardTitle>
                            <CardDescription>Transfiere tu saldo disponible a tu cuenta bancaria.</CardDescription>
                        </CardHeader>
                        <form onSubmit={handleWithdrawal}>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="withdrawal-amount">Monto a Retirar (USD)</Label>
                                    <Input 
                                        id="withdrawal-amount" 
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={withdrawalAmount}
                                        onChange={e => setWithdrawalAmount(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="bank-account">Cuenta de Destino</Label>
                                    <Select onValueChange={setSelectedAccount} value={selectedAccount}>
                                        <SelectTrigger id="bank-account">
                                            <SelectValue placeholder="Selecciona una cuenta" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {bankAccounts.map(account => (
                                                <SelectItem key={account.id} value={account.id}>
                                                    {account.bankName} - (...{account.accountNumber.slice(-4)})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button type="submit" className="w-full">Iniciar Transferencia</Button>
                            </CardFooter>
                        </form>
                    </Card>
                </div>
            </div>
        </TabsContent>


         <TabsContent value="news" className="mt-6">
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2 space-y-8">
                     <Card>
                        <CardHeader>
                            <CardTitle>Gestionar Noticias</CardTitle>
                            <CardDescription>Edita o elimina artículos de noticias existentes.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {newsArticles.map(article => (
                                <div key={article.id} className="p-4 bg-muted/50 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <img src={article.imageUrl} alt={article.title} className="w-24 h-14 rounded-md object-cover" />
                                        <div>
                                            <p className="font-bold">{article.title}</p>
                                            <p className="text-sm text-muted-foreground">{article.category} - {article.date}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="outline"><Pencil className="h-4 w-4 mr-1"/>Editar</Button>
                                        <Button size="sm" variant="destructive"><Trash2 className="h-4 w-4 mr-1"/>Eliminar</Button>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
                 <div className="lg:col-span-1 space-y-8">
                    <Card>
                        <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Newspaper className="h-5 w-5 text-primary" />
                            Crear Artículo
                        </CardTitle>
                        <CardDescription>
                            Publica un nuevo artículo en la sección de noticias.
                        </CardDescription>
                        </CardHeader>
                        <form onSubmit={handleCreateArticle}>
                        <CardContent className="grid gap-4">
                            <div className="space-y-2">
                            <Label htmlFor="article-title">Título</Label>
                            <Input id="article-title" placeholder="Ej: Nueva Actualización 3.4" required />
                            </div>
                            <div className="space-y-2">
                            <Label htmlFor="article-summary">Resumen</Label>
                            <Textarea id="article-summary" placeholder="Un breve resumen del artículo..." required />
                            </div>
                            <div className="space-y-2">
                            <Label htmlFor="article-category">Categoría</Label>
                            <Select required>
                                <SelectTrigger id="article-category">
                                    <SelectValue placeholder="Selecciona una categoría" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem key="updates" value="updates">Actualizaciones</SelectItem>
                                    <SelectItem key="events" value="events">Eventos</SelectItem>
                                    <SelectItem key="esports" value="esports">eSports</SelectItem>
                                    <SelectItem key="guides" value="guides">Guías</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" className="w-full">
                            Publicar Artículo
                            </Button>
                        </CardFooter>
                        </form>
                    </Card>
                 </div>
             </div>
        </TabsContent>
        <TabsContent value="settings" className="mt-6">
            <Card>
                <form onSubmit={handleSaveSettings}>
                    <CardHeader>
                        <CardTitle>Ajustes Generales</CardTitle>
                        <CardDescription>Configura las opciones globales de la aplicación.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8">
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div>
                                <Label htmlFor="maintenance-mode" className="font-semibold">Modo Mantenimiento</Label>
                                <p className="text-sm text-muted-foreground">Activa esta opción para deshabilitar el acceso a la app para todos los usuarios excepto administradores.</p>
                            </div>
                            <Switch id="maintenance-mode" />
                        </div>

                        <div className="space-y-4 p-4 border rounded-lg">
                            <h3 className="font-semibold flex items-center gap-2"><BellRing className="h-5 w-5 text-primary"/>Notificación Global</h3>
                            <div className="space-y-2">
                                <Label htmlFor="global-notification">Mensaje del Anuncio</Label>
                                <Textarea id="global-notification" placeholder="Ej: Mantenimiento programado para esta noche a las 2AM." />
                            </div>
                             <div className="flex items-center space-x-2">
                                <Switch id="show-global-notification" />
                                <Label htmlFor="show-global-notification">Mostrar anuncio global a todos los usuarios</Label>
                            </div>
                        </div>

                        <div className="space-y-4 p-4 border rounded-lg">
                           <h3 className="font-semibold flex items-center gap-2"><Wrench className="h-5 w-5 text-primary"/>Configuraciones de la Aplicación</h3>
                           <div className="space-y-2">
                                <Label htmlFor="welcome-message">Mensaje de Bienvenida para Nuevos Usuarios</Label>
                                <Input id="welcome-message" defaultValue="¡Bienvenido a SquadUp! Encuentra a tu equipo ideal." />
                           </div>
                           <div className="space-y-2">
                                <Label htmlFor="matchmaking-rank">Rango Mínimo para Matchmaking</Label>
                                <Select defaultValue="diamante">
                                    <SelectTrigger id="matchmaking-rank">
                                        <SelectValue placeholder="Selecciona un rango mínimo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="bronce">Bronce</SelectItem>
                                        <SelectItem value="plata">Plata</SelectItem>
                                        <SelectItem value="oro">Oro</SelectItem>
                                        <SelectItem value="platino">Platino</SelectItem>
                                        <SelectItem value="diamante">Diamante</SelectItem>
                                        <SelectItem value="corona">Corona</SelectItem>
                                        <SelectItem value="as">As</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">Los jugadores por debajo de este rango no aparecerán en la búsqueda de "Buscar Equipo".</p>
                           </div>
                        </div>

                        <div className="space-y-4 p-4 border rounded-lg">
                           <h3 className="font-semibold flex items-center gap-2"><LinkIcon className="h-5 w-5 text-primary"/>Configuración de Afiliados</h3>
                            <p className="text-sm text-muted-foreground">
                                Edita los enlaces de afiliados para la página de recargas de UC.
                            </p>
                           {rechargeProviders.map((provider, index) => (
                               <div key={index} className="space-y-3 p-3 bg-muted/50 rounded-lg">
                                   <Label htmlFor={`provider-name-${index}`} className="font-semibold">{`Proveedor ${index + 1}`}</Label>
                                   <Input id={`provider-name-${index}`} defaultValue={provider.name} />
                                   <Label htmlFor={`provider-url-${index}`} className="text-sm">URL del Afiliado</Label>
                                   <Input id={`provider-url-${index}`} defaultValue={provider.url} />
                               </div>
                           ))}
                        </div>
                        
                         <div className="space-y-4 p-4 border rounded-lg">
                           <h3 className="font-semibold flex items-center gap-2"><KeyRound className="h-5 w-5 text-primary"/>Gestión de API Keys</h3>
                           <p className="text-sm text-muted-foreground">Administra el acceso para los desarrolladores.</p>
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Desarrollador</TableHead>
                                        <TableHead>Estado</TableHead>
                                        <TableHead>API Key</TableHead>
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {developers.map((dev) => (
                                    <TableRow key={dev.id}>
                                        <TableCell>
                                            <div className="font-medium">{dev.name}</div>
                                            <div className="text-xs text-muted-foreground">{dev.id}</div>
                                        </TableCell>
                                        <TableCell><Badge variant={dev.status === 'Activo' ? 'secondary' : 'destructive'}>{dev.status}</Badge></TableCell>
                                        <TableCell><Input readOnly type="password" value={dev.apiKey}/></TableCell>
                                        <TableCell className="text-right">
                                            <Button size="sm" variant="outline" className="mr-2"><RefreshCw className="h-4 w-4 mr-1"/>Regenerar</Button>
                                            <Button size="sm" variant="destructive"><Trash2 className="h-4 w-4 mr-1"/>Revocar</Button>
                                        </TableCell>
                                    </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>


                    </CardContent>
                    <CardFooter>
                        <Button type="submit">Guardar Ajustes</Button>
                    </CardFooter>
                </form>
            </Card>
        </TabsContent>

       </Tabs>
      
    </div>
  )
}
