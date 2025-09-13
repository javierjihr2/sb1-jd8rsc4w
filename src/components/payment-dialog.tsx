"use client"

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/app/auth-provider"
import { CreditCard, Shield, Lock } from "lucide-react"
import type { SubscriptionPlan } from "@/lib/types"

import { loadStripe } from '@stripe/stripe-js'

const stripePromise = loadStripe((process.env as any).NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface PaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  plan: SubscriptionPlan
  onSuccess: () => void
}

export function PaymentDialog({ open, onOpenChange, plan, onSuccess }: PaymentDialogProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal'>('card')
  const [loading, setLoading] = useState(false)
  const [cardData, setCardData] = useState({
    number: '',
    expiry: '',
    cvc: '',
    name: ''
  })
  const [paypalEmail, setPaypalEmail] = useState('')

  const handlePayment = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Debes estar autenticado para realizar un pago.",
      })
      return
    }

    if (paymentMethod === 'card' && (!cardData.number || !cardData.expiry || !cardData.cvc || !cardData.name)) {
      toast({
        variant: "destructive",
        title: "Campos Incompletos",
        description: "Por favor, completa todos los campos de la tarjeta.",
      })
      return
    }

    if (paymentMethod === 'paypal' && !paypalEmail) {
      toast({
        variant: "destructive",
        title: "Campo Incompleto",
        description: "Por favor, ingresa tu email de PayPal.",
      })
      return
    }

    setLoading(true)

    try {
      // Create payment intent
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: plan.price * 100, // Convert to cents
          currency: 'usd',
          planId: plan.id,
          userId: user.uid,
        }),
      })

      const { clientSecret, paymentIntentId } = await response.json()

      if (!clientSecret) {
        throw new Error('Failed to create payment intent')
      }

      const stripe = await stripePromise
      if (!stripe) {
        throw new Error('Stripe failed to load')
      }

      // For card payments, use Stripe
      if (paymentMethod === 'card') {
        // In a real implementation, you would use Stripe Elements
        // For demo purposes, we'll simulate a successful payment
        // In a real implementation, you would use Stripe Elements
        console.log('Processing payment with card data:', cardData)
        
        // Simulate payment processing delay
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      // Confirm payment and create subscription
      const confirmResponse = await fetch('/api/confirm-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentIntentId,
          userId: user.uid,
          planId: plan.id,
          paymentMethodData: {
            userId: user.uid,
            type: paymentMethod,
            isDefault: true,
            createdAt: new Date().toISOString(),
            ...(paymentMethod === 'card' ? {
              last4: cardData.number.slice(-4),
              brand: 'visa',
              stripePaymentMethodId: `pm_${Date.now()}`
            } : {
              email: paypalEmail,
              paypalPaymentMethodId: `pp_${Date.now()}`
            })
          },
        }),
      })

      const confirmResult = await confirmResponse.json()

      if (!confirmResult.success) {
        throw new Error('Failed to confirm payment')
      }

      toast({
        title: "¡Pago exitoso!",
        description: `Te has suscrito al ${plan.name}. ¡Bienvenido como creador!`,
      })
      onSuccess()

    } catch (error) {
      console.error('Error processing payment:', error)
      toast({
        variant: "destructive",
        title: "Error en el pago",
        description: error instanceof Error ? error.message : "Hubo un problema procesando tu pago. Inténtalo de nuevo.",
      })
    } finally {
      setLoading(false)
    }
  }

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    const matches = v.match(/\d{4,16}/g)
    const match = matches && matches[0] || ''
    const parts = []
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }
    if (parts.length) {
      return parts.join(' ')
    } else {
      return v
    }
  }

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4)
    }
    return v
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Completar Suscripción</DialogTitle>
          <DialogDescription>
            Suscríbete al {plan.name} por ${plan.price}/mes
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Resumen del plan */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-medium">{plan.name}</span>
              <span className="font-bold">${plan.price}/mes</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {plan.description}
            </p>
          </div>

          {/* Método de pago */}
          <div className="space-y-4">
            <Label>Método de Pago</Label>
            <Select value={paymentMethod} onValueChange={(value: 'card' | 'paypal') => setPaymentMethod(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="card">
                  <div className="flex items-center">
                    <CreditCard className="w-4 h-4 mr-2" />
                    Tarjeta de Crédito/Débito
                  </div>
                </SelectItem>
                <SelectItem value="paypal">
                  <div className="flex items-center">
                    <div className="w-4 h-4 mr-2 bg-blue-600 rounded-sm" />
                    PayPal
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Formulario de pago */}
          {paymentMethod === 'card' ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cardNumber">Número de Tarjeta</Label>
                <Input
                  id="cardNumber"
                  placeholder="1234 5678 9012 3456"
                  value={cardData.number}
                  onChange={(e) => setCardData(prev => ({ ...prev, number: formatCardNumber(e.target.value) }))}
                  maxLength={19}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expiry">Vencimiento</Label>
                  <Input
                    id="expiry"
                    placeholder="MM/AA"
                    value={cardData.expiry}
                    onChange={(e) => setCardData(prev => ({ ...prev, expiry: formatExpiry(e.target.value) }))}
                    maxLength={5}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cvc">CVC</Label>
                  <Input
                    id="cvc"
                    placeholder="123"
                    value={cardData.cvc}
                    onChange={(e) => setCardData(prev => ({ ...prev, cvc: e.target.value.replace(/\D/g, '') }))}
                    maxLength={4}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cardName">Nombre en la Tarjeta</Label>
                <Input
                  id="cardName"
                  placeholder="Juan Pérez"
                  value={cardData.name}
                  onChange={(e) => setCardData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="paypalEmail">Email de PayPal</Label>
                <Input
                  id="paypalEmail"
                  type="email"
                  placeholder="tu@email.com"
                  value={paypalEmail}
                  onChange={(e) => setPaypalEmail(e.target.value)}
                />
              </div>
              <div className="text-sm text-muted-foreground">
                Serás redirigido a PayPal para completar el pago de forma segura.
              </div>
            </div>
          )}

          <Separator />

          {/* Información de seguridad */}
          <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
            <Shield className="w-4 h-4" />
            <span>Pago seguro y encriptado</span>
            <Lock className="w-4 h-4" />
          </div>

          {/* Botones */}
          <div className="flex space-x-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1"
              onClick={handlePayment}
              disabled={loading || 
                (paymentMethod === 'card' && (!cardData.number || !cardData.expiry || !cardData.cvc || !cardData.name)) ||
                (paymentMethod === 'paypal' && !paypalEmail)
              }
            >
              {loading ? 'Procesando...' : `Pagar $${plan.price}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}