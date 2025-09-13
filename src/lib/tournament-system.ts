import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Unsubscribe,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  increment
} from 'firebase/firestore';
import { db } from './firebase';
import { addRetryOperation } from './retry-system';
import { validateTournamentRegistration } from './validation';
import { sendTournamentNotification } from './push-notifications';

export interface Tournament {
  id?: string;
  title: string;
  description: string;
  game: string;
  format: 'single-elimination' | 'double-elimination' | 'round-robin' | 'swiss';
  maxParticipants: number;
  currentParticipants: number;
  entryFee: number;
  prizePool: number;
  startDate: Date;
  endDate: Date;
  registrationDeadline: Date;
  status: 'upcoming' | 'registration-open' | 'registration-closed' | 'in-progress' | 'completed' | 'cancelled';
  organizer: string;
  organizerName: string;
  rules: string[];
  requirements: {
    minRank?: string;
    maxRank?: string;
    region?: string;
    teamSize?: number;
  };
  participants: string[];
  waitlist: string[];
  brackets?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface TournamentRegistration {
  id?: string;
  tournamentId: string;
  userId: string;
  username: string;
  teamName?: string;
  teamMembers?: string[];
  registrationDate: Date;
  status: 'registered' | 'waitlisted' | 'cancelled' | 'disqualified';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  notes?: string;
}

export interface TournamentResult {
  id?: string;
  tournamentId: string;
  userId: string;
  username: string;
  placement: number;
  prize: number;
  points: number;
  matches: {
    opponent: string;
    result: 'win' | 'loss' | 'draw';
    score: string;
    round: number;
  }[];
}

// Register for tournament
export async function registerForTournament(
  tournamentId: string,
  userId: string,
  username: string,
  teamName?: string,
  teamMembers?: string[]
): Promise<{ success: boolean; status?: 'registered' | 'waitlisted'; error?: string }> {
  try {
    // Validate input
    const registrationData = {
      tournamentId,
      userId,
      username,
      teamName: teamName || '',
      teamMembers: teamMembers || []
    };

    const validation = validateTournamentRegistration(registrationData);
    if (!validation.isValid) {
      return { success: false, error: validation.errors.join(', ') };
    }

    // Get tournament details
    const tournamentDoc = await getDoc(doc(db, 'tournaments', tournamentId));
    if (!tournamentDoc.exists()) {
      return { success: false, error: 'Tournament not found' };
    }

    const tournament = tournamentDoc.data() as Tournament;
    
    // Check if registration is open
    if (tournament.status !== 'registration-open') {
      return { success: false, error: 'Registration is not open for this tournament' };
    }

    // Check registration deadline
    const deadlineDate = tournament.registrationDeadline instanceof Date 
      ? tournament.registrationDeadline 
      : (tournament.registrationDeadline as any).toDate();
    
    if (new Date() > deadlineDate) {
      return { success: false, error: 'Registration deadline has passed' };
    }

    // Check if user is already registered
    const existingRegistration = await getUserTournamentRegistration(tournamentId, userId);
    if (existingRegistration) {
      return { success: false, error: 'Already registered for this tournament' };
    }

    // Determine if user goes to main list or waitlist
    const isWaitlisted = tournament.currentParticipants >= tournament.maxParticipants;
    const status = isWaitlisted ? 'waitlisted' : 'registered';

    // Create registration
    const registration: Omit<TournamentRegistration, 'id'> = {
      tournamentId,
      userId,
      username,
      teamName,
      teamMembers,
      registrationDate: new Date(),
      status,
      paymentStatus: tournament.entryFee > 0 ? 'pending' : 'paid'
    };

    const docRef = await addDoc(collection(db, 'tournamentRegistrations'), {
      ...registration,
      registrationDate: serverTimestamp()
    });

    // Update tournament participant count and lists
    const updateData: any = {
      updatedAt: serverTimestamp()
    };

    if (isWaitlisted) {
      updateData.waitlist = arrayUnion(userId);
    } else {
      updateData.participants = arrayUnion(userId);
      updateData.currentParticipants = increment(1);
    }

    await updateDoc(doc(db, 'tournaments', tournamentId), updateData);

    // Send notification
    try {
      await sendTournamentNotification(
        userId,
        tournament.title,
        isWaitlisted ? 'waitlisted' : 'registered',
        tournamentId
      );
    } catch (notificationError) {
      console.error('Error sending tournament notification:', notificationError);
    }

    return { success: true, status };
  } catch (error) {
    console.error('Error registering for tournament:', error);
    
    // Add to retry queue
    const retryId = addRetryOperation.tournamentRegister(userId, {
      tournamentId,
      username,
      teamName,
      teamMembers
    }, 'medium');
    
    return { success: false, error: 'Failed to register for tournament' };
  }
}

// Cancel tournament registration
export async function cancelTournamentRegistration(
  tournamentId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get registration
    const registration = await getUserTournamentRegistration(tournamentId, userId);
    if (!registration) {
      return { success: false, error: 'Registration not found' };
    }

    // Get tournament details
    const tournamentDoc = await getDoc(doc(db, 'tournaments', tournamentId));
    if (!tournamentDoc.exists()) {
      return { success: false, error: 'Tournament not found' };
    }

    const tournament = tournamentDoc.data() as Tournament;
    
    // Check if cancellation is allowed
    if (tournament.status === 'in-progress' || tournament.status === 'completed') {
      return { success: false, error: 'Cannot cancel registration for ongoing or completed tournament' };
    }

    // Update registration status
    await updateDoc(doc(db, 'tournamentRegistrations', registration.id!), {
      status: 'cancelled',
      updatedAt: serverTimestamp()
    });

    // Update tournament participant lists
    const updateData: any = {
      updatedAt: serverTimestamp()
    };

    if (registration.status === 'registered') {
      updateData.participants = arrayRemove(userId);
      updateData.currentParticipants = increment(-1);
      
      // Move someone from waitlist if available
      if (tournament.waitlist && tournament.waitlist.length > 0) {
        const nextUserId = tournament.waitlist[0];
        updateData.waitlist = arrayRemove(nextUserId);
        updateData.participants = arrayUnion(nextUserId);
        
        // Update the waitlisted user's registration
        const waitlistRegistration = await getUserTournamentRegistration(tournamentId, nextUserId);
        if (waitlistRegistration) {
          await updateDoc(doc(db, 'tournamentRegistrations', waitlistRegistration.id!), {
            status: 'registered',
            updatedAt: serverTimestamp()
          });
          
          // Notify the user they've been moved from waitlist
          try {
            await sendTournamentNotification(
              nextUserId,
              tournament.title,
              'moved-from-waitlist',
              tournamentId
            );
          } catch (notificationError) {
            console.error('Error sending waitlist notification:', notificationError);
          }
        }
      }
    } else if (registration.status === 'waitlisted') {
      updateData.waitlist = arrayRemove(userId);
    }

    await updateDoc(doc(db, 'tournaments', tournamentId), updateData);

    return { success: true };
  } catch (error) {
    console.error('Error cancelling tournament registration:', error);
    return { success: false, error: 'Failed to cancel registration' };
  }
}

