import { recentChats as initialChats } from "@/lib/data"
import ChatClient from "./chat-client"

interface ChatPageProps {
  params: Promise<{
    id: string
  }>
}

// Generar parámetros estáticos para el build
export async function generateStaticParams() {
  // Obtener todos los IDs de chats disponibles
  return initialChats.map((chat) => ({
    id: chat.id,
  }))
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { id } = await params
  return <ChatClient chatId={id} />
}