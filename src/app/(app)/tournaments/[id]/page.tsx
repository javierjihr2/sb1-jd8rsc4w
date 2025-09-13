
import { tournaments } from "@/lib/data"
import TournamentDetailClient from './tournament-detail-client'

// Función requerida para exportación estática
export async function generateStaticParams() {
  return tournaments.map((tournament) => ({
    id: tournament.id,
  }))
}

export default async function TournamentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TournamentDetailClient tournamentId={id} />;
}
