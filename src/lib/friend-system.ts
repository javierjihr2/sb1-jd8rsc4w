import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Unsubscribe,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { addRetryOperation } from './retry-system';
import { validateFriendRequest } from './validation';
import { sendFriendRequestNotification } from './push-notifications';

export interface FriendRequest {
  id?: string;
  fromUserId: string;
  toUserId: string;
  fromUsername: string;
  toUsername: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
  message?: string;
}

export interface Friendship {
  id?: string;
  users: string[];
  usernames: string[];
  createdAt: Date;
  status: 'active' | 'blocked';
}

export interface FriendProfile {
  userId: string;
  username: string;
  displayName?: string;
  avatar?: string;
  status: 'online' | 'offline' | 'away' | 'busy';
  lastSeen: Date;
  mutualFriends?: number;
}

// Send friend request
export async function sendFriendRequest(
  fromUserId: string,
  toUserId: string,
  fromUsername: string,
  toUsername: string,
  message?: string
): Promise<{ success: boolean; requestId?: string; error?: string }> {
  try {
    // Validate input
    const requestData = {
      fromUserId,
      toUserId,
      fromUsername,
      toUsername,
      message: message || ''
    };

    const validation = validateFriendRequest(requestData);
    if (!validation.isValid) {
      return { success: false, error: validation.errors.join(', ') };
    }

    // Check if users are already friends
    const existingFriendship = await checkFriendshipStatus(fromUserId, toUserId);
    if (existingFriendship.areFriends) {
      return { success: false, error: 'Users are already friends' };
    }

    // Check if there's already a pending request
    const existingRequest = await getPendingFriendRequest(fromUserId, toUserId);
    if (existingRequest) {
      return { success: false, error: 'Friend request already sent' };
    }

    // Create friend request
    const friendRequest: Omit<FriendRequest, 'id'> = {
      fromUserId,
      toUserId,
      fromUsername,
      toUsername,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
      message
    };

    const docRef = await addDoc(collection(db, 'friendRequests'), {
      ...friendRequest,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // Send push notification
    try {
      await sendFriendRequestNotification(toUserId, fromUsername, fromUserId);
    } catch (notificationError) {
      console.error('Error sending friend request notification:', notificationError);
    }

    return { success: true, requestId: docRef.id };
  } catch (error) {
    console.error('Error sending friend request:', error);
    
    // Add to retry queue
    const retryId = addRetryOperation.messageSend(fromUserId, {
      operation: 'sendFriendRequest',
      fromUserId,
      toUserId,
      fromUsername,
      toUsername,
      message
    }, 'medium');
    
    return { success: false, error: 'Failed to send friend request' };
  }
}

// Accept friend request
export async function acceptFriendRequest(
  requestId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get the friend request
    const requestDoc = await getDoc(doc(db, 'friendRequests', requestId));
    if (!requestDoc.exists()) {
      return { success: false, error: 'Friend request not found' };
    }

    const requestData = requestDoc.data() as FriendRequest;
    
    // Verify user is the recipient
    if (requestData.toUserId !== userId) {
      return { success: false, error: 'Unauthorized to accept this request' };
    }

    // Verify request is still pending
    if (requestData.status !== 'pending') {
      return { success: false, error: 'Request is no longer pending' };
    }

    // Update request status
    await updateDoc(doc(db, 'friendRequests', requestId), {
      status: 'accepted',
      updatedAt: serverTimestamp()
    });

    // Create friendship
    const friendship: Omit<Friendship, 'id'> = {
      users: [requestData.fromUserId, requestData.toUserId],
      usernames: [requestData.fromUsername, requestData.toUsername],
      createdAt: new Date(),
      status: 'active'
    };

    await addDoc(collection(db, 'friendships'), {
      ...friendship,
      createdAt: serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    console.error('Error accepting friend request:', error);
    
    // Add to retry queue
    const retryId = addRetryOperation.messageSend(userId, {
      operation: 'acceptFriendRequest',
      requestId,
      userId
    }, 'medium');
    
    return { success: false, error: 'Failed to accept friend request' };
  }
}

// Reject friend request
export async function rejectFriendRequest(
  requestId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get the friend request
    const requestDoc = await getDoc(doc(db, 'friendRequests', requestId));
    if (!requestDoc.exists()) {
      return { success: false, error: 'Friend request not found' };
    }

    const requestData = requestDoc.data() as FriendRequest;
    
    // Verify user is the recipient
    if (requestData.toUserId !== userId) {
      return { success: false, error: 'Unauthorized to reject this request' };
    }

    // Update request status
    await updateDoc(doc(db, 'friendRequests', requestId), {
      status: 'rejected',
      updatedAt: serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    console.error('Error rejecting friend request:', error);
    return { success: false, error: 'Failed to reject friend request' };
  }
}

// Remove friend
export async function removeFriend(
  userId: string,
  friendId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Find the friendship
    const friendshipsQuery = query(
      collection(db, 'friendships'),
      where('users', 'array-contains', userId)
    );
    
    const friendshipsSnapshot = await getDocs(friendshipsQuery);
    let friendshipDoc: any = null;
    
    friendshipsSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.users.includes(friendId)) {
        friendshipDoc = doc;
      }
    });

    if (!friendshipDoc) {
      return { success: false, error: 'Friendship not found' };
    }

    // Delete the friendship
    await deleteDoc(friendshipDoc.ref);

    return { success: true };
  } catch (error) {
    console.error('Error removing friend:', error);
    return { success: false, error: 'Failed to remove friend' };
  }
}

