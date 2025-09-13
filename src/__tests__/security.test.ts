/**
 * @jest-environment node
 */
import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock Next.js Request/Response antes de importar
global.Request = class MockRequest {
  constructor(public url: string, public init?: any) {}
  headers = new Map();
  json = jest.fn();
  text = jest.fn();
} as any;

global.Response = class MockResponse {
  constructor(public body?: any, public init?: any) {}
  headers = new Map();
  json = jest.fn();
} as any;

// Mock NextRequest y NextResponse
const mockNextRequest = {
  nextUrl: { pathname: '/test' },
  headers: new Map([['user-agent', 'test-agent']]),
  ip: '127.0.0.1',
  json: jest.fn(),
  text: jest.fn()
};

const mockNextResponse = {
  json: jest.fn((data: any, init?: any) => ({ data, init })),
  next: jest.fn(() => ({ headers: new Map() }))
};

jest.mock('next/server', () => ({
  NextRequest: jest.fn(() => mockNextRequest),
  NextResponse: mockNextResponse
}));

import {
  detectSQLInjection,
  detectXSS,
  sanitizeString,
  sanitizeObject,
  rateLimit
} from '@/middleware/security';
import { trackSecurityEvent, isIPBlocked, temporaryIPBlock } from '@/lib/security-alerts';
import { securityHeadersMiddleware } from '@/middleware/csp';

// Mock console methods para evitar spam en tests
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

beforeAll(() => {
  console.warn = jest.fn();
  console.error = jest.fn();
  jest.useFakeTimers();
});

afterAll(() => {
  console.warn = originalConsoleWarn;
  console.error = originalConsoleError;
  jest.useRealTimers();
});

afterEach(() => {
  // Clear all timers and mocks after each test
  jest.clearAllTimers();
  jest.clearAllMocks();
  // Clear any pending timeouts
  jest.runOnlyPendingTimers();
});

