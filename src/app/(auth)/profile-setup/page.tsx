"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/app/auth-provider"
import { useRouter } from "next/navigation"
import { ProfileSetupForm } from "@/components/profile-setup-form"
import { getUserProfile } from "@/lib/database"
import { Loader2 } from "lucide-react"

export default function ProfileSetupPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkUserProfile = async () => {
      if (!loading && !user) {
        router.push('/login');
        return;
      }

      if (user) {
        try {
          const profile = await getUserProfile(user.uid);
          if (profile && profile.nickname) {
            // El usuario ya tiene un perfil completo, redirigir al dashboard
            router.push('/dashboard');
            return;
          }
        } catch (error) {
          console.error('Error checking user profile:', error);
        }
      }
      
      setChecking(false);
    };

    checkUserProfile();
  }, [user, loading, router]);

  const handleProfileComplete = () => {
    router.push('/dashboard');
  };

  if (loading || checking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // El useEffect se encargará de la redirección
  }

  return (
    <div className="min-h-screen bg-background">
      <ProfileSetupForm onComplete={handleProfileComplete} />
    </div>
  );
}