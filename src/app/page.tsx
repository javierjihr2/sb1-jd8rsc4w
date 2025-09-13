
"use client"

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Swords, Users, Trophy, Zap } from 'lucide-react';
import { useAuth } from './auth-provider';

export default function LandingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    console.log('🔍 LandingPage - Verificando estado de autenticación:', {
      user: !!user,
      loading,
      userEmail: user?.email,
      pathname: typeof window !== 'undefined' ? window.location.pathname : 'unknown'
    });
    
    if (!loading && user && typeof window !== 'undefined') {
      console.log('✅ Usuario autenticado, redirigiendo a dashboard');
      
      // Usar setTimeout para evitar conflictos con RSC
      const timeoutId = setTimeout(() => {
        try {
          router.replace('/dashboard');
        } catch (error) {
          console.error('❌ Error en navegación:', error);
          // Fallback usando window.location
          window.location.href = '/dashboard';
        }
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [user, loading, router]);
  
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando SquadGO Battle...</p>
        </div>
      </div>
    );
  }

  // No mostrar loading en el primer render para evitar problemas con SSG
  // Solo mostrar loading si ya se ha inicializado Firebase
  if (loading && typeof window !== 'undefined') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  const handleLogin = () => {
    router.push('/login');
  };

  const handleRegister = () => {
    router.push('/login');
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
                <img src="/logo.png" alt="SquadGO Battle Logo" className="h-32 w-32 -mr-4" />
              <h1 className="text-5xl font-bold">
                <span className="text-yellow-400">Squad</span>
                <span className="text-white">GO</span>
                <span className="text-yellow-400"> Battle</span>
              </h1>
            </div>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            ¡Encuentra amigos ya! La plataforma definitiva para gamers competitivos. 
            Conecta con jugadores, forma tu equipo perfecto y domina el campo de batalla.
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={handleLogin} size="lg" className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 !text-white font-bold shadow-lg">
              Iniciar Sesión
            </Button>
            <Button onClick={handleRegister} size="lg" className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 !text-white font-bold shadow-lg">
              Registrarse
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="bg-black/20 border-gray-700 text-white">
            <CardHeader>
              <Users className="h-8 w-8 text-blue-400 mb-2" />
              <CardTitle>Encuentra tu Squad</CardTitle>
              <CardDescription className="text-gray-300">
                Conecta con jugadores de tu nivel y forma el equipo perfecto
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-black/20 border-gray-700 text-white">
            <CardHeader>
              <Trophy className="h-8 w-8 text-yellow-400 mb-2" />
              <CardTitle>Torneos Épicos</CardTitle>
              <CardDescription className="text-gray-300">
                Participa en competencias y demuestra tus habilidades
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-black/20 border-gray-700 text-white">
            <CardHeader>
              <Zap className="h-8 w-8 text-purple-400 mb-2" />
              <CardTitle>Matchmaking Inteligente</CardTitle>
              <CardDescription className="text-gray-300">
                Algoritmo avanzado para encontrar las mejores partidas
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            ¿Listo para dominar?
          </h2>
          <p className="text-gray-300 mb-8">
            Únete a miles de jugadores que ya están conquistando el mundo gaming
          </p>
          <Button onClick={handleRegister} size="lg" className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 !text-white font-bold shadow-lg">
            Comenzar Ahora
          </Button>
        </div>
      </div>
    </div>
  );
}
