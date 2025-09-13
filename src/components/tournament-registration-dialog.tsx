"use client"

import { useState } from "react"
import { Users, User, Crown } from "lucide-react"
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
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/hooks/use-toast"
import { Tournament } from "@/lib/types"
import { useAuth } from "@/hooks/use-auth"

interface TournamentRegistrationDialogProps {
  tournament: Tournament
  trigger: React.ReactNode
  onRegistrationComplete: (success: boolean) => void
}

export function TournamentRegistrationDialog({
  tournament,
  trigger,
  onRegistrationComplete
}: TournamentRegistrationDialogProps) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [teamMembers, setTeamMembers] = useState<string[]>(['', '', ''])

  const isTeamMode = tournament.mode === 'Escuadra'
  const isDuoMode = tournament.mode === 'Dúo'
  const isSoloMode = tournament.mode === 'Solo'

  const getRequiredMembers = () => {
    if (isSoloMode) return 1
    if (isDuoMode) return 2
    return 4 // Escuadra
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)

    try {
      const formData = new FormData(event.currentTarget)
      const teamName = formData.get('team-name') as string
      const notes = formData.get('notes') as string

      // Validar datos según el modo
      if (isTeamMode || isDuoMode) {
        if (!teamName?.trim()) {
          toast({
            variant: "destructive",
            title: "Nombre de equipo requerido",
            description: `Debes proporcionar un nombre para tu ${isDuoMode ? 'dúo' : 'escuadra'}.`,
          })
          return
        }

        const requiredMembers = getRequiredMembers() - 1 // -1 porque el usuario actual es automático
        const validMembers = teamMembers.slice(0, requiredMembers).filter(member => member.trim())
        
        if (validMembers.length < requiredMembers) {
          toast({
            variant: "destructive",
            title: "Miembros incompletos",
            description: `Debes agregar ${requiredMembers} ${requiredMembers === 1 ? 'compañero' : 'compañeros'} más para completar tu ${isDuoMode ? 'dúo' : 'escuadra'}.`,
          })
          return
        }
      }

      // Simular registro (aquí se llamaría a la función real)
      // await registerForTournament(tournament.id, user.id, user.name, teamName, validMembers)
      
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simular delay

      toast({
        title: "¡Inscripción exitosa!",
        description: `Te has inscrito correctamente al torneo "${tournament.name}".`,
      })

      onRegistrationComplete(true)
      setOpen(false)
      
      // Reset form
      ;(event.target as HTMLFormElement).reset()
      setTeamMembers(['', '', ''])

    } catch (error) {
      console.error('Error registering for tournament:', error)
      toast({
        variant: "destructive",
        title: "Error en la inscripción",
        description: "Hubo un problema al procesar tu inscripción. Inténtalo de nuevo.",
      })
      onRegistrationComplete(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const updateTeamMember = (index: number, value: string) => {
    const newMembers = [...teamMembers]
    newMembers[index] = value
    setTeamMembers(newMembers)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isSoloMode && <User className="h-5 w-5" />}
            {isDuoMode && <Users className="h-5 w-5" />}
            {isTeamMode && <Crown className="h-5 w-5" />}
            Inscribirse al Torneo
          </DialogTitle>
          <DialogDescription>
            Completa la información para inscribirte a "{tournament.name}"
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Información del torneo */}
          <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Modo:</span>
              <Badge variant="outline">{tournament.mode}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Participantes:</span>
              <span className="text-sm">{getRequiredMembers()} {getRequiredMembers() === 1 ? 'jugador' : 'jugadores'}</span>
            </div>
            {tournament.prize && (
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Premio:</span>
                <span className="text-sm font-semibold text-primary">{tournament.prize}</span>
              </div>
            )}
          </div>

          <Separator />

          {/* Información del usuario */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Capitán del {isDuoMode ? 'dúo' : isTeamMode ? 'equipo' : 'participante'}</Label>
            <div className="flex items-center gap-2 p-2 bg-muted/30 rounded">
              <Crown className="h-4 w-4 text-yellow-500" />
              <span className="font-medium">{user?.displayName || 'Tu nombre'}</span>
              <Badge variant="secondary" className="ml-auto">Tú</Badge>
            </div>
          </div>

          {/* Nombre del equipo/dúo */}
          {(isTeamMode || isDuoMode) && (
            <div className="space-y-2">
              <Label htmlFor="team-name">
                Nombre del {isDuoMode ? 'Dúo' : 'Equipo'} *
              </Label>
              <Input
                id="team-name"
                name="team-name"
                placeholder={`Ej: ${isDuoMode ? 'Dúo Dinámico' : 'Los Conquistadores'}`}
                required
              />
            </div>
          )}

          {/* Miembros del equipo */}
          {(isTeamMode || isDuoMode) && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">
                {isDuoMode ? 'Compañero' : 'Miembros del Equipo'} *
              </Label>
              {teamMembers.slice(0, getRequiredMembers() - 1).map((member, index) => (
                <div key={index} className="space-y-1">
                  <Label htmlFor={`member-${index}`} className="text-xs text-muted-foreground">
                    {isDuoMode ? 'Compañero' : `Miembro ${index + 1}`}
                  </Label>
                  <Input
                    id={`member-${index}`}
                    value={member}
                    onChange={(e) => updateTeamMember(index, e.target.value)}
                    placeholder="Nombre del jugador"
                    required
                  />
                </div>
              ))}
              <p className="text-xs text-muted-foreground">
                Asegúrate de que todos los miembros estén de acuerdo con participar.
              </p>
            </div>
          )}

          {/* Notas adicionales */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notas adicionales (opcional)</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Información adicional, experiencia previa, etc."
              className="min-h-[80px]"
            />
          </div>

          {/* Términos y condiciones */}
          <div className="p-3 bg-muted/30 rounded-lg">
            <p className="text-xs text-muted-foreground">
              Al inscribirte, aceptas cumplir con las reglas del torneo y las políticas de la plataforma.
              {tournament.description && " Revisa la descripción del torneo para más detalles."}
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Inscribiendo..." : "Confirmar Inscripción"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}