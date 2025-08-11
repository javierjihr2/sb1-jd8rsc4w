// src/app/api/tournaments/[id]/route.ts

import { NextResponse } from 'next/server';
import { tournaments, developers } from '@/lib/data';

/**
 * @api {get} /api/tournaments/:id Get Tournament Details
 * @apiName GetTournamentById
 * @apiGroup Tournaments
 * @apiVersion 1.0.0
 * 
 * @apiHeader {String} Authorization Developer's API Key (Bearer Token).
 * 
 * @apiParam {String} id Unique ID of the tournament.
 * 
 * @apiSuccess {String} id Tournament ID.
 * @apiSuccess {String} name Tournament name.
 * @apiSuccess {String} date Tournament date.
 * @apiSuccess {String} prize Tournament prize.
 * @apiSuccess {String} mode Game mode.
 * @apiSuccess {String} status Tournament status.
 * @apiSuccess {String} region Tournament region.
 * @apiSuccess {String} [description] Tournament description.
 * @apiSuccess {Number} [maxTeams] Maximum number of teams.
 * @apiSuccess {String[]} [maps] List of maps for the tournament.
 * 
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "id": "t1",
 *       "name": "Copa Verano 2024",
 *       "date": "2024-08-15",
 *       "prize": "$5,000",
 *       "mode": "Escuadra",
 *       "status": "Abierto",
 *       "region": "N.A."
 *     }
 * 
 * @apiError (401) Unauthorized The API key was not provided or is invalid.
 * @apiError (403) Forbidden The API key is valid but inactive.
 * @apiError (404) NotFound No tournament with the provided ID was found.
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
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
  
  const tournament = tournaments.find(t => t.id === params.id);

  if (!tournament) {
    return NextResponse.json({ message: 'Torneo no encontrado.' }, { status: 404 });
  }

  return NextResponse.json(tournament);
}
