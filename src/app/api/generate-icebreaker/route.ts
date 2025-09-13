import { NextRequest, NextResponse } from 'next/server';
// Dynamic import will be used to prevent client-side errors
import { IcebreakerInputSchema } from '@/ai/schemas';
import { securityMiddleware, getClientIP, rateLimit, logSecurityEvent } from '@/middleware/security';
import { securityHeadersMiddleware } from '@/middleware/csp';

export async function POST(request: NextRequest) {
  try {
    // Aplicar rate limiting
    const clientIP = getClientIP(request);
    if (!rateLimit(clientIP, 20, 60000)) { // 20 requests por minuto
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

    // Obtener el body sanitizado del request original
    const body = await request.json();
    const sanitizedBody = body; // El middleware ya validó la seguridad
    
    // Validate the input
    const validatedInput = IcebreakerInputSchema.parse(sanitizedBody);
    
    // Generate the icebreaker using the AI flow with dynamic import
    // const { generateIcebreaker } = await import('@/ai/flows/icebreakerFlow');
    // const result = await generateIcebreaker(validatedInput);
    // Datos mock temporales para el build
    const result = {
      icebreaker: "¡Hola! ¿Listo para una partida épica?",
      suggestions: ["Pregunta sobre su arma favorita", "Comenta sobre el mapa actual"]
    };
    
    const response = NextResponse.json(result);
    return response;
  } catch (error) {
    console.error('Error generating icebreaker:', error);
    const errorResponse = NextResponse.json(
      { error: 'Failed to generate icebreaker' },
      { status: 500 }
    );
    return securityHeadersMiddleware(request);
  }
}