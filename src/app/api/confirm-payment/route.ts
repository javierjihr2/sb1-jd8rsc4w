import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createSubscription, savePaymentMethod } from '@/lib/database';
import { securityMiddleware, getClientIP, rateLimit, logSecurityEvent } from '@/middleware/security';
import { securityHeadersMiddleware } from '@/middleware/csp';

interface ConfirmPaymentBody {
  paymentIntentId?: string;
  userId?: string;
  planId?: string;
  paymentMethodData?: any;
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export async function POST(request: NextRequest) {
  try {
    // Aplicar rate limiting
    const clientIP = getClientIP(request);
    if (!rateLimit(clientIP, 10, 60000)) { // 10 requests por minuto
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
    const { paymentIntentId, userId, planId, paymentMethodData } = (body as ConfirmPaymentBody) || {};

    if (!paymentIntentId || !userId || !planId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Retrieve the payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json(
        { error: 'Payment not completed' },
        { status: 400 }
      );
    }

    // Save payment method if provided
    if (paymentMethodData) {
      await savePaymentMethod(paymentMethodData);
    }

    // Create subscription in database
    const subscription = await createSubscription({
      userId,
      planId,
      status: 'active',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      paymentMethod: 'stripe',
      paymentId: paymentIntentId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    const response = NextResponse.json({
      success: true,
      subscription,
    });
    return response;
  } catch (error) {
    console.error('Error confirming payment:', error);
    const errorResponse = NextResponse.json(
      { error: 'Failed to confirm payment' },
      { status: 500 }
    );
    return errorResponse;
  }
}