// src/app/api/tournaments/route.ts

import { NextResponse } from 'next/server';
import { tournaments, developers } from '@/lib/data';

/**
 * @api {get} /api/tournaments List All Tournaments
 * @apiName GetTournaments
 * @apiGroup Tournaments
 * @apiVersion 1.0.0
 * 
 * @apiHeader {String} Authorization Developer's API Key (Bearer Token).
 * 
 * @apiSuccess {Object[]} tournaments List of tournaments.
 * @apiSuccess {String} tournaments.id Tournament ID.
 * @apiSuccess {String} tournaments.name Tournament name.
 * @apiSuccess {String} tournaments.date Tournament date.
 * @apiSuccess {String} tournaments.prize Tournament prize.
 * @apiSuccess {String} tournaments.mode Game mode ('Solo', 'Dúo', 'Escuadra').
 * @apiSuccess {String} tournaments.status Tournament status ('Abierto', 'Cerrado', 'Próximamente').
 * @apiSuccess {String} tournaments.region Tournament region ('N.A.', 'S.A.').
 * 
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     [
 *       {
 *         "id": "t1",
 *         "name": "Copa Verano 2024",
 *         "date": "2024-08-15",
 *         "prize": "$5,000",
 *         "mode": "Escuadra",
 *         "status": "Abierto",
 *         "region": "N.A."
 *       }
 *     ]
 * 
 * @apiError (401) Unauthorized The API key was not provided or is invalid.
 * @apiError (403) Forbidden The API key is valid but inactive.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ message: 'API Key no proporcionada o con formato incorrecto.' }, { status: 401 });
  }

  const apiKey = authHeader.split(' ')[1];
  const developer = developers.find(dev => dev.apiKey === apiKey);

  if (!developer) {
    return NextResponse.json({ message: 'Clave de API inválida.' }, { status: 401 });
  }
  
  if (developer.status !== 'Activo') {
      return NextResponse.json({ message: 'La clave de API está inactiva.' }, { status: 403 });
  }

  return NextResponse.json(tournaments);
}
