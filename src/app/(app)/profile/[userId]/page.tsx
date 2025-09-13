import { friendsForComparison } from "@/lib/data"
import ProfileClient from "./profile-client"

// Función requerida para exportación estática
export async function generateStaticParams() {
  return friendsForComparison.map((user) => ({
    userId: user.id,
  }))
}

export default async function UserProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params
  return <ProfileClient userId={userId} />
}