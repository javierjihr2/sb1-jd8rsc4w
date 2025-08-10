// src/app/api/tournaments/route.ts

import { NextResponse } from 'next/server';
import { tournaments, developers } from '@/lib/data';

/**
 * @api {get} /api/tournaments Listar todos los torneos
 * @apiName GetTournaments
 * @apiGroup Tournaments
 * @apiVersion 1.0.0
 * 
 * @apiHeader {String} Authorization Clave de API del desarrollador (Bearer Token).
 * 
 * @apiSuccess {Object[]} tournaments Lista de torneos.
 * @apiSuccess {String} tournaments.id ID del torneo.
 * @apiSuccess {String} tournaments.name Nombre del torneo.
 * @apiSuccess {String} tournaments.date Fecha del torneo.
 * @apiSuccess {String} tournaments.prize Premio del torneo.
 * @apiSuccess {String} tournaments.mode Modo de juego ('Solo', 'Dúo', 'Escuadra').
 * @apiSuccess {String} tournaments.status Estado del torneo ('Abierto', 'Cerrado', 'Próximamente').
 * @apiSuccess {String} tournaments.region Región del torneo ('N.A.', 'S.A.').
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
 * @apiError (401) Unauthorized La clave de API no fue proporcionada o no es válida.
 * @apiError (403) Forbidden La clave de API es válida pero está inactiva.
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
