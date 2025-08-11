

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
import { playerProfile } from "@/lib/data"
import { Edit } from "lucide-react"
import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"

export function EditProfileDialog() {
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    // Aquí iría la lógica para guardar los datos en el servidor
    // Por ahora, solo mostramos una notificación
    toast({
      title: "Perfil Actualizado",
      description: "Tus cambios han sido guardados con éxito.",
    })
    setIsOpen(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="mt-4 sm:mb-2 w-full sm:w-auto">
          <Edit className="mr-2 h-4 w-4" />
          Editar Perfil
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Perfil</DialogTitle>
          <DialogDescription>
            Realiza cambios en tu perfil aquí. Haz clic en guardar cuando hayas terminado.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nombre
              </Label>
              <Input id="name" defaultValue={playerProfile.name} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="bio" className="text-right pt-2">
                Biografía
              </Label>
              <Textarea id="bio" defaultValue={playerProfile.bio} className="col-span-3" />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="avatarUrl" className="text-right">
                URL del Avatar
              </Label>
              <Input id="avatarUrl" defaultValue={playerProfile.avatarUrl} className="col-span-3" />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="country" className="text-right">
                    País
                </Label>
                <Select defaultValue={playerProfile.countryCode}>
                    <SelectTrigger id="country" className="col-span-3">
                        <SelectValue placeholder="Selecciona tu país" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="AR">Argentina</SelectItem>
                        <SelectItem value="BO">Bolivia</SelectItem>
                        <SelectItem value="BR">Brasil</SelectItem>
                        <SelectItem value="CA">Canadá</SelectItem>
                        <SelectItem value="CL">Chile</SelectItem>
                        <SelectItem value="CO">Colombia</SelectItem>
                        <SelectItem value="CR">Costa Rica</SelectItem>
                        <SelectItem value="EC">Ecuador</SelectItem>
                        <SelectItem value="SV">El Salvador</SelectItem>
                        <SelectItem value="US">Estados Unidos</SelectItem>
                        <SelectItem value="GT">Guatemala</SelectItem>
                        <SelectItem value="HN">Honduras</SelectItem>
                        <SelectItem value="MX">México</SelectItem>
                        <SelectItem value="PA">Panamá</SelectItem>
                        <SelectItem value="PY">Paraguay</SelectItem>
                        <SelectItem value="PE">Perú</SelectItem>
                        <SelectItem value="PR">Puerto Rico</SelectItem>
                        <SelectItem value="DO">República Dominicana</SelectItem>
                        <SelectItem value="UY">Uruguay</SelectItem>
                        <SelectItem value="VE">Venezuela</SelectItem>
                    </SelectContent>
                </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Guardar Cambios</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
