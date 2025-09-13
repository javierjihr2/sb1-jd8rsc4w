import { NextRequest, NextResponse } from 'next/server';
import { securityMiddleware } from '@/middleware/security';
import { securityHeadersMiddleware } from '@/middleware/csp';
// import { comparePlayers } from '@/ai/flows/playerComparisonFlow';
// import type { PlayerComparisonInput } from '@/ai/schemas';

export async function POST(request: NextRequest) {
  // Aplicar middleware de seguridad
  const securityResult = await securityMiddleware(request);
  if (securityResult.status !== 200) {
    return securityResult;
  }

  try {
    // const input: PlayerComparisonInput = await request.json();
    
    // const result = await comparePlayers(input);
    
    // Funcionalidad temporalmente deshabilitada debido a problemas con Genkit
    const response = NextResponse.json({
      error: 'Funcionalidad de comparación de jugadores temporalmente deshabilitada'
    }, { status: 503 });
    return response;
  } catch (error) {
    console.error('Error comparing players:', error);
    const errorResponse = NextResponse.json(
      { error: 'Error al comparar jugadores' },
      { status: 500 }
    );
    return errorResponse;
  }
}