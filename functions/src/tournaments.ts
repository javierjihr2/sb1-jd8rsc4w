import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

const db = admin.firestore();

// Create Tournament
export const createTournament = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const {
    name,
    description,
    game,
    format,
    maxParticipants,
    entryFee,
    prizePool,
    startDate,
    registrationDeadline,
    rules
  } = data;
  
  const userId = context.auth.uid;

  try {
    // Get user data
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'User not found');
    }

    const userData = userDoc.data()!;
    const tournamentData = {
      name,
      description,
      game,
      format,
      maxParticipants,
      entryFee: entryFee || 0,
      prizePool: prizePool || 0,
      startDate: new Date(startDate),
      registrationDeadline: new Date(registrationDeadline),
      rules: rules || [],
      organizer: {
        id: userId,
        username: userData.username,
        displayName: userData.displayName
      },
      participants: [],
      status: 'registration',
      bracket: null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    };

    const tournamentRef = await db.collection('tournaments').add(tournamentData);
    return { tournamentId: tournamentRef.id };
  } catch (error) {
    console.error('Error creating tournament:', error);
    throw new functions.https.HttpsError('internal', 'Failed to create tournament');
  }
});

// Join Tournament
export const joinTournament = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { tournamentId } = data;
  const userId = context.auth.uid;

  try {
    const result = await db.runTransaction(async (transaction: admin.firestore.Transaction) => {
      const tournamentRef = db.collection('tournaments').doc(tournamentId);
      const tournamentDoc = await transaction.get(tournamentRef);

      if (!tournamentDoc.exists) {
        throw new Error('Tournament not found');
      }

      const tournamentData = tournamentDoc.data()!;
      
      if (tournamentData.status !== 'registration') {
        throw new Error('Tournament registration is closed');
      }

      if (tournamentData.participants.length >= tournamentData.maxParticipants) {
        throw new Error('Tournament is full');
      }

      if (tournamentData.participants.some((p: any) => p.id === userId)) {
        throw new Error('Already registered for this tournament');
      }

      // Get user data
      const userDoc = await db.collection('users').doc(userId).get();
      if (!userDoc.exists) {
        throw new Error('User not found');
      }

      const userData = userDoc.data()!;
      const participant = {
        id: userId,
        username: userData.username,
        displayName: userData.displayName,
        avatar: userData.avatar || null,
        joinedAt: FieldValue.serverTimestamp()
      };

      transaction.update(tournamentRef, {
        participants: FieldValue.arrayUnion(participant),
        updatedAt: FieldValue.serverTimestamp()
      });

      return { success: true };
    });

    return result;
  } catch (error) {
    console.error('Error joining tournament:', error);
    throw new functions.https.HttpsError('internal', (error as Error).message || 'Failed to join tournament');
  }
});

// Report Match Result
export const reportMatch = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { tournamentId, matchId, winnerId, score, proof } = data;
  const userId = context.auth.uid;

  try {
    const result = await db.runTransaction(async (transaction: admin.firestore.Transaction) => {
      const tournamentRef = db.collection('tournaments').doc(tournamentId);
      const matchRef = tournamentRef.collection('matches').doc(matchId);
      
      const [tournamentDoc, matchDoc] = await Promise.all([
        transaction.get(tournamentRef),
        transaction.get(matchRef)
      ]);

      if (!tournamentDoc.exists || !matchDoc.exists) {
        throw new Error('Tournament or match not found');
      }

      const matchData = matchDoc.data()!;
      
      // Verify user is participant in this match
      if (!matchData.participants.some((p: {id: string}) => p.id === userId)) {
        throw new Error('Not authorized to report this match');
      }

      if (matchData.status !== 'active') {
        throw new Error('Match is not active');
      }

      const reportData = {
        reportedBy: userId,
        winnerId,
        score,
        proof: proof || null,
        reportedAt: FieldValue.serverTimestamp(),
        status: 'pending_verification'
      };

      transaction.update(matchRef, {
        result: reportData,
        status: 'reported',
        updatedAt: FieldValue.serverTimestamp()
      });

      return { success: true };
    });

    return result;
  } catch (error) {
    console.error('Error reporting match:', error);
    throw new functions.https.HttpsError('internal', (error as Error).message || 'Failed to report match');
  }
});

