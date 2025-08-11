
"use client"

import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { services as initialServices, playerProfile, creatorBankAccounts as initialCreatorBankAccounts, initialTransactions } from "@/lib/data";
import type { Service, Transaction, BankAccount } from "@/lib/types";
import { Palette, PlusCircle, Pencil, Trash2, CheckCircle, Star, DollarSign, LayoutDashboard, Briefcase, Banknote, MessageSquare, Settings, BarChart, FileText, Youtube, Twitch, Instagram } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Icons } from "@/components/icons";


export default function CreatorHubPage() {
  const { toast } = useToast();
  const [myServices, setMyServices] = useState<Service[]>(
    initialServices.filter(s => s.creatorId === playerProfile.id)
  );

  const [serviceTitle, setServiceTitle] = useState("");
  const [customServiceTitle, setCustomServiceTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<string>("");
  const [voluntaryOptions, setVoluntaryOptions] = useState<Set<string>>(new Set());
  
  // State for finance withdrawal
  const [withdrawalAmount, setWithdrawalAmount] = useState<number | string>('');
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions.filter(t => t.type === 'Ingreso')); // Creator only sees income
  const [creatorBankAccounts, setCreatorBankAccounts] = useState<BankAccount[]>(initialCreatorBankAccounts);
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const currentBalance = transactions.reduce((acc, t) => acc + t.amount, 0);
  const [accountType, setAccountType] = useState<'bank' | 'paypal'>('bank');


  const finalServiceTitle = serviceTitle === 'Otro...' ? customServiceTitle : serviceTitle;

  const handleCreateService = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!finalServiceTitle || !description) {
        toast({ variant: "destructive", title: "Campos Incompletos", description: "Por favor, completa todos los campos requeridos." });
        return;
    }

    const newService: Service = {
      id: `s${Date.now()}`,
      creatorId: playerProfile.id,
      creatorName: playerProfile.name,
      avatarUrl: playerProfile.avatarUrl,
      uid: playerProfile.id,
      serviceTitle: finalServiceTitle,
      description: description,
      price: parseFloat(price) || 0,
      voluntaryOptions: price === "0" ? Array.from(voluntaryOptions) : [],
      rating: 0,
      reviews: 0,
      isVerified: true,
      isFeatured: false,
    };

    setMyServices(prev => [...prev, newService]);
    toast({
      title: "Servicio Publicado",
      description: `Tu nuevo servicio "${newService.serviceTitle}" está ahora visible.`,
    });

    (event.target as HTMLFormElement).reset();
    setServiceTitle("");
    setCustomServiceTitle("");
    setDescription("");
    setPrice("");
    setVoluntaryOptions(new Set());
  };

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
  };

  const handleDeleteService = (serviceId: string) => {
    setMyServices(prev => prev.filter(s => s.id !== serviceId));
    toast({
        variant: "destructive",
        title: "Servicio Eliminado",
        description: "Tu servicio ha sido eliminado de la plataforma.",
    })
  }

 const handleAddAccount = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const type = formData.get('account-type') as 'bank' | 'paypal';

    let newAccount: BankAccount;

    if (type === 'paypal') {
        newAccount = {
            id: `cba-${Date.now()}`,
            type: 'paypal',
            email: formData.get('paypal-email') as string,
            holderName: playerProfile.name,
        };
    } else {
         newAccount = {
            id: `cba-${Date.now()}`,
            type: 'bank',
            bankName: formData.get('bank-name') as string,
            holderName: formData.get('holder-name') as string,
            accountNumber: formData.get('account-number') as string,
            country: formData.get('country') as string,
        };
    }
    
    setCreatorBankAccounts(prev => [...prev, newAccount]);
    toast({ title: "Cuenta Añadida", description: "La nueva cuenta ha sido guardada." });
    setIsAddAccountOpen(false);
    e.currentTarget.reset();
    setAccountType('bank');
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
      toast({ variant: 'destructive', title: 'Cuenta no Seleccionada', description: 'Por favor, selecciona una cuenta para el retiro.' });
      return;
    }

    const accountDetails = creatorBankAccounts.find(acc => acc.id === selectedAccount);
    const descriptionText = accountDetails?.type === 'paypal'
        ? `Retiro a PayPal (${accountDetails.email})`
        : `Retiro a ${accountDetails?.bankName} (...${accountDetails?.accountNumber?.slice(-4)})`;

    const newTransaction: Transaction = {
        id: `txn-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        description: descriptionText,
        amount: -amount,
        type: 'Retiro',
    };
    setTransactions(prev => [newTransaction, ...prev]);

    toast({
      title: 'Retiro Procesado',
      description: `Se ha iniciado la transferencia de $${amount.toFixed(2)} a tu cuenta. Puede tardar de 2 a 3 días hábiles en reflejarse.`,
    });
    
    setWithdrawalAmount('');
    setSelectedAccount('');
  };


  if (playerProfile.role !== 'Admin' && playerProfile.role !== 'Creador') {
      return (
           <div className="flex items-center justify-center h-[calc(100vh-200px)]">
              <Card className="max-w-md w-full text-center">
                  <CardHeader>
                      <div className="mx-auto bg-destructive/10 p-3 rounded-full w-fit">
                         <Palette className="h-10 w-10 text-destructive"/>
                      </div>
                      <CardTitle className="mt-4">Acceso Exclusivo para Creadores</CardTitle>
                      <CardDescription>
                          Lo sentimos, esta sección es solo para creadores de contenido verificados.
                      </CardDescription>
                  </CardHeader>
                  <CardContent>
                      <Button asChild>
                          <a href="/creator-application">Aplica para ser Creador</a>
                      </Button>
                  </CardContent>
              </Card>
          </div>
      )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Palette className="w-8 h-8 text-primary" />
          Portal del Creador
        </h1>
        <p className="text-muted-foreground">
          Gestiona tus servicios, finanzas, perfil y conecta con la comunidad.
        </p>
      </div>
      
       <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
            <TabsTrigger value="dashboard"><LayoutDashboard className="mr-2"/>Dashboard</TabsTrigger>
            <TabsTrigger value="services"><Briefcase className="mr-2"/>Servicios</TabsTrigger>
            <TabsTrigger value="finances"><DollarSign className="mr-2"/>Finanzas</TabsTrigger>
            <TabsTrigger value="reviews"><MessageSquare className="mr-2"/>Reseñas</TabsTrigger>
            <TabsTrigger value="settings"><Settings className="mr-2"/>Perfil</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard" className="mt-6">
            <Card>
                <CardHeader>
                    <CardTitle>Dashboard del Creador</CardTitle>
                    <CardDescription>Una vista general de tu actividad y rendimiento en la plataforma.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Ingresos (Mes)</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">${currentBalance.toFixed(2)}</div>
                             <p className="text-xs text-muted-foreground">Basado en servicios completados</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Servicios Activos</CardTitle>
                            <Briefcase className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{myServices.length}</div>
                            <p className="text-xs text-muted-foreground">Servicios publicados actualmente</p>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Reseñas Recibidas</CardTitle>
                            <Star className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{myServices.reduce((acc, s) => acc + s.reviews, 0)}</div>
                             <p className="text-xs text-muted-foreground">En todos tus servicios</p>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Solicitudes de Contacto</CardTitle>
                            <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">+5</div>
                             <p className="text-xs text-muted-foreground">Esta semana</p>
                        </CardContent>
                    </Card>
                </CardContent>
            </Card>
        </TabsContent>
        
        <TabsContent value="services" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-1 space-y-8 lg:sticky top-20">
                <Card>
                    <form onSubmit={handleCreateService}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                        <PlusCircle className="h-5 w-5 text-primary" />
                        Crear Nuevo Servicio
                        </CardTitle>
                        <CardDescription>
                        Rellena los detalles para publicar una nueva oferta.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
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
                                <SelectItem value="Entrenamiento para Rol de Soporte">Entrenamiento para Rol de Soporte</SelectItem>
                                <SelectItem value="Entrenamiento para Rol de Francotirador">Entrenamiento para Rol de Francotirador</SelectItem>
                                <SelectItem value="Guía de Mapas y Zonas de Caída">Guía de Mapas y Zonas de Caída</SelectItem>
                                <SelectItem value="Otro...">Otro...</SelectItem>
                            </SelectContent>
                        </Select>
                        </div>
                        {serviceTitle === 'Otro...' && (
                            <div className="space-y-2 animate-in fade-in-50">
                                <Label htmlFor="s-customServiceTitle">Título Personalizado</Label>
                                <Input 
                                    id="s-customServiceTitle"
                                    value={customServiceTitle}
                                    onChange={(e) => setCustomServiceTitle(e.target.value)}
                                    placeholder="Ej: Creación de contenido para tu team"
                                    required
                                />
                            </div>
                        )}
                        <div className="space-y-2">
                        <Label htmlFor="s-description">Descripción Detallada</Label>
                        <Textarea
                            id="s-description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe qué ofreces, tu experiencia, y qué puede esperar el jugador..."
                            required
                            className="min-h-[120px]"
                        />
                        </div>
                        <div className="space-y-2">
                        <Label htmlFor="s-price">Precio (USD)</Label>
                        <Input
                            id="s-price"
                            type="number"
                            step="0.01"
                            placeholder="Ej: 25.00 (0 para gratis/intercambio)"
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
                                { id: 'pop', label: 'Intercambio de Popularidad' },
                                { id: 'uc', label: 'Regalos UC' },
                                { id: 'friend', label: 'Agregar como Amigo' },
                                { id: 'social', label: 'Soporte en Redes Sociales' },
                            ].map(opt => (
                                <div key={opt.id} className="flex items-center space-x-2">
                                <Checkbox
                                    id={`opt-${opt.id}`}
                                    onCheckedChange={(checked) => handleVoluntaryOptionChange(opt.label, checked as boolean)}
                                />
                                <label htmlFor={`opt-${opt.id}`} className="text-sm font-medium leading-none">
                                    {opt.label}
                                </label>
                                </div>
                            ))}
                            </div>
                        </div>
                        )}
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" className="w-full">
                        Publicar Servicio
                        </Button>
                    </CardFooter>
                    </form>
                </Card>
                </div>

                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Mis Servicios Publicados</CardTitle>
                            <CardDescription>Aquí puedes ver y gestionar todas tus ofertas activas en la plataforma.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {myServices.length === 0 && (
                                <div className="text-center text-muted-foreground p-8 border-dashed border-2 rounded-lg">
                                    <p>Aún no has publicado ningún servicio.</p>
                                    <p className="text-sm">Usa el formulario de la izquierda para crear tu primera oferta.</p>
                                </div>
                            )}
                            {myServices.map(service => (
                                <Card key={service.id} className="bg-muted/30">
                                    <CardHeader>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <CardTitle className="text-lg">{service.serviceTitle}</CardTitle>
                                                <div className="flex items-center gap-2 mt-1">
                                                    {service.isVerified && <Badge variant="secondary"><CheckCircle className="mr-1 h-3 w-3"/> Verificado</Badge>}
                                                    {service.isFeatured && <Badge className="bg-amber-400 text-amber-900 hover:bg-amber-400/80"><Star className="mr-1 h-3 w-3"/> Destacado</Badge>}
                                                </div>
                                            </div>
                                            <div className="flex gap-1">
                                                <Button variant="ghost" size="icon"><Pencil className="h-4 w-4" /></Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleDeleteService(service.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground line-clamp-2">{service.description}</p>
                                    </CardContent>
                                    <CardFooter className="flex justify-between items-center text-sm">
                                        <div className="font-bold text-primary">
                                            <DollarSign className="inline-block h-4 w-4 mr-1"/>
                                            {service.price > 0 ? service.price.toFixed(2) : 'Gratis / Intercambio'}
                                        </div>
                                        <div className="text-muted-foreground">
                                            <Star className="inline-block fill-amber-400 text-amber-400 h-4 w-4 mr-1" />
                                            {service.rating.toFixed(1)} ({service.reviews} reseñas)
                                        </div>
                                    </CardFooter>
                                </Card>
                            ))}
                        </CardContent>
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
                            <CardDescription>Un registro de todos tus ingresos por servicios completados y tus retiros.</CardDescription>
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
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Retirar Fondos</CardTitle>
                            <CardDescription>Transfiere tu saldo disponible a tu cuenta.</CardDescription>
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
                                            {creatorBankAccounts.map(account => (
                                                <SelectItem key={account.id} value={account.id}>
                                                     <div className="flex items-center gap-2">
                                                        {account.type === 'paypal' && <Icons.paypal className="h-4 w-4" />}
                                                        {account.type === 'bank' && <Banknote className="h-4 w-4" />}
                                                        <span>
                                                            {account.type === 'paypal' 
                                                                ? `${account.email}` 
                                                                : `${account.bankName} (...${account.accountNumber?.slice(-4)})`
                                                            }
                                                        </span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Dialog open={isAddAccountOpen} onOpenChange={setIsAddAccountOpen}>
                                        <DialogTrigger asChild>
                                            <Button variant="link" className="text-xs p-0 h-auto">Añadir nueva cuenta</Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <form onSubmit={handleAddAccount}>
                                                <DialogHeader>
                                                    <DialogTitle>Añadir Nuevo Método de Pago</DialogTitle>
                                                    <DialogDescription>
                                                        Introduce los detalles de tu cuenta bancaria o PayPal.
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <div className="grid gap-4 py-4">
                                                     <div className="space-y-2">
                                                        <Label htmlFor="account-type-creator">Tipo de Cuenta</Label>
                                                        <Select name="account-type" onValueChange={(value) => setAccountType(value as 'bank' | 'paypal')} defaultValue="bank">
                                                            <SelectTrigger id="account-type-creator">
                                                                <SelectValue placeholder="Selecciona un tipo" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="bank">Cuenta Bancaria</SelectItem>
                                                                <SelectItem value="paypal">PayPal</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    {accountType === 'bank' ? (
                                                        <div className="space-y-4 animate-in fade-in-50">
                                                            <div className="space-y-2">
                                                                <Label htmlFor="bank-name">Nombre del Banco</Label>
                                                                <Input id="bank-name" name="bank-name" required />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label htmlFor="holder-name">Nombre del Titular</Label>
                                                                <Input id="holder-name" name="holder-name" defaultValue={playerProfile.name} required />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label htmlFor="account-number">Número de Cuenta</Label>
                                                                <Input id="account-number" name="account-number" required />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label htmlFor="country">País del Banco</Label>
                                                                <Input id="country" name="country" required />
                                                            </div>
                                                        </div>
                                                    ) : (
                                                         <div className="space-y-2 animate-in fade-in-50">
                                                            <Label htmlFor="paypal-email">Correo de PayPal</Label>
                                                            <Input id="paypal-email" name="paypal-email" type="email" placeholder="pagos@ejemplo.com" required />
                                                         </div>
                                                    )}
                                                </div>
                                                <DialogFooter>
                                                    <Button type="submit">Guardar Cuenta</Button>
                                                </DialogFooter>
                                            </form>
                                        </DialogContent>
                                    </Dialog>
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

        <TabsContent value="reviews" className="mt-6">
            <Card>
                <CardHeader>
                    <CardTitle>Reseñas y Feedback de Jugadores</CardTitle>
                    <CardDescription>Aquí puedes ver lo que la comunidad opina de tus servicios. ¡Usa este feedback para mejorar!</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Placeholder para futuras reseñas */}
                    <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-12 border-2 border-dashed rounded-lg">
                        <MessageSquare className="h-12 w-12 mb-4"/>
                        <h3 className="font-semibold text-lg">Aún no hay reseñas</h3>
                        <p className="text-sm">Cuando los jugadores dejen feedback en tus servicios, aparecerán aquí.</p>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
        
         <TabsContent value="settings" className="mt-6">
            <Card>
                 <CardHeader>
                    <CardTitle>Perfil Público de Creador</CardTitle>
                    <CardDescription>Configura cómo te ven los demás jugadores en la plataforma. Añade tus redes para mayor visibilidad.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                     <div className="space-y-2">
                        <Label htmlFor="creator-bio">Biografía del Creador</Label>
                        <Textarea id="creator-bio" defaultValue={playerProfile.bio} className="min-h-[120px]" placeholder="Describe tu experiencia, tus logros más importantes y tu filosofía como jugador y creador."/>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="youtube-url">Canal de YouTube</Label>
                        <div className="relative">
                            <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input id="youtube-url" placeholder="youtube.com/@tucanal" className="pl-9"/>
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="twitch-url">Canal de Twitch</Label>
                        <div className="relative">
                            <Twitch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input id="twitch-url" placeholder="twitch.tv/tunombre" className="pl-9"/>
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="instagram-url">TikTok / Instagram</Label>
                        <div className="relative">
                            <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input id="instagram-url" placeholder="@tuusuario" className="pl-9"/>
                        </div>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button>Guardar Cambios del Perfil</Button>
                </CardFooter>
            </Card>
        </TabsContent>
       </Tabs>
    </div>
  );
}