// Get user's tournament registration
export async function getUserTournamentRegistration(
  tournamentId: string,
  userId: string
): Promise<TournamentRegistration | null> {
  try {
    const registrationsQuery = query(
      collection(db, 'tournamentRegistrations'),
      where('tournamentId', '==', tournamentId),
      where('userId', '==', userId)
    );
    
    const registrationsSnapshot = await getDocs(registrationsQuery);
    
    if (!registrationsSnapshot.empty) {
      const doc = registrationsSnapshot.docs[0];
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        registrationDate: data.registrationDate?.toDate() || new Date()
      } as TournamentRegistration;
    }

    return null;
  } catch (error) {
    console.error('Error getting user tournament registration:', error);
    return null;
  }
}

// Get user's tournament registrations
export async function getUserTournamentRegistrations(
  userId: string
): Promise<{ success: boolean; registrations?: TournamentRegistration[]; error?: string }> {
  try {
    const registrationsQuery = query(
      collection(db, 'tournamentRegistrations'),
      where('userId', '==', userId),
      orderBy('registrationDate', 'desc')
    );
    
    const registrationsSnapshot = await getDocs(registrationsQuery);
    const registrations: TournamentRegistration[] = [];
    
    registrationsSnapshot.forEach((doc) => {
      const data = doc.data();
      registrations.push({
        id: doc.id,
        ...data,
        registrationDate: data.registrationDate?.toDate() || new Date()
      } as TournamentRegistration);
    });

    return { success: true, registrations };
  } catch (error) {
    console.error('Error getting user tournament registrations:', error);
    return { success: false, error: 'Failed to get registrations' };
  }
}

