// Mock Firebase Admin for testing
export const admin = {
  apps: [],
  initializeApp: jest.fn(),
  firestore: jest.fn(),
};

// Initialize Firebase Admin for testing
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'test-project',
    databaseURL: 'https://test-project.firebaseio.com',
  });
}

// Mock Firestore for testing
const mockFirestore = () => {
  const mockFirestore = {
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn(),
        set: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        collection: jest.fn(),
      })),
      add: jest.fn(),
      where: jest.fn(() => ({
        get: jest.fn(),
        orderBy: jest.fn(() => ({
          get: jest.fn(),
          limit: jest.fn(() => ({
            get: jest.fn(),
          })),
        })),
      })),
      get: jest.fn(),
    })),
    runTransaction: jest.fn(),
    batch: jest.fn(() => ({
      set: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      commit: jest.fn(),
    })),
    FieldValue: {
      serverTimestamp: jest.fn(() => 'mock-timestamp'),
      increment: jest.fn((value) => `increment-${value}`),
      arrayUnion: jest.fn((value) => `arrayUnion-${value}`),
      arrayRemove: jest.fn((value) => `arrayRemove-${value}`),
    },
    initializeApp: jest.fn(),
  };
  
  return {
    getFirestore: () => mockFirestore,
    FieldValue: mockFirestore.FieldValue,
    initializeApp: mockFirestore.initializeApp,
  };
};

export { mockFirestore };

// Export mock for use in tests
module.exports = { admin, mockFirestore };

// Global test timeout
jest.setTimeout(30000);