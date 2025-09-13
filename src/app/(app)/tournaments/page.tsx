
"use client"

import { useState } from "react"
import { Plus, Loader2, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TournamentList } from "@/components/tournament-list"
import { TournamentDetails } from "@/components/tournament-details"
import { Tournament } from "@/lib/types"
import { useTournaments } from "@/hooks/use-tournaments"
import { useUserStore } from "@/store"

const ADMIN_EMAIL = "javiercastillo.dev@gmail.com"

export default function TournamentsPage() {
  const { user } = useUserStore()
  const { tournaments, isLoading, error } = useTournaments()
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null)

  const isAdmin = user?.email === ADMIN_EMAIL

  const handleTournamentSelect = (tournament: Tournament) => {
    setSelectedTournament(tournament)
  }

  const handleBackToList = () => {
    setSelectedTournament(null)
  }



  if (selectedTournament) {
    return (
      <div className="container mx-auto px-4 py-6">
        <TournamentDetails 
          tournament={selectedTournament} 
          onBack={handleBackToList}
        />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Torneos</h1>
          <p className="text-muted-foreground mt-1">
            Descubre y participa en torneos de PUBG Mobile
          </p>
        </div>
        
        {isAdmin && (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Crear Torneo
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Cargando torneos...</span>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center py-12 text-red-500">
          <AlertTriangle className="h-8 w-8 mr-2" />
          <span>Error: {error}</span>
        </div>
      ) : (
        <TournamentList 
          showCreateButton={isAdmin}
        />
      )}
    </div>
  )
}
