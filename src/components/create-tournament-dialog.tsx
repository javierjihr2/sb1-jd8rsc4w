"use client"

import { useState } from "react"
import { format } from "date-fns"
import { CalendarIcon, ChevronDown, Map, Video, Shield } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { toast } from "@/hooks/use-toast"
import { Tournament } from "@/lib/types"
import { addTournament } from "@/lib/data"

interface CreateTournamentDialogProps {
  trigger?: React.ReactNode
  onTournamentCreated?: (tournament: Tournament) => void
}

const mapOptions = [
  { value: "erangel", label: "Erangel" },
  { value: "miramar", label: "Miramar" },
  { value: "sanhok", label: "Sanhok" },
  { value: "vikendi", label: "Vikendi" },
  { value: "livik", label: "Livik" },
  { value: "karakin", label: "Karakin" },
  { value: "paramo", label: "Paramo" },
  { value: "taego", label: "Taego" },
  { value: "deston", label: "Deston" },
  { value: "nusa", label: "Nusa" },
]

export function CreateTournamentDialog({ trigger, onTournamentCreated }: CreateTournamentDialogProps) {
  const [open, setOpen] = useState(false)
  const [tournamentDate, setTournamentDate] = useState<Date>()
  const [tournamentType, setTournamentType] = useState("")
  const [hasStream, setHasStream] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)

    try {
      const formData = new FormData(event.currentTarget)
      
      // Validar campos requeridos
      const name = formData.get('t-name') as string
      const prize = formData.get('t-prize') as string
      const mode = formData.get('t-mode') as string
      const region = formData.get('t-region') as string
      const maxTeams = formData.get('t-max-teams') as string

      if (!name || !prize || !mode || !region || !maxTeams || !tournamentDate) {
        toast({
          variant: "destructive",
          title: "Campos incompletos",
          description: "Por favor, completa todos los campos requeridos.",
        })
        return
      }

      // Procesar mapas seleccionados
      const maps = [
        formData.get('t-map-1') as string,
        formData.get('t-map-2') as string,
        formData.get('t-map-3') as string,
        formData.get('t-map-4') as string,
      ].filter(Boolean).map(val => mapOptions.find(m => m.value === val)?.label || val)

      // Mapear tipos de torneo
      const typeMapping: Record<string, 'Competitivo' | 'Por Puntos' | 'Evento WOW' | 'Amistoso' | 'Scrim'> = {
        'competitivo': 'Competitivo',
        'puntos': 'Por Puntos',
        'wow': 'Evento WOW',
        'amistoso': 'Amistoso',
        'scrim': 'Scrim'
      };

      const tournamentData: Tournament = {
        id: `t${Date.now()}`,
        name,
        date: format(tournamentDate, 'yyyy-MM-dd'),
        prize,
        mode: mode as 'Solo' | 'Dúo' | 'Escuadra',
        region: region as 'N.A.' | 'S.A.',
        type: typeMapping[tournamentType] || 'Competitivo',
        description: formData.get('t-description') as string || '',
        maxTeams: parseInt(maxTeams),
        maxReserves: parseInt(formData.get('t-max-reserves') as string) || 0,
        status: 'Próximamente',
        startTime: formData.get('t-time') as string,
        timeZone: formData.get('t-timezone') as string,
        infoSendTime: formData.get('t-info-send-time') as string,
        maxWithdrawalTime: formData.get('t-max-withdrawal-time') as string,
        maps: maps.length > 0 ? maps : undefined,
        streamLink: hasStream ? (formData.get('t-stream-link') as string) : undefined,
        messageTemplate: formData.get('t-message-template') as string || undefined,
        // Controles de administrador
        matchId: formData.get('t-match-id') as string,
        matchPassword: formData.get('t-match-password') as string,
        server: formData.get('t-server') as string,
        perspective: formData.get('t-perspective') as string || 'TPP',
        adminNotes: formData.get('t-admin-notes') as string,
        spectatorMode: formData.get('t-spectator-mode') === 'on',
      }

      // Crear el torneo
      addTournament(tournamentData)

      toast({
        title: "Torneo creado",
        description: `El torneo "${tournamentData.name}" ha sido creado exitosamente.`,
      })

      // Notificar al componente padre
      onTournamentCreated?.(tournamentData)

      // Resetear formulario y cerrar diálogo
      ;(event.target as HTMLFormElement).reset()
      setTournamentDate(undefined)
      setTournamentType('')
      setHasStream(false)
      setOpen(false)

    } catch (error) {
      console.error('Error creating tournament:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Hubo un error al crear el torneo. Inténtalo de nuevo.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            Crear Torneo
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Torneo</DialogTitle>
          <DialogDescription>
            Completa la información para crear un nuevo torneo.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4">
            {/* Información básica */}
            <div className="space-y-2">
              <Label htmlFor="t-name">Nombre del Torneo *</Label>
              <Input 
                id="t-name" 
                name="t-name" 
                placeholder="Ej: Copa de Verano" 
                required 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="t-type">Tipo de Torneo *</Label>
              <Select name="t-type" onValueChange={setTournamentType} required>
                <SelectTrigger id="t-type">
                  <SelectValue placeholder="Selecciona un tipo" />
                </SelectTrigger>
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
              <Label>Fecha del Torneo *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
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

            {/* Configuración específica para torneos competitivos */}
            {(tournamentType === 'competitivo' || tournamentType === 'scrim' || tournamentType === 'wow') && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="t-time">Hora de Inicio *</Label>
                    <Input id="t-time" name="t-time" type="time" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="t-timezone">Zona Horaria *</Label>
                    <Select name="t-timezone" required>
                      <SelectTrigger id="t-timezone">
                        <SelectValue placeholder="País" />
                      </SelectTrigger>
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Horario de envío de información</Label>
                    <Select name="t-info-send-time">
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar cuándo se envían los códigos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">7 minutos antes del inicio</SelectItem>
                        <SelectItem value="10">10 minutos antes del inicio</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="t-max-withdrawal-time">Horario Máx. para Bajas</Label>
                    <Input id="t-max-withdrawal-time" name="t-max-withdrawal-time" type="time" />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="t-prize">Premio *</Label>
              <Input 
                id="t-prize" 
                name="t-prize" 
                placeholder="Ej: $1,000 USD o 'Premios en UC'" 
                required 
              />
            </div>

            {/* Selección de mapas */}
            {(tournamentType === 'competitivo' || tournamentType === 'scrim' || tournamentType === 'wow') && (
              <div className="space-y-4 p-4 border rounded-lg">
                <Label className="font-semibold flex items-center gap-2">
                  <Map className="h-5 w-5 text-primary" />
                  Selección de Mapas
                </Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="t-map-1">Mapa 1</Label>
                    <Select name="t-map-1">
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar mapa" />
                      </SelectTrigger>
                      <SelectContent>
                        {mapOptions.map(m => (
                          <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="t-map-2">Mapa 2</Label>
                    <Select name="t-map-2">
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar mapa" />
                      </SelectTrigger>
                      <SelectContent>
                        {mapOptions.map(m => (
                          <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="t-map-3">Mapa 3</Label>
                    <Select name="t-map-3">
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar mapa" />
                      </SelectTrigger>
                      <SelectContent>
                        {mapOptions.map(m => (
                          <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="t-map-4">Mapa 4 (Opcional)</Label>
                    <Select name="t-map-4">
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar mapa" />
                      </SelectTrigger>
                      <SelectContent>
                        {mapOptions.map(m => (
                          <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="t-max-teams">Máximo de Equipos *</Label>
                <Input 
                  id="t-max-teams" 
                  name="t-max-teams" 
                  type="number" 
                  placeholder="Ej: 23" 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="t-max-reserves">Cantidad de Reservas</Label>
                <Input 
                  id="t-max-reserves" 
                  name="t-max-reserves" 
                  type="number" 
                  placeholder="Ej: 5" 
                  defaultValue={0}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="t-mode">Modo *</Label>
                <Select name="t-mode" required>
                  <SelectTrigger id="t-mode">
                    <SelectValue placeholder="Selecciona un modo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Solo">Solo</SelectItem>
                    <SelectItem value="Dúo">Dúo</SelectItem>
                    <SelectItem value="Escuadra">Escuadra</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="t-region">Región *</Label>
                <Select name="t-region" required>
                  <SelectTrigger id="t-region">
                    <SelectValue placeholder="Selecciona una región" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="N.A.">Norteamérica</SelectItem>
                    <SelectItem value="S.A.">Sudamérica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="t-description">Reglas y Descripción</Label>
              <Textarea 
                id="t-description" 
                name="t-description" 
                placeholder="Describe el formato del torneo, sistema de puntos, reglas de conducta, etc." 
              />
            </div>

            {/* Transmisión en vivo */}
            <div className="space-y-4 p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <Label htmlFor="has-stream" className="flex items-center gap-2 font-semibold">
                  <Video className="h-5 w-5 text-primary" />
                  ¿Habrá Transmisión en Vivo?
                </Label>
                <Switch id="has-stream" checked={hasStream} onCheckedChange={setHasStream} />
              </div>
              {hasStream && (
                <div className="space-y-2">
                  <Label htmlFor="t-stream-link">Enlace de la Transmisión</Label>
                  <Input 
                    id="t-stream-link" 
                    name="t-stream-link" 
                    placeholder="https://twitch.tv/..." 
                  />
                </div>
              )}
            </div>

            {/* Controles de administrador */}
            {(tournamentType === 'competitivo' || tournamentType === 'scrim' || tournamentType === 'wow') && (
              <div className="space-y-4 p-4 border rounded-lg bg-gradient-to-r from-orange-50 to-red-50">
                <Label className="font-semibold flex items-center gap-2 text-orange-700">
                  <Shield className="h-5 w-5" />
                  Controles de Administrador
                </Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="t-match-id">ID de Partida</Label>
                    <Input 
                      id="t-match-id" 
                      name="t-match-id" 
                      placeholder="Ej: 123456789" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="t-match-password">Contraseña de Partida</Label>
                    <Input 
                      id="t-match-password" 
                      name="t-match-password" 
                      placeholder="Ej: SQUAD2024" 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="t-server">Servidor</Label>
                    <Select name="t-server">
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
                    <Select name="t-perspective" defaultValue="TPP">
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
                    className="min-h-[80px]"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="t-spectator-mode" 
                    name="t-spectator-mode"
                  />
                  <Label htmlFor="t-spectator-mode" className="text-sm">
                    Habilitar modo espectador para streamers
                  </Label>
                </div>
              </div>
            )}

            {/* Plantilla de mensaje personalizada */}
            <Collapsible>
              <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border p-3 text-sm font-semibold text-primary data-[state=open]:bg-muted/50">
                <span>Personalizar Plantilla de Mensaje (Opcional)</span>
                <ChevronDown className="h-4 w-4 transition-transform data-[state=open]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4">
                <div className="space-y-2 p-4 border rounded-lg">
                  <Label htmlFor="t-message-template">Plantilla Específica para este Torneo</Label>
                  <Textarea 
                    id="t-message-template"
                    name="t-message-template"
                    className="min-h-[200px] font-mono text-xs"
                    placeholder="Edita esta plantilla para este torneo o déjala para usar la versión global guardada en Ajustes."
                  />
                  <p className="text-xs text-muted-foreground">
                    Si editas este campo, este torneo usará esta plantilla en lugar de la global. Puedes usar las mismas etiquetas (ej: {'{{ header }}'}).
                  </p>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creando..." : "Crear Torneo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}