describe('Security Middleware Tests', () => {
  describe('SQL Injection Detection', () => {
    test('should detect basic SQL injection patterns', async () => {
      const maliciousInputs = [
        "' OR '1'='1",
        "admin'--",
        "1; DROP TABLE users;",
        "UNION SELECT * FROM passwords",
        "' OR 1=1--",
        "admin'; DELETE FROM users; --"
      ];

      for (const input of maliciousInputs) {
        const isDetected = await detectSQLInjection(input, '/test', 'test-agent', '127.0.0.1');
        expect(isDetected).toBe(true);
      }
    });

    test('should not flag legitimate inputs', async () => {
      const legitimateInputs = [
        "john.doe@example.com",
        "My name is John O'Connor",
        "Password123!",
        "Hello world",
        "User input with numbers 123"
      ];

      for (const input of legitimateInputs) {
        const isDetected = await detectSQLInjection(input, '/test', 'test-agent', '127.0.0.1');
        expect(isDetected).toBe(false);
      }
    });

    test('should handle non-string inputs gracefully', async () => {
      const nonStringInputs = [null, undefined, 123, {}, []];

      for (const input of nonStringInputs) {
        const isDetected = await detectSQLInjection(input as any);
        expect(isDetected).toBe(false);
      }
    });
  });

  describe('XSS Detection', () => {
    test('should detect XSS patterns', async () => {
      const xssInputs = [
        "<script>alert('xss')</script>",
        "<iframe src='javascript:alert(1)'></iframe>",
        "<img onerror='alert(1)' src='x'>",
        "<svg onload='alert(1)'></svg>",
        "javascript:alert('xss')",
        "<object data='javascript:alert(1)'></object>"
      ];

      for (const input of xssInputs) {
        const isDetected = await detectXSS(input, '/test', 'test-agent', '127.0.0.1');
        expect(isDetected).toBe(true);
      }
    });

    test('should not flag legitimate HTML-like content', async () => {
      const legitimateInputs = [
        "Check out this link: https://example.com",
        "Email me at user@domain.com",
        "Price: $19.99 (was $29.99)",
        "Meeting at 3:00 PM"
      ];

      for (const input of legitimateInputs) {
        const isDetected = await detectXSS(input, '/test', 'test-agent', '127.0.0.1');
        expect(isDetected).toBe(false);
      }
    });
  });

  describe('String Sanitization', () => {
    test('should remove dangerous characters', () => {
      const input = '<script>alert("xss")</script>';
      const sanitized = sanitizeString(input);
      expect(sanitized).not.toContain('<');
      expect(sanitized).not.toContain('>');
      expect(sanitized).not.toContain('"');
    });

    test('should limit string length', () => {
      const longInput = 'a'.repeat(2000);
      const sanitized = sanitizeString(longInput);
      expect(sanitized.length).toBeLessThanOrEqual(1000);
    });

    test('should handle non-string inputs', () => {
      expect(sanitizeString(123 as any)).toBe('123');
      expect(sanitizeString(null as any)).toBe('null');
      expect(sanitizeString(undefined as any)).toBe('undefined');
    });

    test('should trim whitespace', () => {
      const input = '  hello world  ';
      const sanitized = sanitizeString(input);
      expect(sanitized).toBe('hello world');
    });
  });

  describe('Object Sanitization', () => {
    test('should sanitize nested objects', async () => {
      const maliciousObject = {
        name: '<script>alert("xss")</script>',
        email: 'user@example.com',
        nested: {
          comment: "' OR '1'='1",
          safe: 'legitimate content'
        }
      };

      const sanitized = await sanitizeObject(maliciousObject, '/test', 'test-agent', '127.0.0.1') as any;
      
      expect(sanitized.name).not.toContain('<script>');
      expect(sanitized.email).toBe('user@example.com');
      expect(sanitized.nested.comment).not.toContain("' OR '");
      expect(sanitized.nested.safe).toBe('legitimate content');
    });

    test('should handle arrays', async () => {
      const arrayWithMalicious = [
        'safe content',
        '<script>alert(1)</script>',
        "' OR '1'='1"
      ];

      const sanitized = await sanitizeObject(arrayWithMalicious, '/test', 'test-agent', '127.0.0.1') as string[];
      
      expect(sanitized[0]).toBe('safe content');
      expect(sanitized[1]).not.toContain('<script>');
      expect(sanitized[2]).not.toContain("' OR '");
    });

    test('should preserve non-string values', async () => {
      const mixedObject = {
        string: 'text',
        number: 42,
        boolean: true,
        nullValue: null,
        undefinedValue: undefined
      };

      const sanitized = await sanitizeObject(mixedObject) as any;
      
      expect(sanitized.string).toBe('text');
      expect(sanitized.number).toBe(42);
      expect(sanitized.boolean).toBe(true);
      expect(sanitized.nullValue).toBe(null);
      expect(sanitized.undefinedValue).toBe(undefined);
    });
  });

  describe('Rate Limiting', () => {
    beforeEach(() => {
      // Clear rate limit map before each test
      jest.clearAllMocks();
    });

    test('should allow requests within limit', async () => {
      const ip = '192.168.1.1';
      const maxRequests = 5;
      const windowMs = 60000;

      // First 5 requests should pass
      for (let i = 0; i < maxRequests; i++) {
        const allowed = await rateLimit(ip, maxRequests, windowMs, '/test', 'test-agent');
        expect(allowed).toBe(true);
      }
    });

    test('should block requests exceeding limit', async () => {
      const ip = '192.168.1.2';
      const maxRequests = 3;
      const windowMs = 60000;

      // First 3 requests should pass
      for (let i = 0; i < maxRequests; i++) {
        const allowed = await rateLimit(ip, maxRequests, windowMs, '/test', 'test-agent');
        expect(allowed).toBe(true);
      }

      // 4th request should be blocked
      const blocked = await rateLimit(ip, maxRequests, windowMs, '/test', 'test-agent');
      expect(blocked).toBe(false);
    });

    test('should reset after time window', async () => {
      const ip = '192.168.1.3';
      const maxRequests = 2;
      const windowMs = 100; // Very short window for testing

      // Exhaust the limit
      await rateLimit(ip, maxRequests, windowMs, '/test', 'test-agent');
      await rateLimit(ip, maxRequests, windowMs, '/test', 'test-agent');
      
      // Should be blocked
      let blocked = await rateLimit(ip, maxRequests, windowMs, '/test', 'test-agent');
      expect(blocked).toBe(false);

      // Wait for window to reset
      jest.advanceTimersByTime(windowMs + 10);

      // Should be allowed again
      const allowed = await rateLimit(ip, maxRequests, windowMs, '/test', 'test-agent');
      expect(allowed).toBe(true);
    });
  });

  describe('Security Alerts System', () => {
    test('should block IP after multiple security events', async () => {
      const testIP = '10.0.0.1';
      
      // Simulate multiple SQL injection attempts
      for (let i = 0; i < 3; i++) {
        await trackSecurityEvent('SQL_INJECTION', testIP, {
          endpoint: '/test',
          userAgent: 'test-agent',
          payload: "' OR '1'='1"
        });
      }

      // IP should be blocked after threshold
      expect(isIPBlocked(testIP)).toBe(true);
    });

    test('should unblock IP after timeout', async () => {
      const testIP = '10.0.0.2';
      
      // Block IP temporarily
      await temporaryIPBlock(testIP, 'TEST_BLOCK', 100); // 100ms block
      
      expect(isIPBlocked(testIP)).toBe(true);
      
      // Wait for block to expire
      jest.advanceTimersByTime(150);
      
      expect(isIPBlocked(testIP)).toBe(false);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle empty strings', async () => {
      expect(await detectSQLInjection('')).toBe(false);
      expect(await detectXSS('')).toBe(false);
      expect(sanitizeString('')).toBe('');
    });

    test('should handle very long inputs', async () => {
      const longInput = 'a'.repeat(10000);
      
      // Should not crash
      expect(await detectSQLInjection(longInput)).toBe(false);
      expect(await detectXSS(longInput)).toBe(false);
      
      // Should be truncated
      const sanitized = sanitizeString(longInput);
      expect(sanitized.length).toBeLessThanOrEqual(1000);
    });

    test('should handle special characters', async () => {
      const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      
      // Should not crash
      expect(await detectSQLInjection(specialChars)).toBe(false);
      expect(await detectXSS(specialChars)).toBe(false);
    });
  });
});

