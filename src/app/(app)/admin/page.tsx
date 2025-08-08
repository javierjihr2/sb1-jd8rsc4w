
"use client"

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
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Code, UserPlus } from "lucide-react"

export default function AdminPage() {
  const { toast } = useToast()

  const handleCreateProfile = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    // Here you would typically handle form submission, e.g., send data to a server.
    toast({
      title: "Perfil Creado",
      description: "El perfil de desarrollador ha sido creado con éxito.",
    })
  }

  return (
    <div className="space-y-8">
       <div>
          <h1 className="text-3xl font-bold">Panel de Administración</h1>
          <p className="text-muted-foreground">Gestiona los perfiles y configuraciones de la aplicación.</p>
        </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5 text-primary" />
            Crear Perfil de Desarrollador
          </CardTitle>
          <CardDescription>
            Añade un nuevo perfil de desarrollador o creador al sistema.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleCreateProfile}>
          <CardContent className="grid gap-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre de Usuario</Label>
                <Input id="name" placeholder="Ej: SuperDev" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input id="email" type="email" placeholder="dev@example.com" required />
              </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="role">Rol</Label>
                <Select required>
                    <SelectTrigger id="role">
                        <SelectValue placeholder="Selecciona un rol" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="developer">Desarrollador</SelectItem>
                        <SelectItem value="creator">Creador de Contenido</SelectItem>
                        <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                </Select>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit">
              <UserPlus className="mr-2 h-4 w-4" />
              Crear Perfil
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
