
"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useState } from "react"
import { Send, Search } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"


interface AddFriendDialogProps {
  children?: React.ReactNode;
  triggerButton?: React.ReactNode;
  isFilterDialog?: boolean;
}


export function AddFriendDialog({ children, triggerButton, isFilterDialog = false }: AddFriendDialogProps) {
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    
    if (isFilterDialog) {
        // Lógica para filtros
        toast({
            title: "Filtros Aplicados",
            description: "Se han actualizado los resultados de búsqueda.",
        })
    } else {
        // Lógica para añadir amigo
        const friendName = formData.get("name")
        toast({
            title: "Solicitud Enviada",
            description: `Tu solicitud de amistad para ${friendName} ha sido enviada.`,
        })
    }
    
    setIsOpen(false)
  }

  const dialogTitle = isFilterDialog ? "Filtrar Jugadores" : "Añadir Amigo";
  const dialogDescription = isFilterDialog ? "Ajusta tus preferencias para encontrar los compañeros de equipo ideales." : "Busca a un jugador por su nombre de usuario y envíale una solicitud de amistad.";
  const submitButtonIcon = isFilterDialog ? <Search className="mr-2 h-4 w-4"/> : <Send className="mr-2 h-4 w-4"/>;
  const submitButtonText = isFilterDialog ? "Aplicar Filtros" : "Enviar Solicitud";


  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {triggerButton ? triggerButton : children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>
            {dialogDescription}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
         {isFilterDialog ? (
             <div className="grid gap-4 py-4">
                 <div className="space-y-2">
                    <Label htmlFor="filter-playstyle">Estilo de Juego</Label>
                    <Select name="playstyle">
                        <SelectTrigger id="filter-playstyle">
                            <SelectValue placeholder="Cualquier Estilo" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="rusher">Rusher / Entry Fragger</SelectItem>
                            <SelectItem value="support">Soporte / Apoyo</SelectItem>
                            <SelectItem value="sniper">Francotirador / DMR</SelectItem>
                            <SelectItem value="igl">Líder Estratégico (IGL)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="filter-country">País</Label>
                    <Select name="country">
                        <SelectTrigger id="filter-country">
                            <SelectValue placeholder="Cualquier País" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ar">Argentina</SelectItem>
                            <SelectItem value="bo">Bolivia</SelectItem>
                            <SelectItem value="br">Brasil</SelectItem>
                            <SelectItem value="ca">Canadá</SelectItem>
                            <SelectItem value="cl">Chile</SelectItem>
                            <SelectItem value="co">Colombia</SelectItem>
                            <SelectItem value="cr">Costa Rica</SelectItem>
                            <SelectItem value="ec">Ecuador</SelectItem>
                            <SelectItem value="sv">El Salvador</SelectItem>
                            <SelectItem value="us">Estados Unidos</SelectItem>
                            <SelectItem value="gt">Guatemala</SelectItem>
                            <SelectItem value="hn">Honduras</SelectItem>
                            <SelectItem value="mx">México</SelectItem>
                            <SelectItem value="pa">Panamá</SelectItem>
                            <SelectItem value="py">Paraguay</SelectItem>
                            <SelectItem value="pe">Perú</SelectItem>
                            <SelectItem value="pr">Puerto Rico</SelectItem>
                            <SelectItem value="do">República Dominicana</SelectItem>
                            <SelectItem value="uy">Uruguay</SelectItem>
                            <SelectItem value="ve">Venezuela</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="filter-schedule">Horario de Juego</Label>
                    <Select name="schedule">
                        <SelectTrigger id="filter-schedule">
                            <SelectValue placeholder="Cualquier Horario" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="mañana">Mañana</SelectItem>
                            <SelectItem value="tarde">Tarde</SelectItem>
                            <SelectItem value="noche">Noche</SelectItem>
                            <SelectItem value="findesemana">Fines de Semana</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
         ) : (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nombre
              </Label>
              <Input id="name" name="name" placeholder="Ej: ProSlayer_99" className="col-span-3" required/>
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="message" className="text-right pt-2">
                Mensaje
              </Label>
              <Textarea 
                id="message" 
                name="message" 
                placeholder="¡Hola! Me gustaría que fuéramos compañeros de equipo..." 
                className="col-span-3" 
              />
            </div>
          </div>
          )}
          <DialogFooter>
            <Button type="submit">
                {submitButtonIcon}
                {submitButtonText}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
