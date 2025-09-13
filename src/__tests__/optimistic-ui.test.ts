import {
  optimisticLikeFeedPost,
  optimisticUnlikeFeedPost,
  optimisticAddBookmark,
  optimisticRemoveBookmark,
  processOperationQueue,
  likeFeedPost,
  unlikeFeedPost,
  addBookmark,
  removeBookmark,
  resetAllMocks
} from './test-setup';

describe('Optimistic UI', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear any pending operations
    (global as any).pendingOperations = [];
  });

  describe('optimisticLikeFeedPost', () => {
    it('should update UI immediately and queue operation', async () => {
      const mockUpdateUI = jest.fn();
      
      await optimisticLikeFeedPost('user-123', 'post-123', mockUpdateUI);
      
      // Should call UI update immediately
      expect(mockUpdateUI).toHaveBeenCalledWith('post-123', true);
      
      // Should queue the operation
      expect((global as any).pendingOperations).toHaveLength(1);
      expect((global as any).pendingOperations[0]).toMatchObject({
        type: 'like',
        userId: 'user-123',
        postId: 'post-123',
      });
    });
  });

  describe('optimisticUnlikeFeedPost', () => {
    it('should update UI immediately and queue operation', async () => {
      const mockUpdateUI = jest.fn();
      
      await optimisticUnlikeFeedPost('user-123', 'post-123', mockUpdateUI);
      
      // Should call UI update immediately
      expect(mockUpdateUI).toHaveBeenCalledWith('post-123', false);
      
      // Should queue the operation
      expect((global as any).pendingOperations).toHaveLength(1);
      expect((global as any).pendingOperations[0]).toMatchObject({
        type: 'unlike',
        userId: 'user-123',
        postId: 'post-123',
      });
    });
  });

  describe('optimisticAddBookmark', () => {
    it('should update UI immediately and queue operation', async () => {
      const mockUpdateUI = jest.fn();
      
      await optimisticAddBookmark('user-123', 'post-123', mockUpdateUI);
      
      // Should call UI update immediately
      expect(mockUpdateUI).toHaveBeenCalledWith('post-123', true);
      
      // Should queue the operation
      expect((global as any).pendingOperations).toHaveLength(1);
      expect((global as any).pendingOperations[0]).toMatchObject({
        type: 'bookmark',
        userId: 'user-123',
        postId: 'post-123',
      });
    });
  });

  describe('optimisticRemoveBookmark', () => {
    it('should update UI immediately and queue operation', async () => {
      const mockUpdateUI = jest.fn();
      
      await optimisticRemoveBookmark('user-123', 'post-123', mockUpdateUI);
      
      // Should call UI update immediately
      expect(mockUpdateUI).toHaveBeenCalledWith('post-123', false);
      
      // Should queue the operation
      expect((global as any).pendingOperations).toHaveLength(1);
      expect((global as any).pendingOperations[0]).toMatchObject({
        type: 'unbookmark',
        userId: 'user-123',
        postId: 'post-123',
      });
    });
  });

  describe('processOperationQueue', () => {
    it('should process like operations', async () => {
      (likeFeedPost as jest.Mock).mockResolvedValue(undefined);
      
      // Add a like operation to the queue
      (global as any).pendingOperations = [{
        id: 'op-1',
        type: 'like',
        userId: 'user-123',
        postId: 'post-123',
        timestamp: Date.now(),
      }];
      
      await processOperationQueue();
      
      expect(likeFeedPost).toHaveBeenCalledWith('user-123', 'post-123');
      expect((global as any).pendingOperations).toHaveLength(0);
    });

    it('should process unlike operations', async () => {
      (unlikeFeedPost as jest.Mock).mockResolvedValue(undefined);
      
      // Add an unlike operation to the queue
      (global as any).pendingOperations = [{
        id: 'op-1',
        type: 'unlike',
        userId: 'user-123',
        postId: 'post-123',
        timestamp: Date.now(),
      }];
      
      await processOperationQueue();
      
      expect(unlikeFeedPost).toHaveBeenCalledWith('user-123', 'post-123');
      expect((global as any).pendingOperations).toHaveLength(0);
    });

    it('should process bookmark operations', async () => {
      (addBookmark as jest.Mock).mockResolvedValue(undefined);
      
      // Add a bookmark operation to the queue
      (global as any).pendingOperations = [{
        id: 'op-1',
        type: 'bookmark',
        userId: 'user-123',
        postId: 'post-123',
        timestamp: Date.now(),
      }];
      
      await processOperationQueue();
      
      expect(addBookmark).toHaveBeenCalledWith('user-123', 'post-123');
      expect((global as any).pendingOperations).toHaveLength(0);
    });

    it('should process unbookmark operations', async () => {
      (removeBookmark as jest.Mock).mockResolvedValue(undefined);
      
      // Add an unbookmark operation to the queue
      (global as any).pendingOperations = [{
        id: 'op-1',
        type: 'unbookmark',
        userId: 'user-123',
        postId: 'post-123',
        timestamp: Date.now(),
      }];
      
      await processOperationQueue();
      
      expect(removeBookmark).toHaveBeenCalledWith('user-123', 'post-123');
      expect((global as any).pendingOperations).toHaveLength(0);
    });

    it('should handle operation failures gracefully', async () => {
      (likeFeedPost as jest.Mock).mockRejectedValue(new Error('Network error'));
      
      // Add a like operation to the queue
      (global as any).pendingOperations = [{
        id: 'op-1',
        type: 'like',
        userId: 'user-123',
        postId: 'post-123',
        timestamp: Date.now(),
      }];
      
      // Should not throw error
      await expect(processOperationQueue()).resolves.not.toThrow();
      
      // Operation should remain in queue for retry
      expect((global as any).pendingOperations).toHaveLength(1);
    });

    it('should process multiple operations in order', async () => {
      (likeFeedPost as jest.Mock).mockResolvedValue(undefined);
      (addBookmark as jest.Mock).mockResolvedValue(undefined);
      
      // Add multiple operations to the queue
      (global as any).pendingOperations = [
        {
          id: 'op-1',
          type: 'like',
          userId: 'user-123',
          postId: 'post-123',
          timestamp: Date.now() - 1000,
        },
        {
          id: 'op-2',
          type: 'bookmark',
          userId: 'user-123',
          postId: 'post-456',
          timestamp: Date.now(),
        },
      ];
      
      await processOperationQueue();
      
      expect(likeFeedPost).toHaveBeenCalledWith('user-123', 'post-123');
      expect(addBookmark).toHaveBeenCalledWith('user-123', 'post-456');
      expect((global as any).pendingOperations).toHaveLength(0);
    });
  });
});