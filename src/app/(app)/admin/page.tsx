

"use client"

import React, { useState, useEffect } from "react"
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
import { Code, UserPlus, Newspaper, Check, X, Users, Swords, PlusCircle, Pencil, Trash2, LayoutDashboard, Settings, DollarSign, BarChart, BellRing, Wrench, Link as LinkIcon, KeyRound, RefreshCw, Briefcase, Star, CheckCircle, Banknote, Flag, Calendar as CalendarIcon, Clock, Info, Map, Video, ShieldAlert, FileText, Lightbulb, ChevronDown, AlertTriangle, Shield, Palette, Upload, UserCheck, Trophy, Crown, Cog } from "lucide-react"
import { initialRegistrationRequests, tournaments as initialTournaments, newsArticles as initialNewsArticles, friendsForComparison as initialUsers, rechargeProviders, developers, services as initialServices, creators, adminBankAccounts, initialTransactions, addTournament, tournaments, updateTournament, mapOptions, registeredTeams, updateRegistrationStatus, addApprovedRegistration, reserveTeams, playerProfile, tournamentMessageTemplate as globalTournamentMessageTemplate, ADMIN_EMAIL, subscriptionPlans } from "@/lib/data"
import type { RegistrationRequest, Tournament, NewsArticle, Service, UserWithRole, BankAccount, Transaction, Team, Subscription, SubscriptionPlan, AdminWithdrawal, PlayerProfile } from "@/lib/types"
import { getAllSubscriptions, grantFreeSubscription, getSubscriptionRevenue, createAdminWithdrawal, getAdminWithdrawals, updateWithdrawalStatus, createNewsArticle, getNewsArticles, updateNewsArticle, deleteNewsArticle, getTournamentRegistrations, updateRegistrationStatus as updateRegistrationStatusDB } from "@/lib/database"
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Icons } from "@/components/icons"
import { useAuth } from "@/app/auth-provider"


