import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

// Import other function modules
import * as tournaments from './tournaments';
import * as matchmaking from './matchmaking';
import * as background from './background';

admin.initializeApp();
const db = admin.firestore();

// Export tournament functions
export const createTournament = tournaments.createTournament;
export const joinTournament = tournaments.joinTournament;
export const reportMatch = tournaments.reportMatch;
export const verifyMatch = tournaments.verifyMatch;
export const seedBracket = tournaments.seedBracket;

// Export matchmaking functions
export const startMatchmaking = matchmaking.startMatchmaking;
export const cancelMatchmaking = matchmaking.cancelMatchmaking;

// Export background functions
export const pairTickets = background.pairTickets;
export const onLikeWrite = background.onLikeWrite;
export const onTournamentChange = background.onTournamentChange;
export const cleanupExpiredTickets = background.cleanupExpiredTickets;

// Callable Functions

// Create Post with optional media
export const createPost = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
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

    const userData = userDoc.data()!;
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
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    };

    const postRef = await db.collection('feedPosts').add(postData);
    return { postId: postRef.id };
  } catch (error) {
    console.error('Error creating post:', error);
    throw new functions.https.HttpsError('internal', 'Failed to create post');
  }
});

// Toggle Like with transaction
export const toggleLike = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { postId } = data;
  const userId = context.auth.uid;

  try {
    const result = await db.runTransaction(async (transaction: admin.firestore.Transaction) => {
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
          likeCount: FieldValue.increment(-1)
        });
        return { liked: false };
      } else {
        // Like
        transaction.set(likeRef, {
          userId,
          createdAt: FieldValue.serverTimestamp()
        });
        transaction.update(postRef, {
          likeCount: FieldValue.increment(1)
        });
        return { liked: true };
      }
    });

    return result;
  } catch (error) {
    console.error('Error toggling like:', error);
    throw new functions.https.HttpsError('internal', 'Failed to toggle like');
  }
});

// Add Comment
export const addComment = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
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

      const userData = userDoc.data()!;
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
        createdAt: FieldValue.serverTimestamp()
      };

      const commentRef = db.collection('feedPosts').doc(postId).collection('comments').doc();
      transaction.set(commentRef, commentData);
      transaction.update(postRef, {
        commentCount: FieldValue.increment(1)
      });

      return { commentId: commentRef.id };
    });

    return result;
  } catch (error) {
    console.error('Error adding comment:', error);
    throw new functions.https.HttpsError('internal', 'Failed to add comment');
  }
});

// Bookmark Post
export const bookmarkPost = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { postId } = data;
  const userId = context.auth.uid;

  try {
    const bookmarkRef = db.collection('users').doc(userId).collection('bookmarks').doc(postId);
    await bookmarkRef.set({
      postId,
      createdAt: FieldValue.serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    console.error('Error bookmarking post:', error);
    throw new functions.https.HttpsError('internal', 'Failed to bookmark post');
  }
});

// Unbookmark Post
export const unbookmarkPost = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { postId } = data;
  const userId = context.auth.uid;

  try {
    const bookmarkRef = db.collection('users').doc(userId).collection('bookmarks').doc(postId);
    await bookmarkRef.delete();

    return { success: true };
  } catch (error) {
    console.error('Error unbookmarking post:', error);
    throw new functions.https.HttpsError('internal', 'Failed to unbookmark post');
  }
});

// Update User Profile
export const updateUserProfile = functions.https.onCall(async (data, context) => {
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

    const updateData: any = {
      updatedAt: FieldValue.serverTimestamp()
    };

    if (username) updateData.username = username;
    if (displayName) updateData.displayName = displayName;
    if (avatar) updateData.avatar = avatar;
    if (bio !== undefined) updateData.bio = bio;

    await db.collection('users').doc(userId).update(updateData);

    return { success: true };
  } catch (error) {
    console.error('Error updating profile:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'Failed to update profile');
  }
});