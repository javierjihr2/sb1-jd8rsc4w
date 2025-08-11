
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Settings, EyeOff, UserX, ShieldQuestion, AlertTriangle, UserCheck, Trash2 } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { friendsForComparison } from "@/lib/data"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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

// Datos simulados de usuarios bloqueados
const initialBlockedUsers = [
  friendsForComparison.find(f => f.id === 'c3'),
  friendsForComparison.find(f => f.id === 'f1'),
].filter(Boolean) as any[];


export default function SettingsPage() {
    const { toast } = useToast()
    const [isPrivate, setIsPrivate] = useState(false)
    const [blockedUsers, setBlockedUsers] = useState(initialBlockedUsers)

    const handleUnblockUser = (userId: string) => {
        setBlockedUsers(prev => prev.filter(u => u.id !== userId));
        toast({
            title: "Usuario Desbloqueado",
            description: "Este usuario ahora podrá interactuar contigo y ver tu perfil.",
        })
    }

    const handleSuspendAccount = () => {
        toast({
            title: "Cuenta Suspendida",
            description: "Tu cuenta ha sido suspendida temporalmente. Puedes volver a iniciar sesión cuando quieras para reactivarla.",
        })
    }
    
    const handleDeleteAccount = () => {
        toast({
            variant: "destructive",
            title: "Cuenta Eliminada Permanentemente",
            description: "Tu cuenta y todos tus datos han sido eliminados. Gracias por formar parte de SquadUp.",
        })
    }


    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-2"><Settings className="w-8 h-8 text-primary"/>Ajustes</h1>
                <p className="text-muted-foreground">Gestiona la privacidad de tu cuenta, los usuarios bloqueados y más.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><EyeOff className="h-5 w-5"/> Privacidad de la Cuenta</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                            <Label htmlFor="private-account" className="font-semibold">Hacer mi cuenta privada</Label>
                            <p className="text-sm text-muted-foreground">Si activas esta opción, tu perfil no será visible para otros en búsquedas y solo tus amigos podrán ver tu información.</p>
                        </div>
                        <Switch 
                            id="private-account" 
                            checked={isPrivate} 
                            onCheckedChange={setIsPrivate}
                        />
                    </div>
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><UserX className="h-5 w-5"/> Gestión de Bloqueados</CardTitle>
                    <CardDescription>Aquí puedes ver y gestionar los usuarios que has bloqueado.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {blockedUsers.length > 0 ? blockedUsers.map(user => (
                        <div key={user.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={user.avatarUrl} />
                                    <AvatarFallback>{user.name.substring(0,2)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-semibold">{user.name}</p>
                                    <p className="text-xs text-muted-foreground">{user.rank}</p>
                                </div>
                            </div>
                            <Button variant="secondary" size="sm" onClick={() => handleUnblockUser(user.id)}>
                                <UserCheck className="mr-2 h-4 w-4"/>
                                Desbloquear
                            </Button>
                        </div>
                    )) : (
                        <p className="text-sm text-center text-muted-foreground py-4">No tienes a ningún usuario bloqueado.</p>
                    )}
                </CardContent>
            </Card>

            <Card className="border-destructive">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive"><AlertTriangle className="h-5 w-5"/> Zona de Peligro</CardTitle>
                    <CardDescription>Las acciones en esta sección son importantes y en algunos casos, irreversibles. Procede con precaución.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col sm:flex-row items-center justify-between p-4 border rounded-lg border-dashed">
                        <div>
                            <h4 className="font-semibold">Suspender mi cuenta</h4>
                            <p className="text-sm text-muted-foreground">Puedes suspender tu cuenta temporalmente. No aparecerás en la aplicación pero tus datos se conservarán.</p>
                        </div>
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="outline" className="w-full mt-2 sm:mt-0 sm:w-auto">Suspender Cuenta</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>¿Estás seguro de que quieres suspender tu cuenta?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Tu perfil y actividades se ocultarán hasta que inicies sesión de nuevo. Podrás reactivar tu cuenta en cualquier momento.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={handleSuspendAccount}>Sí, suspender</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                     <div className="flex flex-col sm:flex-row items-center justify-between p-4 border rounded-lg border-destructive/50 bg-destructive/5">
                        <div>
                            <h4 className="font-semibold text-destructive">Eliminar mi cuenta</h4>
                            <p className="text-sm text-muted-foreground">Esta acción es permanente y no se puede deshacer. Se eliminarán todos tus datos, incluyendo perfil, chats y progreso.</p>
                        </div>
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" className="w-full mt-2 sm:mt-0 sm:w-auto">
                                    <Trash2 className="mr-2 h-4 w-4"/>
                                    Eliminar Cuenta
                                </Button>
                            </AlertDialogTrigger>
                             <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle className="text-destructive">¡Atención! ¿Estás absolutamente seguro?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Esta acción es irreversible. Todos tus datos, incluyendo perfil, chats, amistades y progreso en torneos, serán eliminados para siempre.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>No, cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive hover:bg-destructive/90">Sí, eliminar mi cuenta</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </CardContent>
            </Card>


        </div>
    )
}