// Get user's friends
export async function getUserFriends(
  userId: string
): Promise<{ success: boolean; friends?: FriendProfile[]; error?: string }> {
  try {
    const friendshipsQuery = query(
      collection(db, 'friendships'),
      where('users', 'array-contains', userId),
      where('status', '==', 'active')
    );
    
    const friendshipsSnapshot = await getDocs(friendshipsQuery);
    const friends: FriendProfile[] = [];
    
    friendshipsSnapshot.forEach((doc) => {
      const data = doc.data() as Friendship;
      const friendIndex = data.users.indexOf(userId) === 0 ? 1 : 0;
      const friendId = data.users[friendIndex];
      const friendUsername = data.usernames[friendIndex];
      
      friends.push({
        userId: friendId,
        username: friendUsername,
        status: 'offline', // You might want to get real status
        lastSeen: new Date()
      });
    });

    return { success: true, friends };
  } catch (error) {
    console.error('Error getting user friends:', error);
    return { success: false, error: 'Failed to get friends' };
  }
}

// Get pending friend requests
export async function getPendingFriendRequests(
  userId: string
): Promise<{ success: boolean; requests?: FriendRequest[]; error?: string }> {
  try {
    const requestsQuery = query(
      collection(db, 'friendRequests'),
      where('toUserId', '==', userId),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );
    
    const requestsSnapshot = await getDocs(requestsQuery);
    const requests: FriendRequest[] = [];
    
    requestsSnapshot.forEach((doc) => {
      const data = doc.data();
      requests.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as FriendRequest);
    });

    return { success: true, requests };
  } catch (error) {
    console.error('Error getting pending friend requests:', error);
    return { success: false, error: 'Failed to get friend requests' };
  }
}

// Check friendship status
export async function checkFriendshipStatus(
  userId1: string,
  userId2: string
): Promise<{ areFriends: boolean; status?: string }> {
  try {
    const friendshipsQuery = query(
      collection(db, 'friendships'),
      where('users', 'array-contains', userId1)
    );
    
    const friendshipsSnapshot = await getDocs(friendshipsQuery);
    let friendship: any = null;
    
    friendshipsSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.users.includes(userId2)) {
        friendship = data;
      }
    });

    if (friendship) {
      return { areFriends: true, status: friendship.status };
    }

    return { areFriends: false };
  } catch (error) {
    console.error('Error checking friendship status:', error);
    return { areFriends: false };
  }
}

// Get pending friend request between users
export async function getPendingFriendRequest(
  fromUserId: string,
  toUserId: string
): Promise<FriendRequest | null> {
  try {
    const requestsQuery = query(
      collection(db, 'friendRequests'),
      where('fromUserId', '==', fromUserId),
      where('toUserId', '==', toUserId),
      where('status', '==', 'pending')
    );
    
    const requestsSnapshot = await getDocs(requestsQuery);
    
    if (!requestsSnapshot.empty) {
      const doc = requestsSnapshot.docs[0];
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as FriendRequest;
    }

    return null;
  } catch (error) {
    console.error('Error getting pending friend request:', error);
    return null;
  }
}

// Subscribe to friend requests
export function subscribeToFriendRequests(
  userId: string,
  callback: (requests: FriendRequest[]) => void
): Unsubscribe {
  const requestsQuery = query(
    collection(db, 'friendRequests'),
    where('toUserId', '==', userId),
    where('status', '==', 'pending'),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(requestsQuery, (snapshot) => {
    const requests: FriendRequest[] = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      requests.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as FriendRequest);
    });

    callback(requests);
  });
}

// Subscribe to friends list
export function subscribeToFriends(
  userId: string,
  callback: (friends: FriendProfile[]) => void
): Unsubscribe {
  const friendshipsQuery = query(
    collection(db, 'friendships'),
    where('users', 'array-contains', userId),
    where('status', '==', 'active')
  );

  return onSnapshot(friendshipsQuery, (snapshot) => {
    const friends: FriendProfile[] = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data() as Friendship;
      const friendIndex = data.users.indexOf(userId) === 0 ? 1 : 0;
      const friendId = data.users[friendIndex];
      const friendUsername = data.usernames[friendIndex];
      
      friends.push({
        userId: friendId,
        username: friendUsername,
        status: 'offline', // You might want to get real status
        lastSeen: new Date()
      });
    });

    callback(friends);
  });
}

// Search for users to add as friends
export async function searchUsers(
  searchQuery: string,
  currentUserId: string,
  limit: number = 10
): Promise<{ success: boolean; users?: FriendProfile[]; error?: string }> {
  try {
    // This is a simplified search - in a real app you'd want better search functionality
    const usersQuery = query(
      collection(db, 'users'),
      where('username', '>=', searchQuery),
      where('username', '<=', searchQuery + '\uf8ff')
    );
    
    const usersSnapshot = await getDocs(usersQuery);
    const users: FriendProfile[] = [];
    
    usersSnapshot.forEach((doc) => {
      const data = doc.data();
      if (doc.id !== currentUserId) {
        users.push({
          userId: doc.id,
          username: data.username || '',
          displayName: data.displayName,
          avatar: data.avatar,
          status: 'offline',
          lastSeen: new Date()
        });
      }
    });

    return { success: true, users: users.slice(0, limit) };
  } catch (error) {
    console.error('Error searching users:', error);
    return { success: false, error: 'Failed to search users' };
  }
}

// Clean up friend system listeners
const friendListeners: Map<string, Unsubscribe> = new Map();

export function cleanupFriendListeners(userId: string): void {
  const listener = friendListeners.get(userId);
  if (listener) {
    listener();
    friendListeners.delete(userId);
  }
}

export function cleanupAllFriendListeners(): void {
  friendListeners.forEach((unsubscribe) => unsubscribe());
  friendListeners.clear();
}