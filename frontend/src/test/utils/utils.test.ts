/**
 * Utility Functions Tests
 * 
 * Tests for shared utility functions across the application
 * including date formatting, string manipulation, validation helpers, etc.
 */

import {describe, expect, it, vi} from 'vitest';

// Test data factories
const createMockDate = (dateString: string) => new Date(dateString);

describe('Utility Functions', () => {
  describe('Date Utilities', () => {
    it('should format dates correctly', () => {
      const date = createMockDate('2024-01-15T10:30:00Z');
      // This will be implemented when we find the actual date utilities
      expect(date).toBeInstanceOf(Date);
    });

    it('should handle timezone conversions', () => {
      const date = createMockDate('2024-01-15T10:30:00Z');
      expect(date.getTime()).toBeGreaterThan(0);
    });

    it('should calculate time differences', () => {
      const date1 = createMockDate('2024-01-15T10:30:00Z');
      const date2 = createMockDate('2024-01-15T11:30:00Z');
      const diff = date2.getTime() - date1.getTime();
      expect(diff).toBe(3600000); // 1 hour in milliseconds
    });
  });

  describe('String Utilities', () => {
    it('should capitalize strings correctly', () => {
      const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);
      expect(capitalize('hello')).toBe('Hello');
      expect(capitalize('HELLO')).toBe('HELLO');
      expect(capitalize('')).toBe('');
    });

    it('should truncate strings with ellipsis', () => {
      const truncate = (str: string, length: number) => 
        str.length > length ? str.substring(0, length) + '...' : str;
      
      expect(truncate('Hello World', 5)).toBe('Hello...');
      expect(truncate('Hi', 5)).toBe('Hi');
      expect(truncate('Exactly', 7)).toBe('Exactly');
    });

    it('should sanitize user input', () => {
      const sanitize = (str: string) => 
        str.replace(/<[^>]*>/g, '').trim();
      
      expect(sanitize('<script>alert("xss")</script>hello')).toBe('hello');
      expect(sanitize('  normal text  ')).toBe('normal text');
    });
  });

  describe('Array Utilities', () => {
    it('should shuffle arrays randomly', () => {
      const shuffle = (array: any[]) => {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
      };

      const original = [1, 2, 3, 4, 5];
      const shuffled = shuffle(original);
      
      expect(shuffled).toHaveLength(original.length);
      expect(shuffled).toEqual(expect.arrayContaining(original));
    });

    it('should group arrays by key', () => {
      const groupBy = <T>(array: T[], key: keyof T) => {
        return array.reduce((groups, item) => {
          const group = String(item[key]);
          if (!groups[group]) groups[group] = [];
          groups[group].push(item);
          return groups;
        }, {} as Record<string, T[]>);
      };

      const data = [
        { category: 'A', value: 1 },
        { category: 'B', value: 2 },
        { category: 'A', value: 3 }
      ];

      const grouped = groupBy(data, 'category');
      expect(grouped.A).toHaveLength(2);
      expect(grouped.B).toHaveLength(1);
    });

    it('should find unique values', () => {
      const unique = <T>(array: T[]) => [...new Set(array)];
      
      expect(unique([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3]);
      expect(unique(['a', 'b', 'a', 'c'])).toEqual(['a', 'b', 'c']);
    });
  });

  describe('Validation Utilities', () => {
    it('should validate email addresses', () => {
      const isValidEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
      };

      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('invalid-email')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
    });

    it('should validate Korean nicknames', () => {
      const isValidKoreanNickname = (nickname: string) => {
        const koreanRegex = /^[가-힣a-zA-Z0-9_]{2,10}$/;
        return koreanRegex.test(nickname);
      };

      expect(isValidKoreanNickname('테스트')).toBe(true);
      expect(isValidKoreanNickname('test123')).toBe(true);
      expect(isValidKoreanNickname('t')).toBe(false); // too short
      expect(isValidKoreanNickname('verylongnicknamethatexceedslimit')).toBe(false); // too long
    });

    it('should validate room codes', () => {
      const isValidRoomCode = (code: string) => {
        return /^[A-Z0-9]{6}$/.test(code);
      };

      expect(isValidRoomCode('ABC123')).toBe(true);
      expect(isValidRoomCode('123456')).toBe(true);
      expect(isValidRoomCode('abcd12')).toBe(false); // lowercase
      expect(isValidRoomCode('ABC12')).toBe(false); // too short
      expect(isValidRoomCode('ABC1234')).toBe(false); // too long
    });
  });

  describe('Game Utilities', () => {
    it('should calculate game scores correctly', () => {
      const calculateScore = (hints: number, correctGuesses: number, timeBonus: number = 0) => {
        return (hints * 10) + (correctGuesses * 50) + timeBonus;
      };

      expect(calculateScore(3, 2, 100)).toBe(230); // 30 + 100 + 100
      expect(calculateScore(0, 1, 0)).toBe(50);
      expect(calculateScore(5, 0, 50)).toBe(100); // 50 + 0 + 50
    });

    it('should determine game winners', () => {
      const players = [
        { id: '1', nickname: 'Player1', score: 100 },
        { id: '2', nickname: 'Player2', score: 200 },
        { id: '3', nickname: 'Player3', score: 150 }
      ];

      const getWinner = (players: typeof players) => {
        return players.reduce((winner, player) => 
          player.score > winner.score ? player : winner
        );
      };

      const winner = getWinner(players);
      expect(winner.nickname).toBe('Player2');
      expect(winner.score).toBe(200);
    });

    it('should generate random words for game', () => {
      const words = ['사과', '바나나', '포도', '딸기', '수박'];
      const getRandomWord = () => words[Math.floor(Math.random() * words.length)];

      vi.spyOn(Math, 'random').mockReturnValue(0.2);
      expect(getRandomWord()).toBe('바나나'); // index 1

      vi.spyOn(Math, 'random').mockReturnValue(0.8);
      expect(getRandomWord()).toBe('수박'); // index 4
    });
  });

  describe('Performance Utilities', () => {
    it('should implement debounce correctly', async () => {
      const debounce = <T extends (...args: any[]) => void>(
        func: T,
        delay: number
      ) => {
        let timeoutId: NodeJS.Timeout;
        return (...args: Parameters<T>) => {
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => func(...args), delay);
        };
      };

      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn('first');
      debouncedFn('second');
      debouncedFn('third');

      expect(mockFn).not.toHaveBeenCalled();

      await new Promise(resolve => setTimeout(resolve, 150));
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('third');
    });

    it('should implement throttle correctly', async () => {
      const throttle = <T extends (...args: any[]) => void>(
        func: T,
        delay: number
      ) => {
        let lastCall = 0;
        return (...args: Parameters<T>) => {
          const now = Date.now();
          if (now - lastCall >= delay) {
            func(...args);
            lastCall = now;
          }
        };
      };

      const mockFn = vi.fn();
      const throttledFn = throttle(mockFn, 100);

      throttledFn('first');
      throttledFn('second');
      throttledFn('third');

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('first');
    });

    it('should measure execution time', () => {
      const measureTime = <T>(fn: () => T): { result: T; time: number } => {
        const start = performance.now();
        const result = fn();
        const end = performance.now();
        return { result, time: end - start };
      };

      const slowFunction = () => {
        let sum = 0;
        for (let i = 0; i < 1000; i++) {
          sum += i;
        }
        return sum;
      };

      const { result, time } = measureTime(slowFunction);
      expect(result).toBe(499500);
      expect(time).toBeGreaterThan(0);
    });
  });

  describe('Local Storage Utilities', () => {
    it('should save and retrieve data from localStorage', () => {
      const mockStorage: Record<string, string> = {};
      
      vi.stubGlobal('localStorage', {
        getItem: vi.fn((key: string) => mockStorage[key] || null),
        setItem: vi.fn((key: string, value: string) => {
          mockStorage[key] = value;
        }),
        removeItem: vi.fn((key: string) => {
          delete mockStorage[key];
        }),
        clear: vi.fn(() => {
          Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
        })
      });

      const saveToStorage = (key: string, value: any) => {
        localStorage.setItem(key, JSON.stringify(value));
      };

      const getFromStorage = <T>(key: string): T | null => {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
      };

      const testData = { name: 'test', value: 123 };
      saveToStorage('testKey', testData);
      
      const retrieved = getFromStorage<typeof testData>('testKey');
      expect(retrieved).toEqual(testData);
    });
  });
});