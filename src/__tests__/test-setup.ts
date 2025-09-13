// Shared mocks for testing

// Mock database functions
export const createFeedPost = jest.fn();
export const likeFeedPost = jest.fn();
export const unlikeFeedPost = jest.fn();
export const addComment = jest.fn();
export const addBookmark = jest.fn();
export const removeBookmark = jest.fn();

// Mock optimistic UI functions
export const optimisticLikeFeedPost = jest.fn();
export const optimisticUnlikeFeedPost = jest.fn();
export const optimisticAddBookmark = jest.fn();
export const optimisticRemoveBookmark = jest.fn();
export const processOperationQueue = jest.fn();

// Mock Firebase
export const db = {
  collection: jest.fn(),
  doc: jest.fn(),
  runTransaction: jest.fn(),
};

export const auth = {
  currentUser: {
    uid: 'test-user-id',
    email: 'test@example.com',
  },
};

// Reset all mocks before each test
export const resetAllMocks = () => {
  jest.clearAllMocks();
  createFeedPost.mockClear();
  likeFeedPost.mockClear();
  unlikeFeedPost.mockClear();
  addComment.mockClear();
  addBookmark.mockClear();
  removeBookmark.mockClear();
  optimisticLikeFeedPost.mockClear();
  optimisticUnlikeFeedPost.mockClear();
  optimisticAddBookmark.mockClear();
  optimisticRemoveBookmark.mockClear();
  processOperationQueue.mockClear();
};