// Get available tournaments
export async function getAvailableTournaments(
  game?: string,
  limitCount: number = 20
): Promise<{ success: boolean; tournaments?: Tournament[]; error?: string }> {
  try {
    let tournamentsQuery = query(
      collection(db, 'tournaments'),
      where('status', 'in', ['upcoming', 'registration-open']),
      orderBy('startDate', 'asc'),
      limit(limitCount)
    );

    if (game) {
      tournamentsQuery = query(
        collection(db, 'tournaments'),
        where('game', '==', game),
        where('status', 'in', ['upcoming', 'registration-open']),
        orderBy('startDate', 'asc'),
        limit(limitCount)
      );
    }
    
    const tournamentsSnapshot = await getDocs(tournamentsQuery);
    const tournaments: Tournament[] = [];
    
    tournamentsSnapshot.forEach((doc) => {
      const data = doc.data();
      tournaments.push({
        id: doc.id,
        ...data,
        startDate: data.startDate?.toDate() || new Date(),
        endDate: data.endDate?.toDate() || new Date(),
        registrationDeadline: data.registrationDeadline?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as Tournament);
    });

    return { success: true, tournaments };
  } catch (error) {
    console.error('Error getting available tournaments:', error);
    return { success: false, error: 'Failed to get tournaments' };
  }
}

// Get tournament details
export async function getTournamentDetails(
  tournamentId: string
): Promise<{ success: boolean; tournament?: Tournament; error?: string }> {
  try {
    const tournamentDoc = await getDoc(doc(db, 'tournaments', tournamentId));
    
    if (!tournamentDoc.exists()) {
      return { success: false, error: 'Tournament not found' };
    }

    const data = tournamentDoc.data();
    const tournament: Tournament = {
      id: tournamentDoc.id,
      ...data,
      startDate: data.startDate?.toDate() || new Date(),
      endDate: data.endDate?.toDate() || new Date(),
      registrationDeadline: data.registrationDeadline?.toDate() || new Date(),
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date()
    } as Tournament;

    return { success: true, tournament };
  } catch (error) {
    console.error('Error getting tournament details:', error);
    return { success: false, error: 'Failed to get tournament details' };
  }
}

// Get tournament participants
export async function getTournamentParticipants(
  tournamentId: string
): Promise<{ success: boolean; participants?: TournamentRegistration[]; error?: string }> {
  try {
    const participantsQuery = query(
      collection(db, 'tournamentRegistrations'),
      where('tournamentId', '==', tournamentId),
      where('status', 'in', ['registered', 'waitlisted']),
      orderBy('registrationDate', 'asc')
    );
    
    const participantsSnapshot = await getDocs(participantsQuery);
    const participants: TournamentRegistration[] = [];
    
    participantsSnapshot.forEach((doc) => {
      const data = doc.data();
      participants.push({
        id: doc.id,
        ...data,
        registrationDate: data.registrationDate?.toDate() || new Date()
      } as TournamentRegistration);
    });

    return { success: true, participants };
  } catch (error) {
    console.error('Error getting tournament participants:', error);
    return { success: false, error: 'Failed to get participants' };
  }
}

// Subscribe to tournament updates
export function subscribeToTournament(
  tournamentId: string,
  callback: (tournament: Tournament | null) => void
): Unsubscribe {
  return onSnapshot(doc(db, 'tournaments', tournamentId), (doc) => {
    if (doc.exists()) {
      const data = doc.data();
      const tournament: Tournament = {
        id: doc.id,
        ...data,
        startDate: data.startDate?.toDate() || new Date(),
        endDate: data.endDate?.toDate() || new Date(),
        registrationDeadline: data.registrationDeadline?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as Tournament;
      callback(tournament);
    } else {
      callback(null);
    }
  });
}

// Subscribe to user's tournament registrations
export function subscribeToUserTournamentRegistrations(
  userId: string,
  callback: (registrations: TournamentRegistration[]) => void
): Unsubscribe {
  const registrationsQuery = query(
    collection(db, 'tournamentRegistrations'),
    where('userId', '==', userId),
    orderBy('registrationDate', 'desc')
  );

  return onSnapshot(registrationsQuery, (snapshot) => {
    const registrations: TournamentRegistration[] = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      registrations.push({
        id: doc.id,
        ...data,
        registrationDate: data.registrationDate?.toDate() || new Date()
      } as TournamentRegistration);
    });

    callback(registrations);
  });
}

