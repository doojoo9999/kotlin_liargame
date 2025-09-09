import { describe, it, expect } from 'vitest';
import { cn, formatTime, capitalizeFirst, generateId, sleep } from './utils';

describe('Utils', () => {
  describe('cn (className utility)', () => {
    it('merges class names correctly', () => {
      const result = cn('bg-red-500', 'text-white');
      expect(result).toBe('bg-red-500 text-white');
    });

    it('handles conditional classes', () => {
      const result = cn('base', true && 'conditional', false && 'not-included');
      expect(result).toBe('base conditional');
    });

    it('resolves Tailwind conflicts', () => {
      const result = cn('bg-red-500', 'bg-blue-500');
      expect(result).toBe('bg-blue-500');
    });

    it('handles undefined and null values', () => {
      const result = cn('base', null, undefined, 'end');
      expect(result).toBe('base end');
    });

    it('handles arrays of classes', () => {
      const result = cn(['bg-red-500', 'text-white'], 'p-4');
      expect(result).toBe('bg-red-500 text-white p-4');
    });
  });

  describe('formatTime', () => {
    it('formats seconds correctly', () => {
      expect(formatTime(0)).toBe('0:00');
      expect(formatTime(30)).toBe('0:30');
      expect(formatTime(59)).toBe('0:59');
    });

    it('formats minutes and seconds correctly', () => {
      expect(formatTime(60)).toBe('1:00');
      expect(formatTime(90)).toBe('1:30');
      expect(formatTime(125)).toBe('2:05');
    });

    it('formats hours correctly', () => {
      expect(formatTime(3600)).toBe('60:00'); // 1 hour as minutes
      expect(formatTime(3661)).toBe('61:01'); // 1 hour 1 minute 1 second
    });

    it('pads seconds with leading zero', () => {
      expect(formatTime(61)).toBe('1:01');
      expect(formatTime(305)).toBe('5:05');
    });

    it('handles large numbers', () => {
      expect(formatTime(7200)).toBe('120:00'); // 2 hours
      expect(formatTime(10800)).toBe('180:00'); // 3 hours
    });
  });

  describe('capitalizeFirst', () => {
    it('capitalizes first letter of string', () => {
      expect(capitalizeFirst('hello')).toBe('Hello');
      expect(capitalizeFirst('world')).toBe('World');
    });

    it('handles single character strings', () => {
      expect(capitalizeFirst('a')).toBe('A');
      expect(capitalizeFirst('z')).toBe('Z');
    });

    it('handles empty strings', () => {
      expect(capitalizeFirst('')).toBe('');
    });

    it('preserves rest of string casing', () => {
      expect(capitalizeFirst('hELLO wORLD')).toBe('HELLO wORLD');
      expect(capitalizeFirst('camelCase')).toBe('CamelCase');
    });

    it('handles strings starting with numbers', () => {
      expect(capitalizeFirst('123abc')).toBe('123abc');
    });

    it('handles strings with special characters', () => {
      expect(capitalizeFirst('!hello')).toBe('!hello');
      expect(capitalizeFirst('@world')).toBe('@world');
    });
  });

  describe('generateId', () => {
    it('generates a string', () => {
      const id = generateId();
      expect(typeof id).toBe('string');
    });

    it('generates non-empty string', () => {
      const id = generateId();
      expect(id.length).toBeGreaterThan(0);
    });

    it('generates different IDs on subsequent calls', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
    });

    it('generates IDs with expected length', () => {
      const id = generateId();
      // Math.random().toString(36).substr(2, 9) should generate string up to 9 chars
      expect(id.length).toBeLessThanOrEqual(9);
      expect(id.length).toBeGreaterThan(0);
    });

    it('generates alphanumeric IDs', () => {
      const id = generateId();
      expect(id).toMatch(/^[a-z0-9]+$/);
    });
  });

  describe('sleep', () => {
    it('returns a promise', () => {
      const result = sleep(1);
      expect(result).toBeInstanceOf(Promise);
    });

    it('resolves after specified time', async () => {
      const start = Date.now();
      await sleep(50); // 50ms
      const end = Date.now();
      const elapsed = end - start;
      
      // Allow some tolerance for timing
      expect(elapsed).toBeGreaterThanOrEqual(40);
      expect(elapsed).toBeLessThan(100);
    });

    it('resolves with undefined', async () => {
      const result = await sleep(1);
      expect(result).toBeUndefined();
    });

    it('works with zero delay', async () => {
      const start = Date.now();
      await sleep(0);
      const end = Date.now();
      const elapsed = end - start;
      
      // Should resolve very quickly (allow more tolerance for test environment)
      expect(elapsed).toBeLessThan(50);
    });

    it('can be used with Promise.race', async () => {
      const promise1 = sleep(100).then(() => 'slow');
      const promise2 = sleep(10).then(() => 'fast');
      
      const result = await Promise.race([promise1, promise2]);
      expect(result).toBe('fast');
    });
  });

  describe('Edge cases and error handling', () => {
    it('formatTime handles negative numbers', () => {
      expect(formatTime(-30)).toBe('-1:-30');
      expect(formatTime(-1)).toBe('-1:-1');
    });

    it('capitalizeFirst handles whitespace', () => {
      expect(capitalizeFirst(' hello')).toBe(' hello');
      expect(capitalizeFirst('\thello')).toBe('\thello');
    });

    it('generateId generates unique IDs in rapid succession', () => {
      const ids = Array.from({ length: 100 }, () => generateId());
      const uniqueIds = new Set(ids);
      
      // Should have high uniqueness rate
      expect(uniqueIds.size).toBeGreaterThan(95);
    });
  });
});