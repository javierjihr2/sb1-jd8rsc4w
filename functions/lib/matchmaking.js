"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancelMatchmaking = exports.startMatchmaking = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const firestore_1 = require("firebase-admin/firestore");
const db = admin.firestore();
// Start Matchmaking
exports.startMatchmaking = functions.https.onCall(async (data, context) => {
    var _a;
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { game, region, skillLevel, gameMode, preferredRoles, language, micRequired, maxWaitTime } = data;
    const userId = context.auth.uid;
    try {
        // Check if user already has an active ticket
        const existingTicket = await db.collection('matchTickets')
            .where('userId', '==', userId)
            .where('status', '==', 'active')
            .get();
        if (!existingTicket.empty) {
            throw new functions.https.HttpsError('already-exists', 'User already has an active matchmaking ticket');
        }
        // Get user data
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'User not found');
        }
        const userData = userDoc.data();
        const ticketData = {
            userId,
            user: {
                id: userId,
                username: userData.username,
                displayName: userData.displayName,
                avatar: userData.avatar || null,
                stats: ((_a = userData.gameStats) === null || _a === void 0 ? void 0 : _a[game]) || {}
            },
            game,
            region,
            skillLevel,
            gameMode,
            preferredRoles: preferredRoles || [],
            language: language || 'en',
            micRequired: micRequired || false,
            maxWaitTime: maxWaitTime || 300,
            status: 'active',
            createdAt: firestore_1.FieldValue.serverTimestamp(),
            expiresAt: new Date(Date.now() + (maxWaitTime || 300) * 1000)
        };
        const ticketRef = await db.collection('matchTickets').add(ticketData);
        // Trigger immediate pairing attempt
        await triggerPairing(ticketRef.id, ticketData);
        return { ticketId: ticketRef.id };
    }
    catch (error) {
        console.error('Error starting matchmaking:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'Failed to start matchmaking');
    }
});
// Cancel Matchmaking
exports.cancelMatchmaking = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { ticketId } = data;
    const userId = context.auth.uid;
    try {
        const result = await db.runTransaction(async (transaction) => {
            const ticketRef = db.collection('matchTickets').doc(ticketId);
            const ticketDoc = await transaction.get(ticketRef);
            if (!ticketDoc.exists) {
                throw new Error('Matchmaking ticket not found');
            }
            const ticketData = ticketDoc.data();
            if (ticketData.userId !== userId) {
                throw new Error('Not authorized to cancel this ticket');
            }
            if (ticketData.status !== 'active') {
                throw new Error('Ticket is not active');
            }
            transaction.update(ticketRef, {
                status: 'cancelled',
                cancelledAt: firestore_1.FieldValue.serverTimestamp()
            });
            return { success: true };
        });
        return result;
    }
    catch (error) {
        console.error('Error cancelling matchmaking:', error);
        throw new functions.https.HttpsError('internal', error.message || 'Failed to cancel matchmaking');
    }
});
// Helper function to trigger pairing
async function triggerPairing(newTicketId, newTicketData) {
    try {
        // Find compatible tickets
        const compatibleTickets = await findCompatibleTickets(newTicketData);
        if (compatibleTickets.length > 0) {
            // Create match with best compatible ticket
            const bestMatch = compatibleTickets[0];
            await createMatch(newTicketId, bestMatch.id, newTicketData, bestMatch.data());
        }
    }
    catch (error) {
        console.error('Error in triggerPairing:', error);
    }
}
// Find compatible tickets
async function findCompatibleTickets(ticketData) {
    const query = db.collection('matchTickets')
        .where('status', '==', 'active')
        .where('game', '==', ticketData.game)
        .where('region', '==', ticketData.region)
        .where('gameMode', '==', ticketData.gameMode)
        .where('userId', '!=', ticketData.userId)
        .orderBy('userId')
        .orderBy('createdAt')
        .limit(10);
    const snapshot = await query.get();
    const compatibleTickets = [];
    for (const doc of snapshot.docs) {
        const data = doc.data();
        // Check skill level compatibility (±1 level)
        const skillLevelDiff = Math.abs(getSkillLevelValue(ticketData.skillLevel) - getSkillLevelValue(data.skillLevel));
        if (skillLevelDiff <= 1) {
            // Check language compatibility
            if (ticketData.language === data.language ||
                ticketData.language === 'any' ||
                data.language === 'any') {
                // Check mic requirements
                if (!ticketData.micRequired || !data.micRequired ||
                    (ticketData.micRequired && data.micRequired)) {
                    // Check role compatibility for team modes
                    if (areRolesCompatible(ticketData.preferredRoles, data.preferredRoles)) {
                        compatibleTickets.push(doc);
                    }
                }
            }
        }
    }
    return compatibleTickets;
}
// Create match between two tickets
async function createMatch(ticket1Id, ticket2Id, ticket1Data, ticket2Data) {
    try {
        await db.runTransaction(async (transaction) => {
            const ticket1Ref = db.collection('matchTickets').doc(ticket1Id);
            const ticket2Ref = db.collection('matchTickets').doc(ticket2Id);
            // Verify both tickets are still active
            const [ticket1Doc, ticket2Doc] = await Promise.all([
                transaction.get(ticket1Ref),
                transaction.get(ticket2Ref)
            ]);
            if (!ticket1Doc.exists || !ticket2Doc.exists) {
                throw new Error('One or both tickets no longer exist');
            }
            const ticket1Current = ticket1Doc.data();
            const ticket2Current = ticket2Doc.data();
            if (ticket1Current.status !== 'active' || ticket2Current.status !== 'active') {
                throw new Error('One or both tickets are no longer active');
            }
            // Create match
            const matchData = {
                user1Id: ticket1Data.userId,
                user2Id: ticket2Data.userId,
                user1: ticket1Data.user,
                user2: ticket2Data.user,
                game: ticket1Data.game,
                region: ticket1Data.region,
                gameMode: ticket1Data.gameMode,
                skillLevel: {
                    user1: ticket1Data.skillLevel,
                    user2: ticket2Data.skillLevel
                },
                language: ticket1Data.language,
                status: 'matched',
                createdAt: firestore_1.FieldValue.serverTimestamp(),
                scheduledTime: null,
                result: null
            };
            const matchRef = db.collection('matches').doc();
            transaction.set(matchRef, matchData);
            // Update tickets to matched status
            transaction.update(ticket1Ref, {
                status: 'matched',
                matchId: matchRef.id,
                matchedAt: firestore_1.FieldValue.serverTimestamp()
            });
            transaction.update(ticket2Ref, {
                status: 'matched',
                matchId: matchRef.id,
                matchedAt: firestore_1.FieldValue.serverTimestamp()
            });
        });
        console.log(`Match created between ${ticket1Data.userId} and ${ticket2Data.userId}`);
    }
    catch (error) {
        console.error('Error creating match:', error);
    }
}
// Helper functions
function getSkillLevelValue(skillLevel) {
    const levels = {
        'bronze': 1,
        'silver': 2,
        'gold': 3,
        'platinum': 4,
        'diamond': 5,
        'crown': 6,
        'ace': 7,
        'conqueror': 8
    };
    return levels[skillLevel.toLowerCase()] || 1;
}
function areRolesCompatible(roles1, roles2) {
    // If either player has no role preference, they're compatible
    if (roles1.length === 0 || roles2.length === 0) {
        return true;
    }
    // Check if they have complementary roles
    const hasOverlap = roles1.some(role => roles2.includes(role));
    // For team modes, prefer players with different preferred roles
    return !hasOverlap || roles1.includes('any') || roles2.includes('any');
}
//# sourceMappingURL=matchmaking.js.map