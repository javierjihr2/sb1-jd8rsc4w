
import { tournaments } from "@/lib/data"
import TournamentChatClient from './chat-client'

// Función requerida para exportación estática
export async function generateStaticParams() {
  return tournaments.map((tournament) => ({
    id: tournament.id,
  }))
}

export default async function TournamentChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TournamentChatClient tournamentId={id} />;
}
