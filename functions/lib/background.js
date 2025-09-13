"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupExpiredTickets = exports.onTournamentChange = exports.onLikeWrite = exports.pairTickets = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const firestore_1 = require("firebase-admin/firestore");
const db = admin.firestore();
// Background function to pair tickets periodically
exports.pairTickets = functions.pubsub.schedule('every 30 seconds').onRun(async (context) => {
    console.log('Running pairTickets background function');
    try {
        // Get all active tickets
        const activeTicketsSnapshot = await db.collection('matchTickets')
            .where('status', '==', 'active')
            .orderBy('createdAt')
            .limit(100)
            .get();
        if (activeTicketsSnapshot.empty) {
            console.log('No active tickets found');
            return null;
        }
        const tickets = activeTicketsSnapshot.docs.map(doc => ({
            id: doc.id,
            data: doc.data()
        }));
        console.log(`Found ${tickets.length} active tickets`);
        // Group tickets by game, region, and mode for efficient pairing
        const ticketGroups = groupTicketsByCompatibility(tickets);
        let pairsCreated = 0;
        for (const group of ticketGroups) {
            const pairs = await createPairsFromGroup(group);
            pairsCreated += pairs;
        }
        // Clean up expired tickets
        await cleanupExpiredTicketsHelper();
        console.log(`Created ${pairsCreated} pairs`);
        return null;
    }
    catch (error) {
        console.error('Error in pairTickets:', error);
        return null;
    }
});
// Trigger on like write to maintain consistency
exports.onLikeWrite = functions.firestore
    .document('feedPosts/{postId}/likes/{userId}')
    .onWrite(async (change, context) => {
    const postId = context.params.postId;
    const userId = context.params.userId;
    try {
        const postRef = db.collection('feedPosts').doc(postId);
        if (!change.after.exists && change.before.exists) {
            // Like was deleted (unlike)
            await postRef.update({
                likeCount: firestore_1.FieldValue.increment(-1)
            });
            // Send notification to post author about unlike (optional)
            console.log(`User ${userId} unliked post ${postId}`);
        }
        else if (change.after.exists && !change.before.exists) {
            // Like was created
            await postRef.update({
                likeCount: firestore_1.FieldValue.increment(1)
            });
            // Get post data to send notification
            const postDoc = await postRef.get();
            if (postDoc.exists) {
                const postData = postDoc.data();
                // Don't notify if user liked their own post
                if (postData.author.id !== userId) {
                    await sendLikeNotification(postData.author.id, userId, postId, postData);
                }
            }
        }
    }
    catch (error) {
        console.error('Error in onLikeWrite:', error);
    }
});
// Trigger on tournament changes
exports.onTournamentChange = functions.firestore
    .document('tournaments/{tournamentId}')
    .onUpdate(async (change, context) => {
    const tournamentId = context.params.tournamentId;
    const before = change.before.data();
    const after = change.after.data();
    try {
        // Check if status changed
        if (before.status !== after.status) {
            await handleTournamentStatusChange(tournamentId, before.status, after.status, after);
        }
        // Check if participants changed
        if (before.participants.length !== after.participants.length) {
            await handleParticipantChange(tournamentId, before.participants, after.participants, after);
        }
    }
    catch (error) {
        console.error('Error in onTournamentChange:', error);
    }
});
// Helper function to clean up expired tickets
async function cleanupExpiredTicketsHelper() {
    console.log('Cleaning up expired tickets');
    try {
        const now = new Date();
        const expiredTicketsSnapshot = await db.collection('matchTickets')
            .where('status', '==', 'active')
            .where('expiresAt', '<=', now)
            .limit(100)
            .get();
        if (expiredTicketsSnapshot.empty) {
            console.log('No expired tickets found');
            return;
        }
        const batch = db.batch();
        let expiredCount = 0;
        expiredTicketsSnapshot.docs.forEach(doc => {
            batch.update(doc.ref, {
                status: 'expired',
                expiredAt: firestore_1.FieldValue.serverTimestamp()
            });
            expiredCount++;
        });
        await batch.commit();
        console.log(`Expired ${expiredCount} tickets`);
    }
    catch (error) {
        console.error('Error cleaning up expired tickets:', error);
    }
}
// Trigger on match ticket expiration
exports.cleanupExpiredTickets = functions.pubsub.schedule('every 5 minutes').onRun(async (context) => {
    await cleanupExpiredTicketsHelper();
    return null;
});
// Helper functions
function groupTicketsByCompatibility(tickets) {
    const groups = {};
    tickets.forEach(ticket => {
        const key = `${ticket.data.game}-${ticket.data.region}-${ticket.data.gameMode}`;
        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key].push(ticket);
    });
    return Object.values(groups);
}
async function createPairsFromGroup(group) {
    if (group.length < 2) {
        return 0;
    }
    let pairsCreated = 0;
    const processed = new Set();
    for (let i = 0; i < group.length; i++) {
        if (processed.has(group[i].id))
            continue;
        const ticket1 = group[i];
        for (let j = i + 1; j < group.length; j++) {
            if (processed.has(group[j].id))
                continue;
            const ticket2 = group[j];
            if (areTicketsCompatible(ticket1.data, ticket2.data)) {
                try {
                    await createMatchFromTickets(ticket1, ticket2);
                    processed.add(ticket1.id);
                    processed.add(ticket2.id);
                    pairsCreated++;
                    break;
                }
                catch (error) {
                    console.error('Error creating match:', error);
                }
            }
        }
    }
    return pairsCreated;
}
function areTicketsCompatible(ticket1, ticket2) {
    // Check skill level compatibility (±1 level)
    const skillLevelDiff = Math.abs(getSkillLevelValue(ticket1.skillLevel) - getSkillLevelValue(ticket2.skillLevel));
    if (skillLevelDiff > 1)
        return false;
    // Check language compatibility
    if (ticket1.language !== ticket2.language &&
        ticket1.language !== 'any' &&
        ticket2.language !== 'any') {
        return false;
    }
    // Check mic requirements
    if (ticket1.micRequired && ticket2.micRequired) {
        // Both require mic - compatible
    }
    else if (!ticket1.micRequired && !ticket2.micRequired) {
        // Neither requires mic - compatible
    }
    else {
        // One requires mic, other doesn't - check if flexible
        return false;
    }
    // Check role compatibility
    return areRolesCompatible(ticket1.preferredRoles, ticket2.preferredRoles);
}
async function createMatchFromTickets(ticket1, ticket2) {
    await db.runTransaction(async (transaction) => {
        const ticket1Ref = db.collection('matchTickets').doc(ticket1.id);
        const ticket2Ref = db.collection('matchTickets').doc(ticket2.id);
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
            user1Id: ticket1.data.userId,
            user2Id: ticket2.data.userId,
            user1: ticket1.data.user,
            user2: ticket2.data.user,
            game: ticket1.data.game,
            region: ticket1.data.region,
            gameMode: ticket1.data.gameMode,
            skillLevel: {
                user1: ticket1.data.skillLevel,
                user2: ticket2.data.skillLevel
            },
            language: ticket1.data.language,
            status: 'matched',
            createdAt: firestore_1.FieldValue.serverTimestamp(),
            scheduledTime: null,
            result: null
        };
        const matchRef = db.collection('matches').doc();
        transaction.set(matchRef, matchData);
        // Update tickets
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
        // Send notifications to both users
        await Promise.all([
            sendMatchNotification(ticket1.data.userId, matchRef.id, ticket2.data.user),
            sendMatchNotification(ticket2.data.userId, matchRef.id, ticket1.data.user)
        ]);
    });
}
async function sendLikeNotification(recipientId, likerId, postId, postData) {
    try {
        // Get liker data
        const likerDoc = await db.collection('users').doc(likerId).get();
        if (!likerDoc.exists)
            return;
        const likerData = likerDoc.data();
        const notificationData = {
            type: 'like',
            recipientId,
            senderId: likerId,
            senderName: likerData.displayName || likerData.username,
            senderAvatar: likerData.avatar || null,
            postId,
            postContent: postData.content.substring(0, 100),
            createdAt: firestore_1.FieldValue.serverTimestamp(),
            read: false
        };
        await db.collection('notifications').add(notificationData);
    }
    catch (error) {
        console.error('Error sending like notification:', error);
    }
}
async function sendMatchNotification(recipientId, matchId, opponent) {
    try {
        const notificationData = {
            type: 'match_found',
            recipientId,
            matchId,
            opponentName: opponent.displayName || opponent.username,
            opponentAvatar: opponent.avatar || null,
            createdAt: firestore_1.FieldValue.serverTimestamp(),
            read: false
        };
        await db.collection('notifications').add(notificationData);
    }
    catch (error) {
        console.error('Error sending match notification:', error);
    }
}
async function handleTournamentStatusChange(tournamentId, oldStatus, newStatus, tournamentData) {
    // Send notifications to all participants about status change
    const notifications = tournamentData.participants.map((participant) => ({
        type: 'tournament_status_change',
        recipientId: participant.id,
        tournamentId,
        tournamentName: tournamentData.name,
        oldStatus,
        newStatus,
        createdAt: firestore_1.FieldValue.serverTimestamp(),
        read: false
    }));
    const batch = db.batch();
    notifications.forEach((notification) => {
        const notificationRef = db.collection('notifications').doc();
        batch.set(notificationRef, notification);
    });
    await batch.commit();
}
async function handleParticipantChange(tournamentId, oldParticipants, newParticipants, tournamentData) {
    // Find new participants
    const oldParticipantIds = oldParticipants.map(p => p.id);
    const addedParticipants = newParticipants.filter(p => !oldParticipantIds.includes(p.id));
    if (addedParticipants.length > 0) {
        // Send welcome notifications to new participants
        const batch = db.batch();
        addedParticipants.forEach((participant) => {
            const notificationRef = db.collection('notifications').doc();
            batch.set(notificationRef, {
                type: 'tournament_joined',
                recipientId: participant.id,
                tournamentId,
                tournamentName: tournamentData.name,
                createdAt: firestore_1.FieldValue.serverTimestamp(),
                read: false
            });
        });
        await batch.commit();
    }
}
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
    if (roles1.length === 0 || roles2.length === 0) {
        return true;
    }
    const hasOverlap = roles1.some(role => roles2.includes(role));
    return !hasOverlap || roles1.includes('any') || roles2.includes('any');
}
//# sourceMappingURL=background.js.map