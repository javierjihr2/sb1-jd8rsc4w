"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/app/auth-provider"
import { Check, Crown, Star, CreditCard, Zap } from "lucide-react"
import { subscriptionPlans } from "@/lib/data"
import { getAllSubscriptions, createSubscription } from "@/lib/database"
import type { Subscription, SubscriptionPlan } from "@/lib/types"
import { PaymentDialog } from "@/components/payment-dialog"

export default function SubscriptionPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null)
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      if (!user) return
      
      try {
        // Mock subscription data for now
        const subscription = null // No current subscription
        const availablePlans = subscriptionPlans // Use static plans from data file
        
        setCurrentSubscription(subscription)
        setPlans(availablePlans)
      } catch (error) {
        console.error('Error loading subscription data:', error)
        setPlans(subscriptionPlans)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user])

  const handleSubscribe = (plan: SubscriptionPlan) => {
    if (!user) {
      toast({
        title: "Error",
        description: "Debes iniciar sesión para suscribirte",
        variant: "destructive"
      })
      return
    }

    setSelectedPlan(plan)
    setShowPaymentDialog(true)
  }

  const onPaymentSuccess = () => {
    setShowPaymentDialog(false)
    toast({
      title: "¡Suscripción exitosa!",
      description: "Ahora puedes crear torneos ilimitados",
    })
    // Recargar datos de suscripción
    if (user) {
      // Mock: No subscription for now
      setCurrentSubscription(null)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Conviértete en Creador de Contenido</h1>
        <p className="text-xl text-muted-foreground mb-6">
          Únete a la élite de creadores: crea torneos, ofrece servicios, construye tu comunidad y monetiza tu pasión por PUBG Mobile
        </p>
        
        {currentSubscription && (
          <div className="mb-6">
            <Badge variant="default" className="text-lg px-4 py-2">
              <Crown className="w-4 h-4 mr-2" />
              Suscripción Activa
            </Badge>
            <p className="text-sm text-muted-foreground mt-2">
              Válida hasta: {new Date(currentSubscription.endDate).toLocaleDateString()}
            </p>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {plans.map((plan, index) => {
          const isPopular = index === 1
          const isCurrentPlan = currentSubscription?.planId === plan.id
          
          return (
            <Card key={plan.id} className={`relative ${isPopular ? 'border-primary shadow-lg scale-105' : ''}`}>
              {isPopular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-4 py-1">
                    <Star className="w-3 h-3 mr-1" />
                    Más Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">${plan.price}</span>
                  <span className="text-muted-foreground">/mes</span>
                </div>
              </CardHeader>
              
              <CardContent>
                <ul className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              
              <CardFooter>
                {isCurrentPlan ? (
                  <Button disabled className="w-full">
                    <Crown className="w-4 h-4 mr-2" />
                    Plan Actual
                  </Button>
                ) : currentSubscription ? (
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => handleSubscribe(plan)}
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Cambiar Plan
                  </Button>
                ) : (
                  <Button 
                    className={`w-full ${isPopular ? 'bg-primary hover:bg-primary/90' : ''}`}
                    onClick={() => handleSubscribe(plan)}
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Suscribirse
                  </Button>
                )}
              </CardFooter>
            </Card>
          )
        })}
      </div>

      <div className="mt-12 text-center">
        <h2 className="text-2xl font-bold mb-4">Beneficios Exclusivos de Creador</h2>
        <div className="grid md:grid-cols-4 gap-6 max-w-5xl mx-auto">
          <div className="text-center">
            <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Torneos Ilimitados</h3>
            <p className="text-sm text-muted-foreground">
              Crea y gestiona torneos sin límites con herramientas profesionales
            </p>
          </div>
          
          <div className="text-center">
            <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Crown className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Servicios Premium</h3>
            <p className="text-sm text-muted-foreground">
              Ofrece coaching, análisis y servicios personalizados a la comunidad
            </p>
          </div>
          
          <div className="text-center">
            <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Star className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Monetización</h3>
            <p className="text-sm text-muted-foreground">
              Genera ingresos con tus servicios y contenido especializado
            </p>
          </div>
          
          <div className="text-center">
            <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Herramientas Pro</h3>
            <p className="text-sm text-muted-foreground">
              Analytics avanzados, streaming integrado y soporte prioritario 24/7
            </p>
          </div>
        </div>
      </div>

      {selectedPlan && (
        <PaymentDialog
          open={showPaymentDialog}
          onOpenChange={setShowPaymentDialog}
          plan={selectedPlan}
          onSuccess={onPaymentSuccess}
        />
      )}
    </div>
  )
}