// Integration tests
describe('Security Integration Tests', () => {
  test('should handle complex attack scenarios', async () => {
    const complexAttack = {
      username: "admin'--",
      password: "<script>alert('xss')</script>",
      comment: "'; DROP TABLE users; --",
      profile: {
        bio: "<iframe src='javascript:alert(1)'></iframe>",
        website: "javascript:alert('hack')"
      }
    };

    const sanitized = await sanitizeObject(complexAttack, '/test', 'test-agent', '127.0.0.1') as any;
    
    // All malicious content should be sanitized
    expect(sanitized.username).not.toContain("'--");
    expect(sanitized.password).not.toContain('<script>');
    expect(sanitized.comment).not.toContain('DROP TABLE');
    expect(sanitized.profile.bio).not.toContain('<iframe>');
    expect(sanitized.profile.website).not.toContain('javascript:');
  });

  test('should maintain data integrity while sanitizing', async () => {
    const legitimateData = {
      name: 'John O\'Connor',
      email: 'john@example.com',
      age: 30,
      active: true,
      tags: ['developer', 'javascript', 'security'],
      metadata: {
        created: new Date(),
        score: 95.5
      }
    };

    const sanitized = await sanitizeObject(legitimateData) as any;
    
    // Legitimate data should be preserved
    expect(sanitized.name).toContain('John');
    expect(sanitized.email).toBe('john@example.com');
    expect(sanitized.age).toBe(30);
    expect(sanitized.active).toBe(true);
    expect(Array.isArray(sanitized.tags)).toBe(true);
    expect(sanitized.tags).toHaveLength(3);
    expect(typeof sanitized.metadata).toBe('object');
  });
});