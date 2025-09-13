"use client"

import { useState } from "react"
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
import { Edit, Trophy, Swords, Award, Plus, Trash2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import type { PlayerProfile } from "@/lib/types"

interface Achievement {
  id: string
  title: string
  description: string
  icon: 'trophy' | 'swords' | 'award'
}

interface EditStatsDialogProps {
  currentProfile: PlayerProfile
  onStatsUpdate?: (stats: PlayerProfile['stats'], level: number, achievements: Achievement[]) => void
}

const iconMap = {
  trophy: Trophy,
  swords: Swords,
  award: Award
}

const defaultAchievements: Achievement[] = [
  {
    id: '1',
    title: 'Pollo para Cenar x50',
    description: 'Gana 50 partidas.',
    icon: 'trophy'
  },
  {
    id: '2',
    title: 'Experto en Asalto',
    description: '1000 bajas con rifles de asalto.',
    icon: 'swords'
  },
  {
    id: '3',
    title: 'Rango Conquistador',
    description: 'Alcanza el máximo rango.',
    icon: 'award'
  }
]

export function EditStatsDialog({ currentProfile, onStatsUpdate }: EditStatsDialogProps) {
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [statsData, setStatsData] = useState({
    wins: currentProfile.stats.wins,
    kda: currentProfile.stats.kda,
    matches: currentProfile.stats.matches,
    level: currentProfile.level || 1
  })
  const [achievements, setAchievements] = useState<Achievement[]>(defaultAchievements)
  const [newAchievement, setNewAchievement] = useState<Omit<Achievement, 'id'>>({
    title: '',
    description: '',
    icon: 'trophy'
  })

  const handleSave = () => {
    if (onStatsUpdate) {
      onStatsUpdate(
        {
          wins: statsData.wins,
          kda: statsData.kda,
          matches: statsData.matches
        },
        statsData.level,
        achievements
      )
    }
    
    toast({
      title: "Estadísticas actualizadas",
      description: "Tus estadísticas y logros han sido actualizados correctamente.",
    })
    
    setIsOpen(false)
  }

  const addAchievement = () => {
    if (newAchievement.title && newAchievement.description) {
      const achievement: Achievement = {
        ...newAchievement,
        id: Date.now().toString()
      }
      setAchievements(prev => [...prev, achievement])
      setNewAchievement({ title: '', description: '', icon: 'trophy' })
    }
  }

  const removeAchievement = (id: string) => {
    setAchievements(prev => prev.filter(a => a.id !== id))
  }

  const updateAchievement = (id: string, field: keyof Omit<Achievement, 'id'>, value: string) => {
    setAchievements(prev => prev.map(a => 
      a.id === id ? { ...a, [field]: value } : a
    ))
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit className="mr-2 h-4 w-4" />
          Editar Estadísticas
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Estadísticas y Logros</DialogTitle>
          <DialogDescription>
            Actualiza tus estadísticas de juego y gestiona tus logros personalizados.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-6">
          {/* Estadísticas */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Estadísticas</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="level">Nivel</Label>
                <Input
                  id="level"
                  type="number"
                  min="1"
                  max="100"
                  value={statsData.level}
                  onChange={(e) => setStatsData(prev => ({ ...prev, level: parseInt(e.target.value) || 1 }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wins">Victorias</Label>
                <Input
                  id="wins"
                  type="number"
                  min="0"
                  value={statsData.wins}
                  onChange={(e) => setStatsData(prev => ({ ...prev, wins: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="matches">Partidas Jugadas</Label>
                <Input
                  id="matches"
                  type="number"
                  min="0"
                  value={statsData.matches}
                  onChange={(e) => setStatsData(prev => ({ ...prev, matches: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="kda">Ratio K/D/A</Label>
                <Input
                  id="kda"
                  type="number"
                  step="0.1"
                  min="0"
                  value={statsData.kda}
                  onChange={(e) => setStatsData(prev => ({ ...prev, kda: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>
          </div>

          {/* Logros */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Logros</h3>
            
            {/* Logros existentes */}
            <div className="space-y-3">
              {achievements.map((achievement) => {
                const IconComponent = iconMap[achievement.icon]
                return (
                  <Card key={achievement.id} className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-primary/10 rounded-full">
                        <IconComponent className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <Input
                          value={achievement.title}
                          onChange={(e) => updateAchievement(achievement.id, 'title', e.target.value)}
                          placeholder="Título del logro"
                        />
                        <Textarea
                          value={achievement.description}
                          onChange={(e) => updateAchievement(achievement.id, 'description', e.target.value)}
                          placeholder="Descripción del logro"
                          rows={2}
                        />
                        <select
                          value={achievement.icon}
                          onChange={(e) => updateAchievement(achievement.id, 'icon', e.target.value as Achievement['icon'])}
                          className="w-full p-2 border rounded-md"
                        >
                          <option value="trophy">🏆 Trofeo</option>
                          <option value="swords">⚔️ Espadas</option>
                          <option value="award">🏅 Premio</option>
                        </select>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeAchievement(achievement.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                )
              })}
            </div>

            {/* Agregar nuevo logro */}
            <Card className="p-4 border-dashed">
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Agregar Nuevo Logro
                </h4>
                <div className="space-y-2">
                  <Input
                    value={newAchievement.title}
                    onChange={(e) => setNewAchievement(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Título del logro"
                  />
                  <Textarea
                    value={newAchievement.description}
                    onChange={(e) => setNewAchievement(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descripción del logro"
                    rows={2}
                  />
                  <select
                    value={newAchievement.icon}
                    onChange={(e) => setNewAchievement(prev => ({ ...prev, icon: e.target.value as Achievement['icon'] }))}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="trophy">🏆 Trofeo</option>
                    <option value="swords">⚔️ Espadas</option>
                    <option value="award">🏅 Premio</option>
                  </select>
                  <Button onClick={addAchievement} className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar Logro
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            Guardar Cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}