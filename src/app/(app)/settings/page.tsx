
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
import { suspendUserAccount, deleteUserAccount } from "@/utils/account-management"
import { useAuth } from "@/app/auth-provider"
import { Settings, EyeOff, UserX, ShieldQuestion, AlertTriangle, UserCheck, Trash2, MapPin, Camera, Mic, Key, Database, ChevronRight } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth"
import { auth } from "@/lib/firebase"
import Link from "next/link"

// Datos simulados de usuarios bloqueados
const initialBlockedUsers = [
  friendsForComparison.find(f => f.id === 'c3'),
  friendsForComparison.find(f => f.id === 'f1'),
].filter(Boolean) as any[];


export default function SettingsPage() {
    const { user } = useAuth()
    const { toast } = useToast()
    const [isPrivate, setIsPrivate] = useState(false)
    const [blockedUsers, setBlockedUsers] = useState(initialBlockedUsers)
    const [locationPermission, setLocationPermission] = useState(true)
    const [cameraPermission, setCameraPermission] = useState(true)
    const [microphonePermission, setMicrophonePermission] = useState(true)
    const [showPasswordDialog, setShowPasswordDialog] = useState(false)
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    })
    const [isChangingPassword, setIsChangingPassword] = useState(false)

    const handleUnblockUser = (userId: string) => {
        setBlockedUsers(prev => prev.filter(u => u.id !== userId));
        toast({
            title: "Usuario Desbloqueado",
            description: "Este usuario ahora podrá interactuar contigo y ver tu perfil.",
        })
    }

    const handleChangePassword = async () => {
        if (!user) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Debes estar autenticado para cambiar tu contraseña.",
            })
            return
        }

        const { currentPassword, newPassword, confirmPassword } = passwordForm

        if (!currentPassword || !newPassword || !confirmPassword) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Por favor completa todos los campos.",
            })
            return
        }

        if (newPassword !== confirmPassword) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Las contraseñas no coinciden.",
            })
            return
        }

        if (newPassword.length < 6) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "La nueva contraseña debe tener al menos 6 caracteres.",
            })
            return
        }

        setIsChangingPassword(true)
        try {
            // Reautenticar usuario
            const credential = EmailAuthProvider.credential(user.email!, currentPassword)
            await reauthenticateWithCredential(user, credential)
            
            // Cambiar contraseña
            await updatePassword(user, newPassword)
            
            toast({
                title: "Éxito",
                description: "Contraseña actualizada correctamente.",
            })
            setShowPasswordDialog(false)
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
        } catch (error: any) {
            console.error('Error changing password:', error)
            if (error.code === 'auth/wrong-password') {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "La contraseña actual es incorrecta.",
                })
            } else {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "No se pudo cambiar la contraseña. Inténtalo de nuevo.",
                })
            }
        } finally {
            setIsChangingPassword(false)
        }
    }

    const handleSuspendAccount = async () => {
        try {
            const result = await suspendUserAccount();
            
            if (result.success) {
                toast({
                    title: "Cuenta Suspendida",
                    description: result.message,
                });
                // Redirigir al login después de un breve delay
                setTimeout(() => {
                    window.location.href = '/auth/login';
                }, 2000);
            } else {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: result.message,
                });
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Ocurrió un error inesperado al suspender la cuenta.",
            });
        }
    }
    
    const handleDeleteAccount = async () => {
        // Verificar que el usuario esté autenticado
        if (!user) {
            toast({
                variant: "destructive",
                title: "Error de Autenticación",
                description: "Debes estar autenticado para eliminar tu cuenta. Por favor, inicia sesión nuevamente.",
            });
            return;
        }

        try {
            const result = await deleteUserAccount();
            
            if (result.success) {
                toast({
                    title: "Cuenta Eliminada",
                    description: result.message,
                });
                // Redirigir al inicio después de un breve delay
                setTimeout(() => {
                    window.location.href = '/';
                }, 2000);
            } else {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: result.message,
                });
            }
        } catch (error: any) {
            console.error('Error eliminando cuenta:', error);
            
            let errorMessage = "Ocurrió un error inesperado al eliminar la cuenta.";
            
            // Manejar errores específicos de Firebase
            if (error?.code === 'auth/requires-recent-login') {
                errorMessage = "Por seguridad, necesitas iniciar sesión nuevamente antes de eliminar tu cuenta.";
            } else if (error?.code === 'auth/invalid-credential') {
                errorMessage = "Credenciales inválidas. Por favor, inicia sesión nuevamente.";
            } else if (error?.code === 'permission-denied') {
                errorMessage = "No tienes permisos para realizar esta acción.";
            }
            
            toast({
                variant: "destructive",
                title: "Error",
                description: errorMessage,
            });
        }
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
                    <CardTitle className="flex items-center gap-2"><ShieldQuestion className="h-5 w-5"/> Permisos de Match PUBGM</CardTitle>
                    <CardDescription>Controla qué permisos puede usar la aplicación durante las partidas de PUBG Mobile.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                            <MapPin className="h-5 w-5 text-blue-500" />
                            <div>
                                <Label htmlFor="location-permission" className="font-semibold">Ubicación</Label>
                                <p className="text-sm text-muted-foreground">Permite compartir tu ubicación para encontrar jugadores cercanos</p>
                            </div>
                        </div>
                        <Switch 
                            id="location-permission" 
                            checked={locationPermission} 
                            onCheckedChange={setLocationPermission}
                        />
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                            <Camera className="h-5 w-5 text-green-500" />
                            <div>
                                <Label htmlFor="camera-permission" className="font-semibold">Cámara</Label>
                                <p className="text-sm text-muted-foreground">Permite usar la cámara para fotos de perfil y capturas</p>
                            </div>
                        </div>
                        <Switch 
                            id="camera-permission" 
                            checked={cameraPermission} 
                            onCheckedChange={setCameraPermission}
                        />
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                            <Mic className="h-5 w-5 text-red-500" />
                            <div>
                                <Label htmlFor="microphone-permission" className="font-semibold">Micrófono</Label>
                                <p className="text-sm text-muted-foreground">Permite usar el micrófono para comunicación por voz</p>
                            </div>
                        </div>
                        <Switch 
                            id="microphone-permission" 
                            checked={microphonePermission} 
                            onCheckedChange={setMicrophonePermission}
                        />
                    </div>
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Key className="h-5 w-5"/> Seguridad</CardTitle>
                    <CardDescription>Gestiona la seguridad de tu cuenta y cambia tu contraseña.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                            <Key className="h-5 w-5 text-blue-500" />
                            <div>
                                <Label className="font-semibold">Cambiar Contraseña</Label>
                                <p className="text-sm text-muted-foreground">Actualiza tu contraseña para mantener tu cuenta segura</p>
                            </div>
                        </div>
                        <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
                            <DialogTrigger asChild>
                                <Button variant="outline">Cambiar</Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle>Cambiar Contraseña</DialogTitle>
                                    <DialogDescription>
                                        Ingresa tu contraseña actual y la nueva contraseña que deseas usar.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="current-password">Contraseña Actual</Label>
                                        <Input
                                            id="current-password"
                                            type="password"
                                            value={passwordForm.currentPassword}
                                            onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                                            placeholder="Ingresa tu contraseña actual"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="new-password">Nueva Contraseña</Label>
                                        <Input
                                            id="new-password"
                                            type="password"
                                            value={passwordForm.newPassword}
                                            onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                                            placeholder="Ingresa tu nueva contraseña"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="confirm-password">Confirmar Nueva Contraseña</Label>
                                        <Input
                                            id="confirm-password"
                                            type="password"
                                            value={passwordForm.confirmPassword}
                                            onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                            placeholder="Confirma tu nueva contraseña"
                                        />
                                    </div>
                                    <div className="bg-blue-50 p-3 rounded-lg">
                                        <p className="text-sm text-blue-800 font-medium mb-2">Consejos para una contraseña segura:</p>
                                        <ul className="text-xs text-blue-700 space-y-1">
                                            <li>• Al menos 6 caracteres (recomendado 8+)</li>
                                            <li>• Combina letras, números y símbolos</li>
                                            <li>• Evita información personal</li>
                                            <li>• No uses la misma contraseña en otros sitios</li>
                                        </ul>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button 
                                        variant="outline" 
                                        onClick={() => {
                                            setShowPasswordDialog(false)
                                            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
                                        }}
                                    >
                                        Cancelar
                                    </Button>
                                    <Button 
                                        onClick={handleChangePassword}
                                        disabled={isChangingPassword}
                                    >
                                        {isChangingPassword ? 'Cambiando...' : 'Cambiar Contraseña'}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><UserX className="h-5 w-5"/> Usuarios Bloqueados</CardTitle>
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

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Database className="h-5 w-5"/> Datos y Almacenamiento</CardTitle>
                    <CardDescription>Gestiona el almacenamiento de datos de la aplicación y opciones de limpieza.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Link href="/settings/data-storage">
                        <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                            <div className="flex items-center gap-3">
                                <Database className="h-5 w-5 text-blue-500" />
                                <div>
                                    <Label className="font-semibold cursor-pointer">Configurar Datos y Almacenamiento</Label>
                                    <p className="text-sm text-muted-foreground">Ver uso de almacenamiento, limpiar caché y exportar datos</p>
                                </div>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                    </Link>
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
