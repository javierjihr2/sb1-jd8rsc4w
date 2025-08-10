// src/app/api/tournaments/[id]/route.ts

import { NextResponse } from 'next/server';
import { tournaments, developers } from '@/lib/data';

/**
 * @api {get} /api/tournaments/:id Obtener detalles de un torneo
 * @apiName GetTournamentById
 * @apiGroup Tournaments
 * @apiVersion 1.0.0
 * 
 * @apiHeader {String} Authorization Clave de API del desarrollador (Bearer Token).
 * @apiParam {String} id ID único del torneo.
 * 
 * @apiSuccess {String} id ID del torneo.
 * @apiSuccess {String} name Nombre del torneo.
 * @apiSuccess {String} date Fecha del torneo.
 * @apiSuccess {String} prize Premio del torneo.
 * @apiSuccess {String} mode Modo de juego.
 * @apiSuccess {String} status Estado del torneo.
 * @apiSuccess {String} region Región del torneo.
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
 * @apiError (401) Unauthorized La clave de API no fue proporcionada o no es válida.
 * @apiError (403) Forbidden La clave de API es válida pero está inactiva.
 * @apiError (404) NotFound No se encontró ningún torneo con el ID proporcionado.
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
