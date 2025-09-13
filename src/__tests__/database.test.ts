import {
  createFeedPost,
  likeFeedPost,
  unlikeFeedPost,
  addComment,
  addBookmark,
  removeBookmark,
  db,
  auth,
  resetAllMocks
} from './test-setup';

describe('Database Functions', () => {
  const mockCollection = jest.fn();
  const mockDoc = jest.fn();
  const mockTransaction = {
    get: jest.fn(),
    set: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (db.collection as jest.Mock).mockReturnValue({
      doc: mockDoc,
      add: jest.fn(),
    });
    mockDoc.mockReturnValue({
      get: jest.fn(),
      set: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      collection: mockCollection,
    });
    (db.runTransaction as jest.Mock).mockImplementation((callback) => 
      callback(mockTransaction)
    );
  });

  describe('createFeedPost', () => {
    it('should create a feed post successfully', async () => {
      const mockUserData = {
        username: 'testuser',
        displayName: 'Test User',
        avatar: 'avatar-url',
      };

      const mockUserDoc = {
        exists: () => true,
        data: () => mockUserData,
      };

      mockDoc.mockReturnValue({
        get: jest.fn().mockResolvedValue(mockUserDoc),
      });

      const mockPostRef = { id: 'post-123' };
      mockCollection.mockReturnValue({
        add: jest.fn().mockResolvedValue(mockPostRef),
      });

      const postData = {
        content: 'Test post content',
        type: 'text' as const,
        tags: ['gaming'],
        mediaUrls: [],
      };

      const result = await createFeedPost('user-123', postData);

      expect(result).toBe('post-123');
    });

    it('should throw error if user does not exist', async () => {
      const mockUserDoc = {
        exists: () => false,
      };

      mockDoc.mockReturnValue({
        get: jest.fn().mockResolvedValue(mockUserDoc),
      });

      const postData = {
        content: 'Test post content',
        type: 'text' as const,
        tags: ['gaming'],
        mediaUrls: [],
      };

      await expect(createFeedPost('user-123', postData))
        .rejects.toThrow('User not found');
    });
  });

  describe('likeFeedPost', () => {
    it('should like a post successfully', async () => {
      mockTransaction.get.mockResolvedValue({
        exists: () => false,
      });

      await likeFeedPost('user-123', 'post-123');

      expect(mockTransaction.set).toHaveBeenCalled();
      expect(mockTransaction.update).toHaveBeenCalled();
    });

    it('should not like if already liked', async () => {
      mockTransaction.get.mockResolvedValue({
        exists: () => true,
      });

      await likeFeedPost('user-123', 'post-123');

      expect(mockTransaction.set).not.toHaveBeenCalled();
    });
  });

  describe('unlikeFeedPost', () => {
    it('should unlike a post successfully', async () => {
      mockTransaction.get.mockResolvedValue({
        exists: () => true,
      });

      await unlikeFeedPost('user-123', 'post-123');

      expect(mockTransaction.delete).toHaveBeenCalled();
      expect(mockTransaction.update).toHaveBeenCalled();
    });

    it('should not unlike if not liked', async () => {
      mockTransaction.get.mockResolvedValue({
        exists: () => false,
      });

      await unlikeFeedPost('user-123', 'post-123');

      expect(mockTransaction.delete).not.toHaveBeenCalled();
    });
  });

  describe('addComment', () => {
    it('should add a comment successfully', async () => {
      const mockUserData = {
        username: 'testuser',
        displayName: 'Test User',
        avatar: 'avatar-url',
      };

      const mockUserDoc = {
        exists: () => true,
        data: () => mockUserData,
      };

      mockTransaction.get.mockResolvedValue(mockUserDoc);

      const commentData = {
        content: 'Test comment',
        parentCommentId: null,
      };

      await addComment('user-123', 'post-123', commentData);

      expect(mockTransaction.set).toHaveBeenCalled();
      expect(mockTransaction.update).toHaveBeenCalled();
    });
  });

  describe('addBookmark', () => {
    it('should add a bookmark successfully', async () => {
      mockTransaction.get.mockResolvedValue({
        exists: () => false,
      });

      await addBookmark('user-123', 'post-123');

      expect(mockTransaction.set).toHaveBeenCalled();
    });
  });

  describe('removeBookmark', () => {
    it('should remove a bookmark successfully', async () => {
      mockTransaction.get.mockResolvedValue({
        exists: () => true,
      });

      await removeBookmark('user-123', 'post-123');

      expect(mockTransaction.delete).toHaveBeenCalled();
    });
  });
});