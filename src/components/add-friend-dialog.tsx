
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
import { Send } from "lucide-react"

export function AddFriendDialog({ children }: { children: React.ReactNode }) {
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const friendName = formData.get("name")
    
    toast({
      title: "Solicitud Enviada",
      description: `Tu solicitud de amistad para ${friendName} ha sido enviada.`,
    })
    setIsOpen(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Añadir Amigo</DialogTitle>
          <DialogDescription>
            Busca a un jugador por su nombre de usuario y envíale una solicitud de amistad.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
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
          <DialogFooter>
            <Button type="submit">
                <Send className="mr-2 h-4 w-4"/>
                Enviar Solicitud
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
