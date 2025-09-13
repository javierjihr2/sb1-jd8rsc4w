"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserProfile = exports.unbookmarkPost = exports.bookmarkPost = exports.addComment = exports.toggleLike = exports.createPost = exports.cleanupExpiredTickets = exports.onTournamentChange = exports.onLikeWrite = exports.pairTickets = exports.cancelMatchmaking = exports.startMatchmaking = exports.seedBracket = exports.verifyMatch = exports.reportMatch = exports.joinTournament = exports.createTournament = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const firestore_1 = require("firebase-admin/firestore");
// Import other function modules
const tournaments = require("./tournaments");
const matchmaking = require("./matchmaking");
const background = require("./background");
admin.initializeApp();
const db = admin.firestore();
// Export tournament functions
exports.createTournament = tournaments.createTournament;
exports.joinTournament = tournaments.joinTournament;
exports.reportMatch = tournaments.reportMatch;
exports.verifyMatch = tournaments.verifyMatch;
exports.seedBracket = tournaments.seedBracket;
// Export matchmaking functions
exports.startMatchmaking = matchmaking.startMatchmaking;
exports.cancelMatchmaking = matchmaking.cancelMatchmaking;
// Export background functions
exports.pairTickets = background.pairTickets;
exports.onLikeWrite = background.onLikeWrite;
exports.onTournamentChange = background.onTournamentChange;
exports.cleanupExpiredTickets = background.cleanupExpiredTickets;
// Callable Functions
// Create Post with optional media
exports.createPost = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { content, type, media, tags, poll } = data;
    const userId = context.auth.uid;
    try {
        // Get user data
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'User not found');
        }
        const userData = userDoc.data();
        const postData = {
            content,
            type: type || 'text',
            author: {
                id: userId,
                username: userData.username,
                displayName: userData.displayName,
                avatar: userData.avatar || null
            },
            media: media || null,
            tags: tags || [],
            poll: poll || null,
            likeCount: 0,
            commentCount: 0,
            createdAt: firestore_1.FieldValue.serverTimestamp(),
            updatedAt: firestore_1.FieldValue.serverTimestamp()
        };
        const postRef = await db.collection('feedPosts').add(postData);
        return { postId: postRef.id };
    }
    catch (error) {
        console.error('Error creating post:', error);
        throw new functions.https.HttpsError('internal', 'Failed to create post');
    }
});
// Toggle Like with transaction
exports.toggleLike = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { postId } = data;
    const userId = context.auth.uid;
    try {
        const result = await db.runTransaction(async (transaction) => {
            const postRef = db.collection('feedPosts').doc(postId);
            const likeRef = db.collection('feedPosts').doc(postId).collection('likes').doc(userId);
            const [postDoc, likeDoc] = await Promise.all([
                transaction.get(postRef),
                transaction.get(likeRef)
            ]);
            if (!postDoc.exists) {
                throw new Error('Post not found');
            }
            if (likeDoc.exists) {
                // Unlike
                transaction.delete(likeRef);
                transaction.update(postRef, {
                    likeCount: firestore_1.FieldValue.increment(-1)
                });
                return { liked: false };
            }
            else {
                // Like
                transaction.set(likeRef, {
                    userId,
                    createdAt: firestore_1.FieldValue.serverTimestamp()
                });
                transaction.update(postRef, {
                    likeCount: firestore_1.FieldValue.increment(1)
                });
                return { liked: true };
            }
        });
        return result;
    }
    catch (error) {
        console.error('Error toggling like:', error);
        throw new functions.https.HttpsError('internal', 'Failed to toggle like');
    }
});
// Add Comment
exports.addComment = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { postId, content, parentCommentId } = data;
    const userId = context.auth.uid;
    try {
        const result = await db.runTransaction(async (transaction) => {
            const postRef = db.collection('feedPosts').doc(postId);
            const postDoc = await transaction.get(postRef);
            if (!postDoc.exists) {
                throw new Error('Post not found');
            }
            // Get user data
            const userDoc = await db.collection('users').doc(userId).get();
            if (!userDoc.exists) {
                throw new Error('User not found');
            }
            const userData = userDoc.data();
            const commentData = {
                content,
                author: {
                    id: userId,
                    username: userData.username,
                    displayName: userData.displayName,
                    avatar: userData.avatar || null
                },
                parentCommentId: parentCommentId || null,
                likeCount: 0,
                createdAt: firestore_1.FieldValue.serverTimestamp()
            };
            const commentRef = db.collection('feedPosts').doc(postId).collection('comments').doc();
            transaction.set(commentRef, commentData);
            transaction.update(postRef, {
                commentCount: firestore_1.FieldValue.increment(1)
            });
            return { commentId: commentRef.id };
        });
        return result;
    }
    catch (error) {
        console.error('Error adding comment:', error);
        throw new functions.https.HttpsError('internal', 'Failed to add comment');
    }
});
// Bookmark Post
exports.bookmarkPost = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { postId } = data;
    const userId = context.auth.uid;
    try {
        const bookmarkRef = db.collection('users').doc(userId).collection('bookmarks').doc(postId);
        await bookmarkRef.set({
            postId,
            createdAt: firestore_1.FieldValue.serverTimestamp()
        });
        return { success: true };
    }
    catch (error) {
        console.error('Error bookmarking post:', error);
        throw new functions.https.HttpsError('internal', 'Failed to bookmark post');
    }
});
// Unbookmark Post
exports.unbookmarkPost = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { postId } = data;
    const userId = context.auth.uid;
    try {
        const bookmarkRef = db.collection('users').doc(userId).collection('bookmarks').doc(postId);
        await bookmarkRef.delete();
        return { success: true };
    }
    catch (error) {
        console.error('Error unbookmarking post:', error);
        throw new functions.https.HttpsError('internal', 'Failed to unbookmark post');
    }
});
// Update User Profile
exports.updateUserProfile = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { username, displayName, avatar, bio } = data;
    const userId = context.auth.uid;
    try {
        // Check if username is unique (if provided)
        if (username) {
            const usernameQuery = await db.collection('users')
                .where('username', '==', username)
                .where('id', '!=', userId)
                .get();
            if (!usernameQuery.empty) {
                throw new functions.https.HttpsError('already-exists', 'Username already taken');
            }
        }
        const updateData = {
            updatedAt: firestore_1.FieldValue.serverTimestamp()
        };
        if (username)
            updateData.username = username;
        if (displayName)
            updateData.displayName = displayName;
        if (avatar)
            updateData.avatar = avatar;
        if (bio !== undefined)
            updateData.bio = bio;
        await db.collection('users').doc(userId).update(updateData);
        return { success: true };
    }
    catch (error) {
        console.error('Error updating profile:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'Failed to update profile');
    }
});
//# sourceMappingURL=index.js.map