export default function AdminPage() {
  const { user } = useAuth();
  const { toast } = useToast()
  const [requests, setRequests] = useState<RegistrationRequest[]>(initialRegistrationRequests)
  const [currentTournaments, setTournaments] = useState<Tournament[]>(initialTournaments)
  const [services, setServices] = useState<Service[]>(initialServices);
  const [users, setUsers] = useState<UserWithRole[]>(initialUsers);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>(initialNewsArticles);
  
  // State for the new service form
  const [serviceTitle, setServiceTitle] = useState("");
  const [customServiceTitle, setCustomServiceTitle] = useState("");
  const [creatorId, setCreatorId] = useState("");
  const [price, setPrice] = useState<string>("");
  const [voluntaryOptions, setVoluntaryOptions] = useState<Set<string>>(new Set());
  const finalServiceTitle = serviceTitle === 'Otro...' ? customServiceTitle : serviceTitle;

  // State for finance withdrawal
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(adminBankAccounts);
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState<string>('');
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const currentBalance = transactions.reduce((acc, t) => acc + t.amount, 0);
  
  // State for adding a new payment method
  const [accountType, setAccountType] = useState<'bank' | 'paypal'>('bank');


  // State for tournament creation/editing
  const [tournamentDate, setTournamentDate] = useState<Date>();
  const [tournamentType, setTournamentType] = useState<string>('');
  const [hasStream, setHasStream] = useState(false);
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // State for message template
  const [messageTemplate, setMessageTemplate] = useState(globalTournamentMessageTemplate);

  // State for subscriptions management
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [subscriptionRevenue, setSubscriptionRevenue] = useState({ totalSubscriptions: 0, activeSubscriptions: 0, totalRevenue: 0 });
  const [adminWithdrawals, setAdminWithdrawals] = useState<AdminWithdrawal[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [freeDuration, setFreeDuration] = useState<number>(30);
  const [withdrawalAmountAdmin, setWithdrawalAmountAdmin] = useState<string>('');
  const [selectedBankAccount, setSelectedBankAccount] = useState<string>('');
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(false);
  
  // State for news editing
  const [editingArticle, setEditingArticle] = useState<NewsArticle | null>(null);
  const [isEditNewsModalOpen, setIsEditNewsModalOpen] = useState(false);

  // Load registration requests from database
  const loadRegistrationRequests = async () => {
    try {
      const allRequests: RegistrationRequest[] = [];
      
      // Obtener solicitudes de todos los torneos
      for (const tournament of currentTournaments) {
        const registrations = await getTournamentRegistrations(tournament.id);
        
        // Transformar las solicitudes al formato esperado
        const formattedRequests = registrations
          .filter((reg: any) => reg.status === 'pending')
          .map((reg: any) => ({
            id: reg.id,
            teamName: reg.teamData?.teamName || 'Equipo Sin Nombre',
            teamTag: reg.teamData?.teamTag || 'TAG',
            countryCode: reg.teamData?.countryCode || 'MX',
            tournamentId: reg.tournamentId,
            tournamentName: reg.teamData?.tournamentName || tournament.name,
            status: 'Pendiente' as const,
            players: [{
              id: reg.userId,
              name: reg.teamData?.playerName || 'Jugador',
              avatarUrl: reg.teamData?.playerAvatarUrl || 'https://placehold.co/100x100.png'
            }]
          }));
        
        allRequests.push(...formattedRequests);
      }
      
      setRequests(allRequests);
    } catch (error) {
      console.error('Error loading registration requests:', error);
    }
  };

  // Load news articles from database on component mount
  useEffect(() => {
    const loadNewsArticles = async () => {
      try {
        const articles = await getNewsArticles(50); // Load up to 50 articles
        setNewsArticles(articles);
      } catch (error) {
        console.error('Error loading news articles:', error);
        // Fallback to initial data if database fails
        setNewsArticles(initialNewsArticles);
      }
    };
    loadNewsArticles();
    loadRegistrationRequests();
  }, [currentTournaments]);

  // Recargar solicitudes cuando se actualice un torneo
  useEffect(() => {
    loadRegistrationRequests();
  }, []);

  const handleCreateProfile = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    toast({
      title: "Perfil Creado",
      description: "El perfil de desarrollador ha sido creado con éxito.",
    })
  }

  const handleCreateArticle = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget);
    
    const articleData = {
        title: formData.get('article-title') as string,
        summary: formData.get('article-summary') as string,
        category: formData.get('article-category') as string,
        date: new Date().toISOString().split('T')[0],
        imageUrl: 'https://placehold.co/800x400.png',
        content: formData.get('article-summary') as string, // Using summary as content for now
        author: user?.displayName || 'Admin',
        authorId: user?.uid || 'admin'
    };

    try {
      const result = await createNewsArticle(articleData);
      
      if (result.success) {
        // Reload articles from database to get the updated list
        const updatedArticles = await getNewsArticles(50);
        setNewsArticles(updatedArticles);
        
        toast({
          title: "Artículo Creado",
          description: "El nuevo artículo de noticias ha sido publicado y guardado permanentemente.",
        });
        (event.target as HTMLFormElement).reset();
      } else {
        throw new Error('Failed to create article');
      }
    } catch (error) {
      console.error('Error creating article:', error);
      toast({
        title: "Error",
        description: "No se pudo crear el artículo. Inténtalo de nuevo.",
        variant: "destructive"
      });
    }
  }

  const handleEditArticle = (article: NewsArticle) => {
    setEditingArticle(article);
    setIsEditNewsModalOpen(true);
  };

  const handleUpdateArticle = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingArticle) return;

    const formData = new FormData(event.currentTarget);
    const updates = {
      title: formData.get('edit-article-title') as string,
      summary: formData.get('edit-article-summary') as string,
      category: formData.get('edit-article-category') as string,
      content: formData.get('edit-article-summary') as string,
    };

    try {
      const result = await updateNewsArticle(editingArticle.id, updates);
      
      if (result.success) {
        // Reload articles from database
        const updatedArticles = await getNewsArticles(50);
        setNewsArticles(updatedArticles);
        
        setIsEditNewsModalOpen(false);
        setEditingArticle(null);
        
        toast({
          title: "Artículo Actualizado",
          description: "El artículo ha sido actualizado correctamente.",
        });
      } else {
        throw new Error('Failed to update article');
      }
    } catch (error) {
      console.error('Error updating article:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el artículo. Inténtalo de nuevo.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteArticle = async (articleId: string) => {
    try {
      const result = await deleteNewsArticle(articleId);
      
      if (result.success) {
        // Reload articles from database
        const updatedArticles = await getNewsArticles(50);
        setNewsArticles(updatedArticles);
        
        toast({
          title: "Artículo Eliminado",
          description: "El artículo ha sido eliminado correctamente.",
        });
      } else {
        throw new Error('Failed to delete article');
      }
    } catch (error) {
      console.error('Error deleting article:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el artículo. Inténtalo de nuevo.",
        variant: "destructive"
      });
    }
  };
  
  const handleTournamentSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const maps = [
        formData.get('t-map-1') as string,
        formData.get('t-map-2') as string,
        formData.get('t-map-3') as string,
        formData.get('t-map-4') as string,
    ].filter(Boolean).map(val => mapOptions.find(m => m.value === val)?.label || val);

    const tournamentData: Partial<Tournament> = {
        name: formData.get('t-name') as string,
        date: tournamentDate ? format(tournamentDate, 'yyyy-MM-dd') : undefined,
        prize: formData.get('t-prize') as string,
        mode: formData.get('t-mode') as 'Solo' | 'Dúo' | 'Escuadra',
        region: formData.get('t-region') as 'N.A.' | 'S.A.',
        type: tournamentType as 'Competitivo' | 'Por Puntos' | 'Evento WOW' | 'Amistoso' | 'Scrim',
        description: formData.get('t-description') as string,
        maxTeams: parseInt(formData.get('t-max-teams') as string),
        startTime: formData.get('t-time') as string,
        timeZone: formData.get('t-timezone') as string,
        infoSendTime: formData.get('t-info-send-time') as string,
        maps: maps,
        streamLink: hasStream ? (formData.get('t-stream-link') as string) : undefined,
        maxWithdrawalTime: formData.get('t-max-withdrawal-time') as string,
        maxReserves: parseInt(formData.get('t-max-reserves') as string) || 0,
        messageTemplate: formData.get('t-message-template') as string || undefined,
        // Controles de administrador
        matchId: formData.get('t-match-id') as string,
        matchPassword: formData.get('t-match-password') as string,
        server: formData.get('t-server') as string,
        perspective: formData.get('t-perspective') as string,
        adminNotes: formData.get('t-admin-notes') as string,
        spectatorMode: formData.get('t-spectator-mode') === 'on',
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
     if (!finalServiceTitle) {
        toast({ variant: "destructive", title: "Campos Incompletos", description: "Por favor, completa el título del servicio." });
        return;
    }

    const newService: Service = {
        id: `s${services.length + 1}`,
        creatorId: selectedCreator.id,
        creatorName: selectedCreator.name || '',
        uid: formData.get('s-uid') as string,
        serviceTitle: finalServiceTitle,
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
    setCustomServiceTitle("");
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
    event.preventDefault();
    // In a real app, this would save to a db. Here, we update the imported variable.
    // NOTE: This is a simplified approach for demonstration. A real app would use a state management solution or API calls.
    // For the purpose of this simulation, we will directly mutate the imported variable.
    // Using dynamic import to avoid 'require is not defined' error in browser
    // Note: Cannot assign to read-only property 'tournamentMessageTemplate'
    // This would need to be handled differently in a real application

    toast({
      title: "Ajustes Guardados",
      description: "Las configuraciones globales, incluida la plantilla de mensajes, han sido actualizadas.",
    })
  }

  // Load subscription data on component mount
  React.useEffect(() => {
    const loadSubscriptionData = async () => {
      setLoadingSubscriptions(true);
      try {
        const [allSubs, revenue, withdrawals] = await Promise.all([
          getAllSubscriptions(),
          getSubscriptionRevenue(),
          getAdminWithdrawals()
        ]);
        setSubscriptions(allSubs);
        setSubscriptionRevenue(revenue);
        setAdminWithdrawals(withdrawals);
      } catch (error) {
        console.error('Error loading subscription data:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudieron cargar los datos de suscripciones.",
        });
      } finally {
        setLoadingSubscriptions(false);
      }
    };

    loadSubscriptionData();
  }, []);

  // Handle granting free subscription
  const handleGrantFreeSubscription = async () => {
    if (!selectedUserId || !selectedPlanId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Por favor, selecciona un usuario y un plan.",
      });
      return;
    }

    try {
      await grantFreeSubscription(selectedUserId, selectedPlanId, freeDuration);
      toast({
        title: "Suscripción Otorgada",
        description: `Se otorgó una suscripción gratuita por ${freeDuration} días.`,
      });
      
      // Reload subscription data
      const [allSubs, revenue] = await Promise.all([
        getAllSubscriptions(),
        getSubscriptionRevenue()
      ]);
      setSubscriptions(allSubs);
      setSubscriptionRevenue(revenue);
      
      // Reset form
      setSelectedUserId('');
      setSelectedPlanId('');
      setFreeDuration(30);
    } catch (error) {
      console.error('Error granting free subscription:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo otorgar la suscripción gratuita.",
      });
    }
  };

  // Handle admin withdrawal
  const handleAdminWithdrawal = async () => {
    if (!withdrawalAmountAdmin || !selectedBankAccount) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Por favor, ingresa un monto y selecciona una cuenta.",
      });
      return;
    }

    const amount = parseFloat(withdrawalAmountAdmin);
    if (amount <= 0 || amount > subscriptionRevenue.totalRevenue) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "El monto debe ser mayor a 0 y no exceder los ingresos disponibles.",
      });
      return;
    }

    try {
      await createAdminWithdrawal({
        amount,
        bankAccountId: selectedBankAccount,
        status: 'pending',
        requestedAt: new Date().toISOString()
      });
      toast({
        title: "Retiro Solicitado",
        description: `Se solicitó un retiro de $${amount.toFixed(2)}.`,
      });
      
      // Reload data
      const [revenue, withdrawals] = await Promise.all([
        getSubscriptionRevenue(),
        getAdminWithdrawals()
      ]);
      setSubscriptionRevenue(revenue);
      setAdminWithdrawals(withdrawals);
      
      // Reset form
      setWithdrawalAmountAdmin('');
      setSelectedBankAccount('');
    } catch (error) {
      console.error('Error creating withdrawal:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo procesar el retiro.",
      });
    }
  };

  // Handle withdrawal status update
  const handleUpdateWithdrawalStatus = async (withdrawalId: string, status: 'completed' | 'failed') => {
    try {
      await updateWithdrawalStatus(withdrawalId, status);
      toast({
        title: "Estado Actualizado",
        description: `El retiro ha sido ${status === 'completed' ? 'completado' : 'cancelado'}.`,
      });
      
      // Reload withdrawals
      const withdrawals = await getAdminWithdrawals();
      setAdminWithdrawals(withdrawals);
    } catch (error) {
      console.error('Error updating withdrawal status:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar el estado del retiro.",
      });
    }
  };

  const handleRequest = async (requestId: string, action: "Aprobado" | "Rechazado") => {
    const request = requests.find(req => req.id === requestId);
    if (!request) return;

    const tournament = tournaments.find(t => t.id === request.tournamentId);
    if (!tournament) {
        toast({ variant: "destructive", title: "Error", description: "No se encontró el torneo asociado." });
        return;
    }
    
    const registeringUserId = request.players[0]?.id;
    if (!registeringUserId) return;

    const newTeam: Team = {
      id: `team-${Date.now()}`,
      name: request.teamName,
      players: request.players,
    };

    try {
      if (action === 'Aprobado') {
          const mainSlotsFull = registeredTeams.length >= (tournament.maxTeams || 25);
          const reserveSlotsAvailable = reserveTeams.length < (tournament.maxReserves || 0);

          if (!mainSlotsFull) {
              // Actualizar en la base de datos
              await updateRegistrationStatusDB(tournament.id, requestId, 'approved');
              
              registeredTeams.push(newTeam);
              updateRegistrationStatus(tournament.id, 'approved', registeringUserId);
              addApprovedRegistration({ userId: registeringUserId, tournamentId: tournament.id, status: 'approved' });
              setRequests(prev => prev.filter(req => req.id !== requestId));
              toast({ title: `Solicitud Aprobada`, description: `El equipo ${request.teamName} ha sido añadido al torneo.` });
          } else if (reserveSlotsAvailable) {
              // Actualizar en la base de datos
              await updateRegistrationStatusDB(tournament.id, requestId, 'approved');
              
              reserveTeams.push(newTeam);
              updateRegistrationStatus(tournament.id, 'reserve', registeringUserId);
              addApprovedRegistration({ userId: registeringUserId, tournamentId: tournament.id, status: 'reserve' });
              setRequests(prev => prev.filter(req => req.id !== requestId));
              toast({ title: `Inscrito como Reserva`, description: `El equipo ${request.teamName} ha sido añadido a la lista de reserva.` });
          } else {
              toast({ variant: "destructive", title: "Torneo Lleno", description: "No hay más slots disponibles, ni principales ni de reserva." });
              return; // No se hace nada si no hay espacio
          }
          // Notificar al chat para que se actualice la lista
          window.dispatchEvent(new Event('tournamentUpdated'));

      } else { // Rechazado
          // Actualizar en la base de datos
          await updateRegistrationStatusDB(tournament.id, requestId, 'rejected');
          
          updateRegistrationStatus(tournament.id, 'rejected', registeringUserId);
          setRequests(prev => prev.filter(req => req.id !== requestId));
          toast({ title: `Solicitud Rechazada`, description: `El equipo ${request.teamName} ha sido rechazado.` });
      }
      
      // Recargar las solicitudes para reflejar los cambios
      await loadRegistrationRequests();
    } catch (error) {
      console.error('Error updating registration status:', error);
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: "No se pudo actualizar el estado de la solicitud." 
      });
    }
  }

  const handleAddAccount = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const type = formData.get('account-type') as 'bank' | 'paypal';

    let newAccount: BankAccount;

    if (type === 'paypal') {
        newAccount = {
            id: `ba-${Date.now()}`,
            type: 'paypal',
            email: formData.get('paypal-email') as string,
            holderName: "SquadGO Corp",
        };
    } else {
         newAccount = {
            id: `ba-${Date.now()}`,
            type: 'bank',
            bankName: formData.get('bank-name') as string,
            holderName: formData.get('holder-name') as string,
            accountNumber: formData.get('account-number') as string,
            country: formData.get('country') as string,
        };
    }
    
    setBankAccounts(prev => [...prev, newAccount]);
    toast({ title: "Cuenta Añadida", description: "La nueva cuenta ha sido guardada." });
    setIsAddAccountOpen(false);
    e.currentTarget.reset();
    setAccountType('bank');
  }
  
  const handleWithdrawal = () => {
    // This function is now only for demonstration in the AlertDialog.
    // The actual withdrawal logic is disabled.
    const amount = parseFloat(withdrawalAmount);
    // ... rest of the logic remains for UI display but won't execute transactions
     toast({
      title: "Transferencia Iniciada",
      description: `Se ha iniciado la transferencia de $${amount.toFixed(2)}. Puede tardar de 2 a 3 días hábiles en reflejarse en tu cuenta.`,
    });
  };
  
   const getSelectedAccountDetails = () => {
        if (!selectedAccount) return null;
        return bankAccounts.find(acc => acc.id === selectedAccount);
   }

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
                     <div className="grid grid-cols-2 gap-4 animate-in fade-in-50">
                        <div className="space-y-2">
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
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="t-max-withdrawal-time">Horario Máx. para Bajas</Label>
                            <Input id="t-max-withdrawal-time" name="t-max-withdrawal-time" type="time" defaultValue={defaultValues?.maxWithdrawalTime} />
                        </div>
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
                             <Select name="t-map-1" defaultValue={mapOptions.find(m => m.label === defaultValues?.maps?.[0])?.value}>
                                <SelectTrigger><SelectValue placeholder="Seleccionar mapa"/></SelectTrigger>
                                <SelectContent>
                                    {mapOptions.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="t-map-2">Mapa 2</Label>
                             <Select name="t-map-2" defaultValue={mapOptions.find(m => m.label === defaultValues?.maps?.[1])?.value}>
                                <SelectTrigger><SelectValue placeholder="Seleccionar mapa"/></SelectTrigger>
                                <SelectContent>
                                    {mapOptions.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="t-map-3">Mapa 3</Label>
                             <Select name="t-map-3" defaultValue={mapOptions.find(m => m.label === defaultValues?.maps?.[2])?.value}>
                                <SelectTrigger><SelectValue placeholder="Seleccionar mapa"/></SelectTrigger>
                                <SelectContent>
                                    {mapOptions.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="t-map-4">Mapa 4 (Opcional)</Label>
                             <Select name="t-map-4" defaultValue={mapOptions.find(m => m.label === defaultValues?.maps?.[3])?.value}>
                                <SelectTrigger><SelectValue placeholder="Seleccionar mapa"/></SelectTrigger>
                                <SelectContent>
                                    {mapOptions.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="t-max-teams">Máximo de Equipos</Label>
                    <Input id="t-max-teams" name="t-max-teams" type="number" placeholder="Ej: 23" defaultValue={defaultValues?.maxTeams} required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="t-max-reserves">Cantidad de Reservas</Label>
                    <Input id="t-max-reserves" name="t-max-reserves" type="number" placeholder="Ej: 5" defaultValue={defaultValues?.maxReserves || 0} />
                </div>
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
            {(tournamentType === 'competitivo' || tournamentType === 'scrim' || tournamentType === 'wow') && (
                <div className="space-y-4 p-4 border rounded-lg bg-gradient-to-r from-orange-50 to-red-50 animate-in fade-in-50">
                    <Label className="font-semibold flex items-center gap-2 text-orange-700">
                        <Shield className="h-5 w-5"/> Controles de Administrador
                    </Label>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="t-match-id">ID de Partida</Label>
                            <Input 
                                id="t-match-id" 
                                name="t-match-id" 
                                placeholder="Ej: 123456789" 
                                defaultValue={defaultValues?.matchId} 
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="t-match-password">Contraseña de Partida</Label>
                            <Input 
                                id="t-match-password" 
                                name="t-match-password" 
                                placeholder="Ej: SQUAD2024" 
                                defaultValue={defaultValues?.matchPassword} 
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="t-server">Servidor</Label>
                            <Select name="t-server" defaultValue={defaultValues?.server}>
                                <SelectTrigger id="t-server">
                                    <SelectValue placeholder="Seleccionar servidor" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="NA-East">Norteamérica Este</SelectItem>
                                    <SelectItem value="NA-West">Norteamérica Oeste</SelectItem>
                                    <SelectItem value="SA-North">Sudamérica Norte</SelectItem>
                                    <SelectItem value="SA-South">Sudamérica Sur</SelectItem>
                                    <SelectItem value="Brazil">Brasil</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="t-perspective">Perspectiva</Label>
                            <Select name="t-perspective" defaultValue={defaultValues?.perspective || "TPP"}>
                                <SelectTrigger id="t-perspective">
                                    <SelectValue placeholder="Seleccionar perspectiva" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="TPP">Tercera Persona (TPP)</SelectItem>
                                    <SelectItem value="FPP">Primera Persona (FPP)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="t-admin-notes">Notas del Administrador</Label>
                        <Textarea 
                            id="t-admin-notes" 
                            name="t-admin-notes" 
                            placeholder="Notas internas para el equipo administrativo..." 
                            defaultValue={defaultValues?.adminNotes}
                            className="min-h-[80px]"
                        />
                    </div>
                    <div className="flex items-center space-x-2">
                        <Switch 
                            id="t-spectator-mode" 
                            name="t-spectator-mode"
                            defaultChecked={defaultValues?.spectatorMode || false}
                        />
                        <Label htmlFor="t-spectator-mode" className="text-sm">
                            Habilitar modo espectador para streamers
                        </Label>
                    </div>
                </div>
            )}
            
            <Collapsible>
              <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border p-3 text-sm font-semibold text-primary data-[state=open]:bg-muted/50">
                <span>Personalizar Plantilla de Mensaje (Opcional)</span>
                <ChevronDown className="h-4 w-4 transition-transform data-[state=open]:rotate-180"/>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4 animate-in fade-in-50">
                  <div className="space-y-2 p-4 border rounded-lg">
                    <Label htmlFor="t-message-template">Plantilla Específica para este Torneo</Label>
                    <Textarea 
                      id="t-message-template"
                      name="t-message-template"
                      className="min-h-[200px] font-mono text-xs"
                      placeholder="Edita esta plantilla para este torneo o déjala para usar la versión global guardada en Ajustes."
                      defaultValue={defaultValues?.messageTemplate || globalTournamentMessageTemplate}
                    />
                    <p className="text-xs text-muted-foreground">
                      Si editas este campo, este torneo usará esta plantilla en lugar de la global. Puedes usar las mismas etiquetas (ej: {'{{'} header {'}}' }).
                    </p>
                  </div>
              </CollapsibleContent>
            </Collapsible>
        </CardContent>
        <CardFooter>
            <Button type="submit" className="w-full">{defaultValues ? "Guardar Cambios" : "Crear Torneo"}</Button>
        </CardFooter>
    </form>
  )

  if (user?.email !== ADMIN_EMAIL) {
      return (
          <div className="flex items-center justify-center h-[calc(100vh-200px)]">
              <Card className="max-w-md w-full text-center">
                  <CardHeader>
                      <div className="mx-auto bg-destructive/10 p-3 rounded-full w-fit">
                         <ShieldAlert className="h-10 w-10 text-destructive"/>
                      </div>
                      <CardTitle className="mt-4">Acceso Denegado</CardTitle>
                      <CardDescription>
                          Lo sentimos, solo los administradores pueden acceder a esta página.
                      </CardDescription>
                  </CardHeader>
                  <CardContent>
                      <Button asChild>
                          <a href="/dashboard">Volver al Inicio</a>
                      </Button>
                  </CardContent>
              </Card>
          </div>
      )
  }

  return (
    <div className="space-y-8">
       <div>
          <h1 className="text-3xl font-bold">Panel de Administración</h1>
          <p className="text-muted-foreground">Gestiona los perfiles, solicitudes y configuraciones de la aplicación.</p>
        </div>
      
       <Tabs defaultValue="dashboard" className="w-full">
         <div className="w-full mb-8">
             <div className="overflow-x-auto">
                 <TabsList className="inline-flex h-auto w-full min-w-fit bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                     <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-8 gap-1 w-full">
                         <TabsTrigger 
                             value="dashboard" 
                             className="flex flex-col items-center justify-center px-1.5 py-2 bg-white dark:bg-gray-700 rounded-md hover:bg-blue-50 dark:hover:bg-gray-600 data-[state=active]:bg-blue-500 data-[state=active]:text-white transition-all duration-200 min-h-[50px] text-center min-w-0"
                         >
                             <LayoutDashboard className="h-3.5 w-3.5 mb-0.5 flex-shrink-0"/>
                             <span className="text-[9px] sm:text-[10px] font-medium leading-none truncate w-full">Dashboard</span>
                         </TabsTrigger>
                         
                         <TabsTrigger 
                             value="users" 
                             className="flex flex-col items-center justify-center px-1.5 py-2 bg-white dark:bg-gray-700 rounded-md hover:bg-green-50 dark:hover:bg-gray-600 data-[state=active]:bg-green-500 data-[state=active]:text-white transition-all duration-200 min-h-[50px] text-center min-w-0"
                         >
                             <Users className="h-3.5 w-3.5 mb-0.5 flex-shrink-0"/>
                             <span className="text-[9px] sm:text-[10px] font-medium leading-none truncate w-full">Usuarios</span>
                         </TabsTrigger>
                         
                         <TabsTrigger 
                             value="tournaments" 
                             className="flex flex-col items-center justify-center px-1.5 py-2 bg-white dark:bg-gray-700 rounded-md hover:bg-purple-50 dark:hover:bg-gray-600 data-[state=active]:bg-purple-500 data-[state=active]:text-white transition-all duration-200 min-h-[50px] text-center min-w-0"
                         >
                             <Swords className="h-3.5 w-3.5 mb-0.5 flex-shrink-0"/>
                             <span className="text-[9px] sm:text-[10px] font-medium leading-none truncate w-full">Torneos</span>
                         </TabsTrigger>
                         
                         <TabsTrigger 
                             value="subscriptions" 
                             className="flex flex-col items-center justify-center px-1.5 py-2 bg-white dark:bg-gray-700 rounded-md hover:bg-amber-50 dark:hover:bg-gray-600 data-[state=active]:bg-amber-500 data-[state=active]:text-white transition-all duration-200 min-h-[50px] text-center min-w-0"
                         >
                             <Star className="h-3.5 w-3.5 mb-0.5 flex-shrink-0"/>
                             <span className="text-[9px] sm:text-[10px] font-medium leading-none truncate w-full">Premium</span>
                         </TabsTrigger>
                         
                         <TabsTrigger 
                             value="services" 
                             className="flex flex-col items-center justify-center px-1.5 py-2 bg-white dark:bg-gray-700 rounded-md hover:bg-indigo-50 dark:hover:bg-gray-600 data-[state=active]:bg-indigo-500 data-[state=active]:text-white transition-all duration-200 min-h-[50px] text-center min-w-0"
                         >
                             <Briefcase className="h-3.5 w-3.5 mb-0.5 flex-shrink-0"/>
                             <span className="text-[9px] sm:text-[10px] font-medium leading-none truncate w-full">Servicios</span>
                         </TabsTrigger>
                         
                         <TabsTrigger 
                             value="finances" 
                             className="flex flex-col items-center justify-center px-1.5 py-2 bg-white dark:bg-gray-700 rounded-md hover:bg-emerald-50 dark:hover:bg-gray-600 data-[state=active]:bg-emerald-500 data-[state=active]:text-white transition-all duration-200 min-h-[50px] text-center min-w-0"
                         >
                             <DollarSign className="h-3.5 w-3.5 mb-0.5 flex-shrink-0"/>
                             <span className="text-[9px] sm:text-[10px] font-medium leading-none truncate w-full">Finanzas</span>
                         </TabsTrigger>
                         
                         <TabsTrigger 
                             value="news" 
                             className="flex flex-col items-center justify-center px-1.5 py-2 bg-white dark:bg-gray-700 rounded-md hover:bg-rose-50 dark:hover:bg-gray-600 data-[state=active]:bg-rose-500 data-[state=active]:text-white transition-all duration-200 min-h-[50px] text-center min-w-0"
                         >
                             <Newspaper className="h-3.5 w-3.5 mb-0.5 flex-shrink-0"/>
                             <span className="text-[9px] sm:text-[10px] font-medium leading-none truncate w-full">Noticias</span>
                         </TabsTrigger>
                         
                         <TabsTrigger 
                             value="settings" 
                             className="flex flex-col items-center justify-center px-1.5 py-2 bg-white dark:bg-gray-700 rounded-md hover:bg-slate-50 dark:hover:bg-gray-600 data-[state=active]:bg-slate-500 data-[state=active]:text-white transition-all duration-200 min-h-[50px] text-center min-w-0"
                         >
                             <Settings className="h-3.5 w-3.5 mb-0.5 flex-shrink-0"/>
                             <span className="text-[9px] sm:text-[10px] font-medium leading-none truncate w-full">Ajustes</span>
                         </TabsTrigger>
                     </div>
                 </TabsList>
             </div>
         </div>
        
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
                                                    <AvatarFallback>{(user.name || '').substring(0,2)}</AvatarFallback>
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
                    
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Palette className="h-5 w-5 text-primary" />
                                Fondos Personalizados
                            </CardTitle>
                            <CardDescription>
                                Gestiona los fondos personalizados para las noticias por categoría.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-3">
                                    <Label className="text-sm font-medium">eSports</Label>
                                    <div className="relative">
                                        <div className="w-full h-20 rounded-lg bg-gradient-to-r from-red-500 to-orange-500 border-2 border-dashed border-muted-foreground/30 flex items-center justify-center cursor-pointer hover:border-primary transition-colors">
                                            <span className="text-white text-xs font-medium">Subir Fondo</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-sm font-medium">Actualizaciones</Label>
                                    <div className="relative">
                                        <div className="w-full h-20 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 border-2 border-dashed border-muted-foreground/30 flex items-center justify-center cursor-pointer hover:border-primary transition-colors">
                                            <span className="text-white text-xs font-medium">Subir Fondo</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-sm font-medium">Eventos</Label>
                                    <div className="relative">
                                        <div className="w-full h-20 rounded-lg bg-gradient-to-r from-green-500 to-teal-500 border-2 border-dashed border-muted-foreground/30 flex items-center justify-center cursor-pointer hover:border-primary transition-colors">
                                            <span className="text-white text-xs font-medium">Subir Fondo</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-sm font-medium">Guías</Label>
                                    <div className="relative">
                                        <div className="w-full h-20 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 border-2 border-dashed border-muted-foreground/30 flex items-center justify-center cursor-pointer hover:border-primary transition-colors">
                                            <span className="text-white text-xs font-medium">Subir Fondo</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="pt-4 border-t">
                                <Button className="w-full" variant="outline">
                                    <Upload className="h-4 w-4 mr-2" />
                                    Guardar Cambios de Fondos
                                </Button>
                            </div>
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
                                            <p className={`font-semibold ${request.status === 'Aprobado' ? 'text-green-600' : request.status === 'Reserva' ? 'text-amber-600' : 'text-red-600'}`}>
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
                            <CardDescription>Transfiere el saldo de la plataforma a una cuenta.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Badge variant="outline">Próximamente</Badge>
                            <div className="space-y-2">
                                <Label htmlFor="withdrawal-amount">Monto a Retirar (USD)</Label>
                                <Input 
                                    id="withdrawal-amount" 
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={withdrawalAmount}
                                    onChange={e => setWithdrawalAmount(e.target.value)}
                                    disabled
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="bank-account">Cuenta de Destino</Label>
                                <Select onValueChange={setSelectedAccount} value={selectedAccount} disabled>
                                    <SelectTrigger id="bank-account">
                                        <SelectValue placeholder="Selecciona una cuenta" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {bankAccounts.map(account => (
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
                                        <Button variant="link" className="text-xs p-0 h-auto" disabled>Añadir nueva cuenta</Button>
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
                                                    <Label htmlFor="account-type">Tipo de Cuenta</Label>
                                                    <Select name="account-type" onValueChange={(value) => setAccountType(value as 'bank' | 'paypal')} defaultValue="bank">
                                                        <SelectTrigger id="account-type">
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
                                                            <Input id="holder-name" name="holder-name" defaultValue="SquadGO Corp" required />
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
                            <Button className="w-full" disabled>
                                Próximamente
                            </Button>
                        </CardFooter>
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
                                        <Button size="sm" variant="outline" onClick={() => handleEditArticle(article)}><Pencil className="h-4 w-4 mr-1"/>Editar</Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button size="sm" variant="destructive"><Trash2 className="h-4 w-4 mr-1"/>Eliminar</Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Esta acción no se puede deshacer. El artículo será eliminado permanentemente.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDeleteArticle(article.id)}>Eliminar</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
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
                            <Input name="article-title" id="article-title" placeholder="Ej: Nueva Actualización 3.4" required />
                            </div>
                            <div className="space-y-2">
                            <Label htmlFor="article-summary">Resumen</Label>
                            <Textarea name="article-summary" id="article-summary" placeholder="Un breve resumen del artículo..." required />
                            </div>
                            <div className="space-y-2">
                            <Label htmlFor="article-category">Categoría</Label>
                            <Select name="article-category" required>
                                <SelectTrigger id="article-category">
                                    <SelectValue placeholder="Selecciona una categoría" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="updates">Actualizaciones</SelectItem>
                                    <SelectItem value="events">Eventos</SelectItem>
                                    <SelectItem value="esports">eSports</SelectItem>
                                    <SelectItem value="guides">Guías</SelectItem>
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
                                <Input id="welcome-message" defaultValue="¡Bienvenido a SquadGO! Encuentra a tu equipo ideal." />
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
                            <h3 className="font-semibold flex items-center gap-2"><FileText className="h-5 w-5 text-primary"/>Plantilla de Mensaje para Torneos</h3>
                            <div className="space-y-2">
                                <Label htmlFor="message-template">Estructura del Mensaje Automático (Global)</Label>
                                <Textarea 
                                    id="message-template" 
                                    className="min-h-[300px] font-mono text-xs"
                                    value={messageTemplate}
                                    onChange={(e) => setMessageTemplate(e.target.value)}
                                />
                            </div>
                            <div className="p-3 bg-muted/50 rounded-lg">
                                <h4 className="font-semibold flex items-center gap-2 mb-2 text-sm"><Lightbulb className="h-4 w-4"/>Etiquetas Disponibles</h4>
                                <p className="text-xs text-muted-foreground">
                                    Usa estas etiquetas en tu plantilla. Serán reemplazadas por los datos reales del torneo:
                                </p>
                                <code className="text-xs grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-1 mt-2">
                                    <span>{"'{{header}}'"}</span>
                                     <span>{"'{{organizerName}}'"}</span>
                                     <span>{"'{{tournamentName}}'"}</span>
                                     <span>{"'{{date}}'"}</span>
                                     <span>{"'{{startTime}}'"}</span>
                                     <span>{"'{{timeZoneFlag}}'"}</span>
                                     <span>{"'{{infoSendText}}'"}</span>
                                     <span>{"'{{maxWithdrawalText}}'"}</span>
                                     <span>{"'{{mapsList}}'"}</span>
                                     <span>{"'{{slotsList}}'"}</span>
                                     <span>{"'{{registeredCount}}'"}</span>
                                     <span>{"'{{maxSlots}}'"}</span>
                                     <span>{"'{{reserveText}}'"}</span>
                                     <span>{"'{{streamLink}}'"}</span>
                                </code>
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

        {/* Subscriptions Tab */}
        <TabsContent value="subscriptions" className="space-y-6">
          <div className="grid gap-6">
            {/* Subscription Statistics */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Suscripciones</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{subscriptionRevenue.totalSubscriptions}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Suscripciones Activas</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{subscriptionRevenue.activeSubscriptions}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${subscriptionRevenue.totalRevenue.toFixed(2)}</div>
                </CardContent>
              </Card>
            </div>

            {/* Grant Free Subscription */}
            <Card>
              <CardHeader>
                <CardTitle>Otorgar Suscripción Gratuita</CardTitle>
                <CardDescription>
                  Concede una suscripción gratuita a un usuario por un período específico.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="user-select">Usuario</Label>
                    <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar usuario" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.filter(u => u.role === 'Jugador').map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name} ({user.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="plan-select">Plan</Label>
                    <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar plan" />
                      </SelectTrigger>
                      <SelectContent>
                        {subscriptionPlans.map((plan) => (
                          <SelectItem key={plan.id} value={plan.id}>
                            {plan.name} - ${plan.price}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duración (días)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={freeDuration}
                      onChange={(e) => setFreeDuration(parseInt(e.target.value) || 30)}
                      min="1"
                      max="365"
                    />
                  </div>
                </div>
                <Button onClick={handleGrantFreeSubscription} className="w-full">
                  <Star className="mr-2 h-4 w-4" />
                  Otorgar Suscripción Gratuita
                </Button>
              </CardContent>
            </Card>

            {/* Admin Withdrawal */}
            <Card>
              <CardHeader>
                <CardTitle>Retiro de Ingresos</CardTitle>
                <CardDescription>
                  Retira los ingresos generados por las suscripciones a tu cuenta bancaria.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="withdrawal-amount">Monto a Retirar</Label>
                    <Input
                      id="withdrawal-amount"
                      type="number"
                      placeholder="0.00"
                      value={withdrawalAmountAdmin}
                      onChange={(e) => setWithdrawalAmountAdmin(e.target.value)}
                      min="0"
                      max={subscriptionRevenue.totalRevenue}
                      step="0.01"
                    />
                    <p className="text-sm text-muted-foreground">
                      Disponible: ${subscriptionRevenue.totalRevenue.toFixed(2)}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bank-account">Cuenta Bancaria</Label>
                    <Select value={selectedBankAccount} onValueChange={setSelectedBankAccount}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar cuenta" />
                      </SelectTrigger>
                      <SelectContent>
                        {bankAccounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.bankName} - ****{account.accountNumber?.slice(-4) || 'N/A'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={handleAdminWithdrawal} className="w-full">
                  <Banknote className="mr-2 h-4 w-4" />
                  Solicitar Retiro
                </Button>
              </CardContent>
            </Card>

            {/* Subscription List */}
            <Card>
              <CardHeader>
                <CardTitle>Lista de Suscripciones</CardTitle>
                <CardDescription>
                  Todas las suscripciones activas y expiradas en el sistema.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingSubscriptions ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin" />
                    <span className="ml-2">Cargando suscripciones...</span>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Usuario</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Fecha Inicio</TableHead>
                        <TableHead>Fecha Fin</TableHead>
                        <TableHead>Precio</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subscriptions.map((subscription) => {
                        const user = users.find(u => u.id === subscription.userId);
                        const plan = subscriptionPlans.find(p => p.id === subscription.planId);
                        return (
                          <TableRow key={subscription.id}>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={user?.avatarUrl} />
                                  <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <span>{user?.name || 'Usuario no encontrado'}</span>
                              </div>
                            </TableCell>
                            <TableCell>{plan?.name || 'Plan no encontrado'}</TableCell>
                            <TableCell>
                              <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'}>
                                {subscription.status === 'active' ? 'Activa' : 'Expirada'}
                              </Badge>
                            </TableCell>
                            <TableCell>{new Date(subscription.startDate).toLocaleDateString()}</TableCell>
                            <TableCell>{new Date(subscription.endDate).toLocaleDateString()}</TableCell>
                            <TableCell>${plan?.price?.toFixed(2) || '0.00'}</TableCell>
                          </TableRow>
                        );
                      })}
                      {subscriptions.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No hay suscripciones registradas
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Withdrawal History */}
            <Card>
              <CardHeader>
                <CardTitle>Historial de Retiros</CardTitle>
                <CardDescription>
                  Historial de todos los retiros solicitados y procesados.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead>Cuenta</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adminWithdrawals.map((withdrawal) => {
                      const account = bankAccounts.find(a => a.id === withdrawal.bankAccountId);
                      return (
                        <TableRow key={withdrawal.id}>
                          <TableCell>{new Date(withdrawal.requestedAt).toLocaleDateString()}</TableCell>
                          <TableCell>${withdrawal.amount.toFixed(2)}</TableCell>
                          <TableCell>
                            {account ? `${account.bankName} - ****${account.accountNumber?.slice(-4) || 'N/A'}` : 'Cuenta no encontrada'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              withdrawal.status === 'completed' ? 'default' :
                              withdrawal.status === 'pending' ? 'secondary' : 'destructive'
                            }>
                              {withdrawal.status === 'completed' ? 'Completado' :
                               withdrawal.status === 'pending' ? 'Pendiente' : 'Cancelado'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {withdrawal.status === 'pending' && (
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleUpdateWithdrawalStatus(withdrawal.id, 'completed')}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleUpdateWithdrawalStatus(withdrawal.id, 'failed')}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {adminWithdrawals.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No hay retiros registrados
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

       </Tabs>

       {/* Edit News Modal */}
       <Dialog open={isEditNewsModalOpen} onOpenChange={setIsEditNewsModalOpen}>
         <DialogContent className="sm:max-w-[600px]">
           <DialogHeader>
             <DialogTitle>Editar Artículo</DialogTitle>
             <DialogDescription>
               Modifica los detalles del artículo de noticias.
             </DialogDescription>
           </DialogHeader>
           {editingArticle && (
             <form onSubmit={handleUpdateArticle} className="space-y-4">
               <div className="space-y-2">
                 <Label htmlFor="edit-article-title">Título</Label>
                 <Input
                   id="edit-article-title"
                   name="edit-article-title"
                   defaultValue={editingArticle.title}
                   required
                 />
               </div>
               <div className="space-y-2">
                 <Label htmlFor="edit-article-category">Categoría</Label>
                 <Select name="edit-article-category" defaultValue={editingArticle.category}>
                   <SelectTrigger>
                     <SelectValue placeholder="Selecciona una categoría" />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="Esports">Esports</SelectItem>
                     <SelectItem value="Tecnología">Tecnología</SelectItem>
                     <SelectItem value="Gaming">Gaming</SelectItem>
                     <SelectItem value="Noticias">Noticias</SelectItem>
                     <SelectItem value="Actualizaciones">Actualizaciones</SelectItem>
                   </SelectContent>
                 </Select>
               </div>
               <div className="space-y-2">
                 <Label htmlFor="edit-article-summary">Resumen</Label>
                 <Textarea
                   id="edit-article-summary"
                   name="edit-article-summary"
                   defaultValue={editingArticle.summary}
                   placeholder="Escribe un resumen del artículo..."
                   className="min-h-[100px]"
                   required
                 />
               </div>
               <DialogFooter>
                 <Button type="button" variant="outline" onClick={() => setIsEditNewsModalOpen(false)}>
                   Cancelar
                 </Button>
                 <Button type="submit">
                   Actualizar Artículo
                 </Button>
               </DialogFooter>
             </form>
           )}
         </DialogContent>
       </Dialog>
      
    </div>
  )
}




