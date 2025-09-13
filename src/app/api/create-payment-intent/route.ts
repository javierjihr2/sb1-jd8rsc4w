import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { securityMiddleware, getClientIP, rateLimit, logSecurityEvent } from '@/middleware/security';
import { securityHeadersMiddleware } from '@/middleware/csp';

interface PaymentIntentBody {
  amount?: number;
  currency?: string;
  planId?: string;
  userId?: string;
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export async function POST(request: NextRequest) {
  try {
    // Aplicar rate limiting
    const clientIP = getClientIP(request);
    if (!rateLimit(clientIP, 5, 60000)) { // 5 requests por minuto para pagos
      logSecurityEvent({
        type: 'RATE_LIMIT',
        ip: clientIP,
        userAgent: request.headers.get('user-agent') || undefined
      });
      return NextResponse.json(
        { error: 'Demasiadas solicitudes. Intenta de nuevo más tarde.' },
        { status: 429 }
      );
    }

    // Aplicar middleware de seguridad
    const securityResult = await securityMiddleware(request);
    if (securityResult.status !== 200) {
      return securityResult;
    }

    // Obtener el body del request original
    const body = await request.json();
    const { amount, currency = 'usd', planId, userId } = (body as PaymentIntentBody) || {};

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe expects amount in cents
      currency,
      metadata: {
        planId: planId || null,
        userId: userId || null,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    const response = NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
    return response;
  } catch (error) {
    console.error('Error creating payment intent:', error);
    const errorResponse = NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
    return errorResponse;
  }
}