// Verify Match Result
export const verifyMatch = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { tournamentId, matchId, approved } = data;
  const userId = context.auth.uid;

  try {
    const result = await db.runTransaction(async (transaction: admin.firestore.Transaction) => {
      const tournamentRef = db.collection('tournaments').doc(tournamentId);
      const matchRef = tournamentRef.collection('matches').doc(matchId);
      
      const [tournamentDoc, matchDoc] = await Promise.all([
        transaction.get(tournamentRef),
        transaction.get(matchRef)
      ]);

      if (!tournamentDoc.exists || !matchDoc.exists) {
        throw new Error('Tournament or match not found');
      }

      const tournamentData = tournamentDoc.data()!;
      const matchData = matchDoc.data()!;
      
      // Only tournament organizer can verify
      if (tournamentData.organizer.id !== userId) {
        throw new Error('Only tournament organizer can verify matches');
      }

      if (matchData.status !== 'reported') {
        throw new Error('Match has not been reported yet');
      }

      const updateData: any = {
        'result.verifiedBy': userId,
        'result.verifiedAt': FieldValue.serverTimestamp(),
        'result.status': approved ? 'verified' : 'disputed',
        status: approved ? 'completed' : 'disputed',
        updatedAt: FieldValue.serverTimestamp()
      };

      transaction.update(matchRef, updateData);

      return { success: true };
    });

    return result;
  } catch (error) {
    console.error('Error verifying match:', error);
    throw new functions.https.HttpsError('internal', (error as Error).message || 'Failed to verify match');
  }
});

// Seed Bracket
export const seedBracket = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { tournamentId } = data;
  const userId = context.auth.uid;

  try {
    const result = await db.runTransaction(async (transaction: admin.firestore.Transaction) => {
      const tournamentRef = db.collection('tournaments').doc(tournamentId);
      const tournamentDoc = await transaction.get(tournamentRef);

      if (!tournamentDoc.exists) {
        throw new Error('Tournament not found');
      }

      const tournamentData = tournamentDoc.data()!;
      
      // Only tournament organizer can seed bracket
      if (tournamentData.organizer.id !== userId) {
        throw new Error('Only tournament organizer can seed bracket');
      }

      if (tournamentData.status !== 'registration') {
        throw new Error('Tournament is not in registration phase');
      }

      if (tournamentData.participants.length < 2) {
        throw new Error('Need at least 2 participants to create bracket');
      }

      // Create bracket structure
      const participants = [...tournamentData.participants];
      const bracket = generateBracket(participants, tournamentData.format);

      transaction.update(tournamentRef, {
        bracket,
        status: 'active',
        updatedAt: FieldValue.serverTimestamp()
      });

      // Create initial matches
      const batch = db.batch();
      bracket.rounds[0].matches.forEach((match: {participants: any[]}, index: number) => {
        const matchRef = tournamentRef.collection('matches').doc();
        const matchData = {
          roundNumber: 1,
          matchNumber: index + 1,
          participants: match.participants,
          status: 'active',
          result: null,
          createdAt: FieldValue.serverTimestamp()
        };
        batch.set(matchRef, matchData);
      });

      await batch.commit();

      return { success: true, bracket };
    });

    return result;
  } catch (error) {
    console.error('Error seeding bracket:', error);
    throw new functions.https.HttpsError('internal', (error as Error).message || 'Failed to seed bracket');
  }
});

// Helper function to generate bracket
function generateBracket(participants: {id: string, username: string}[], format: string) {
  // Shuffle participants for random seeding
  const shuffled = [...participants].sort(() => Math.random() - 0.5);
  
  // Calculate number of rounds needed
  const numRounds = Math.ceil(Math.log2(shuffled.length));
  const rounds = [];

  // Create first round matches
  const firstRoundMatches = [];
  for (let i = 0; i < shuffled.length; i += 2) {
    if (i + 1 < shuffled.length) {
      firstRoundMatches.push({
        participants: [shuffled[i], shuffled[i + 1]],
        winner: null
      });
    } else {
      // Bye for odd number of participants
      firstRoundMatches.push({
        participants: [shuffled[i]],
        winner: shuffled[i]
      });
    }
  }

  rounds.push({ matches: firstRoundMatches });

  // Create subsequent rounds (empty for now)
  for (let round = 1; round < numRounds; round++) {
    const numMatches = Math.ceil(firstRoundMatches.length / Math.pow(2, round));
    const matches = Array(numMatches).fill(null).map(() => ({
      participants: [],
      winner: null
    }));
    rounds.push({ matches });
  }

  return {
    format,
    rounds,
    createdAt: FieldValue.serverTimestamp()
  };
}