// Subscribe to available tournaments
export function subscribeToAvailableTournaments(
  callback: (tournaments: Tournament[]) => void,
  game?: string
): Unsubscribe {
  let tournamentsQuery = query(
    collection(db, 'tournaments'),
    where('status', 'in', ['upcoming', 'registration-open']),
    orderBy('startDate', 'asc')
  );

  if (game) {
    tournamentsQuery = query(
      collection(db, 'tournaments'),
      where('game', '==', game),
      where('status', 'in', ['upcoming', 'registration-open']),
      orderBy('startDate', 'asc')
    );
  }

  return onSnapshot(tournamentsQuery, (snapshot) => {
    const tournaments: Tournament[] = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      tournaments.push({
        id: doc.id,
        ...data,
        startDate: data.startDate?.toDate() || new Date(),
        endDate: data.endDate?.toDate() || new Date(),
        registrationDeadline: data.registrationDeadline?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as Tournament);
    });

    callback(tournaments);
  });
}

// Get tournament statistics
export async function getTournamentStatistics(
  userId: string
): Promise<{ success: boolean; stats?: any; error?: string }> {
  try {
    const [registrationsResult, resultsQuery] = await Promise.all([
      getUserTournamentRegistrations(userId),
      getDocs(query(
        collection(db, 'tournamentResults'),
        where('userId', '==', userId)
      ))
    ]);

    if (!registrationsResult.success) {
      return { success: false, error: registrationsResult.error };
    }

    const registrations = registrationsResult.registrations || [];
    const results: TournamentResult[] = [];
    
    resultsQuery.forEach((doc) => {
      results.push({ id: doc.id, ...doc.data() } as TournamentResult);
    });

    const stats = {
      totalTournaments: registrations.length,
      activeTournaments: registrations.filter(r => r.status === 'registered').length,
      waitlistedTournaments: registrations.filter(r => r.status === 'waitlisted').length,
      completedTournaments: results.length,
      totalPrizeWon: results.reduce((sum, r) => sum + r.prize, 0),
      averagePlacement: results.length > 0 
        ? results.reduce((sum, r) => sum + r.placement, 0) / results.length 
        : 0,
      bestPlacement: results.length > 0 
        ? Math.min(...results.map(r => r.placement)) 
        : null,
      totalPoints: results.reduce((sum, r) => sum + r.points, 0)
    };

    return { success: true, stats };
  } catch (error) {
    console.error('Error getting tournament statistics:', error);
    return { success: false, error: 'Failed to get tournament statistics' };
  }
}

// Clean up tournament listeners
const tournamentListeners: Map<string, Unsubscribe> = new Map();

export function cleanupTournamentListeners(userId: string): void {
  const listener = tournamentListeners.get(userId);
  if (listener) {
    listener();
    tournamentListeners.delete(userId);
  }
}

export function cleanupAllTournamentListeners(): void {
  tournamentListeners.forEach((unsubscribe) => unsubscribe());
  tournamentListeners.clear();
}