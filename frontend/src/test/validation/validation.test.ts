/**
 * Validation Tests
 * 
 * Tests for form validation, data validation, and input sanitization
 * using Zod schemas and custom validation functions.
 */

import {describe, expect, it} from 'vitest';
import {z} from 'zod';

describe('Validation', () => {
  describe('Authentication Validation', () => {
    it('should validate login form data', () => {
      const loginSchema = z.object({
        nickname: z
          .string()
          .min(2, '닉네임은 2자 이상이어야 합니다.')
          .max(10, '닉네임은 10자 이하여야 합니다.')
          .regex(/^[가-힣a-zA-Z0-9_]+$/, '닉네임은 한글, 영문, 숫자, 밑줄만 사용할 수 있습니다.'),
      });

      // Valid data
      const validData = { nickname: '테스트유저' };
      const result = loginSchema.safeParse(validData);
      expect(result.success).toBe(true);

      // Invalid data - too short
      const invalidShort = { nickname: 'a' };
      const resultShort = loginSchema.safeParse(invalidShort);
      expect(resultShort.success).toBe(false);
      if (!resultShort.success) {
        expect(resultShort.error.errors[0].message).toBe('닉네임은 2자 이상이어야 합니다.');
      }

      // Invalid data - too long
      const invalidLong = { nickname: 'verylongnicknamethatexceedslimit' };
      const resultLong = loginSchema.safeParse(invalidLong);
      expect(resultLong.success).toBe(false);

      // Invalid data - special characters
      const invalidSpecial = { nickname: '테스트@유저!' };
      const resultSpecial = loginSchema.safeParse(invalidSpecial);
      expect(resultSpecial.success).toBe(false);
      if (!resultSpecial.success) {
        expect(resultSpecial.error.errors[0].message).toBe('닉네임은 한글, 영문, 숫자, 밑줄만 사용할 수 있습니다.');
      }
    });

    it('should validate room code format', () => {
      const roomCodeSchema = z
        .string()
        .length(6, '방 코드는 6자리여야 합니다.')
        .regex(/^[A-Z0-9]+$/, '방 코드는 대문자 영문과 숫자만 사용할 수 있습니다.');

      // Valid room codes
      expect(roomCodeSchema.safeParse('ABC123').success).toBe(true);
      expect(roomCodeSchema.safeParse('XYZ789').success).toBe(true);
      expect(roomCodeSchema.safeParse('123456').success).toBe(true);

      // Invalid room codes
      expect(roomCodeSchema.safeParse('abc123').success).toBe(false); // lowercase
      expect(roomCodeSchema.safeParse('ABC12').success).toBe(false); // too short
      expect(roomCodeSchema.safeParse('ABC1234').success).toBe(false); // too long
      expect(roomCodeSchema.safeParse('ABC-12').success).toBe(false); // special char
    });
  });

  describe('Game Validation', () => {
    it('should validate game settings', () => {
      const gameSettingsSchema = z.object({
        maxPlayers: z
          .number()
          .int('플레이어 수는 정수여야 합니다.')
          .min(3, '최소 3명의 플레이어가 필요합니다.')
          .max(12, '최대 12명의 플레이어만 허용됩니다.'),
        timeLimit: z
          .number()
          .int('제한 시간은 정수여야 합니다.')
          .min(60, '제한 시간은 최소 60초입니다.')
          .max(600, '제한 시간은 최대 600초입니다.'),
        difficulty: z.enum(['easy', 'medium', 'hard'], {
          errorMap: () => ({ message: '난이도는 easy, medium, hard 중 하나여야 합니다.' })
        }).optional()
      });

      // Valid settings
      const validSettings = {
        maxPlayers: 6,
        timeLimit: 300,
        difficulty: 'medium' as const
      };
      expect(gameSettingsSchema.safeParse(validSettings).success).toBe(true);

      // Invalid settings
      const invalidSettings = {
        maxPlayers: 2, // too few
        timeLimit: 30, // too short
        difficulty: 'invalid' as any
      };
      const result = gameSettingsSchema.safeParse(invalidSettings);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors).toHaveLength(3);
      }
    });

    it('should validate hint input', () => {
      const hintSchema = z
        .string()
        .trim()
        .min(1, '힌트는 비어있을 수 없습니다.')
        .max(100, '힌트는 100자 이하여야 합니다.')
        .refine(
          (hint) => !hint.includes('거짓말쟁이'),
          '힌트에 "거짓말쟁이"라는 단어를 포함할 수 없습니다.'
        )
        .refine(
          (hint) => !/[욕설|비속어|나쁜말]/.test(hint),
          '부적절한 언어는 사용할 수 없습니다.'
        );

      // Valid hints
      expect(hintSchema.safeParse('빨간색이고 달콤해요').success).toBe(true);
      expect(hintSchema.safeParse('과일의 왕').success).toBe(true);

      // Invalid hints
      expect(hintSchema.safeParse('').success).toBe(false); // empty
      expect(hintSchema.safeParse('거짓말쟁이는 누구인가요?').success).toBe(false); // forbidden word
      expect(hintSchema.safeParse('a'.repeat(101)).success).toBe(false); // too long
    });

    it('should validate voting input', () => {
      const voteSchema = z.object({
        votedPlayerId: z
          .string()
          .uuid('유효하지 않은 플레이어 ID입니다.')
          .optional(),
        confidence: z
          .number()
          .min(1, '확신도는 1 이상이어야 합니다.')
          .max(10, '확신도는 10 이하여야 합니다.')
          .optional(),
        reason: z
          .string()
          .max(200, '투표 이유는 200자 이하여야 합니다.')
          .optional()
      }).refine(
        (data) => data.votedPlayerId !== undefined,
        { message: '투표할 플레이어를 선택해야 합니다.' }
      );

      // Valid vote
      const validVote = {
        votedPlayerId: '550e8400-e29b-41d4-a716-446655440000',
        confidence: 8,
        reason: '행동이 의심스러워요'
      };
      expect(voteSchema.safeParse(validVote).success).toBe(true);

      // Invalid vote - missing player
      const invalidVote = {
        confidence: 8,
        reason: '이유'
      };
      expect(voteSchema.safeParse(invalidVote).success).toBe(false);
    });
  });

  describe('Chat Validation', () => {
    it('should validate chat messages', () => {
      const chatMessageSchema = z
        .string()
        .trim()
        .min(1, '메시지는 비어있을 수 없습니다.')
        .max(500, '메시지는 500자 이하여야 합니다.')
        .refine(
          (message) => !/<[^>]*>/g.test(message),
          'HTML 태그는 허용되지 않습니다.'
        )
        .refine(
          (message) => !/javascript:|data:|vbscript:/i.test(message),
          '스크립트 코드는 허용되지 않습니다.'
        );

      // Valid messages
      expect(chatMessageSchema.safeParse('안녕하세요!').success).toBe(true);
      expect(chatMessageSchema.safeParse('게임 재미있네요 😊').success).toBe(true);

      // Invalid messages
      expect(chatMessageSchema.safeParse('').success).toBe(false); // empty
      expect(chatMessageSchema.safeParse('<script>alert("xss")</script>').success).toBe(false); // HTML
      expect(chatMessageSchema.safeParse('javascript:alert("xss")').success).toBe(false); // script
      expect(chatMessageSchema.safeParse('a'.repeat(501)).success).toBe(false); // too long
    });

    it('should validate whisper messages', () => {
      const whisperSchema = z.object({
        targetPlayerId: z
          .string()
          .uuid('유효하지 않은 플레이어 ID입니다.'),
        message: z
          .string()
          .trim()
          .min(1, '귓속말은 비어있을 수 없습니다.')
          .max(200, '귓속말은 200자 이하여야 합니다.')
      });

      // Valid whisper
      const validWhisper = {
        targetPlayerId: '550e8400-e29b-41d4-a716-446655440000',
        message: '비밀 메시지입니다'
      };
      expect(whisperSchema.safeParse(validWhisper).success).toBe(true);

      // Invalid whisper
      const invalidWhisper = {
        targetPlayerId: 'invalid-id',
        message: ''
      };
      expect(whisperSchema.safeParse(invalidWhisper).success).toBe(false);
    });
  });

  describe('UI Validation', () => {
    it('should validate theme settings', () => {
      const themeSchema = z.enum(['light', 'dark', 'auto'], {
        errorMap: () => ({ message: '테마는 light, dark, auto 중 하나여야 합니다.' })
      });

      expect(themeSchema.safeParse('light').success).toBe(true);
      expect(themeSchema.safeParse('dark').success).toBe(true);
      expect(themeSchema.safeParse('auto').success).toBe(true);
      expect(themeSchema.safeParse('invalid').success).toBe(false);
    });

    it('should validate notification settings', () => {
      const notificationSchema = z.object({
        type: z.enum(['success', 'error', 'warning', 'info']),
        message: z
          .string()
          .min(1, '알림 메시지는 비어있을 수 없습니다.')
          .max(200, '알림 메시지는 200자 이하여야 합니다.'),
        duration: z
          .number()
          .int('지속 시간은 정수여야 합니다.')
          .min(1000, '지속 시간은 최소 1초입니다.')
          .max(30000, '지속 시간은 최대 30초입니다.')
          .optional(),
        persistent: z.boolean().optional()
      });

      // Valid notification
      const validNotification = {
        type: 'success' as const,
        message: '게임에 성공적으로 참가했습니다.',
        duration: 5000,
        persistent: false
      };
      expect(notificationSchema.safeParse(validNotification).success).toBe(true);

      // Invalid notification
      const invalidNotification = {
        type: 'invalid' as any,
        message: '',
        duration: 500
      };
      expect(notificationSchema.safeParse(invalidNotification).success).toBe(false);
    });
  });

  describe('Data Sanitization', () => {
    it('should sanitize user input', () => {
      const sanitizeInput = (input: string): string => {
        return input
          .trim()
          .replace(/<[^>]*>/g, '') // Remove HTML tags
          .replace(/javascript:|data:|vbscript:/gi, '') // Remove script URLs
          .replace(/[<>&"']/g, (match) => {
            const entityMap: Record<string, string> = {
              '<': '&lt;',
              '>': '&gt;',
              '&': '&amp;',
              '"': '&quot;',
              "'": '&#x27;'
            };
            return entityMap[match] || match;
          });
      };

      expect(sanitizeInput('<script>alert("xss")</script>hello'))
        .toBe('alert("xss")hello');
      
      expect(sanitizeInput('javascript:alert("xss")'))
        .toBe('alert("xss")');
      
      expect(sanitizeInput('  normal text  '))
        .toBe('normal text');
      
      expect(sanitizeInput('Test & "quotes" \'single\' <tag>'))
        .toBe('Test &amp; &quot;quotes&quot; &#x27;single&#x27; &lt;tag&gt;');
    });

    it('should validate and sanitize file names', () => {
      const sanitizeFileName = (fileName: string): string => {
        return fileName
          .trim()
          .replace(/[^a-zA-Z0-9가-힣._-]/g, '_') // Replace invalid chars
          .replace(/^\.+/, '') // Remove leading dots
          .replace(/\.+$/, '') // Remove trailing dots
          .substring(0, 255); // Limit length
      };

      expect(sanitizeFileName('valid_file.txt')).toBe('valid_file.txt');
      expect(sanitizeFileName('invalid/file\\name.txt')).toBe('invalid_file_name.txt');
      expect(sanitizeFileName('...hidden_file')).toBe('hidden_file');
      expect(sanitizeFileName('file_name.')).toBe('file_name');
      expect(sanitizeFileName('한글파일명.txt')).toBe('한글파일명.txt');
    });
  });

  describe('Custom Validation Rules', () => {
    it('should validate Korean text', () => {
      const isKoreanText = (text: string): boolean => {
        const koreanRegex = /^[가-힣\s]+$/;
        return koreanRegex.test(text);
      };

      expect(isKoreanText('안녕하세요')).toBe(true);
      expect(isKoreanText('한글 텍스트')).toBe(true);
      expect(isKoreanText('Hello 안녕')).toBe(false);
      expect(isKoreanText('안녕123')).toBe(false);
    });

    it('should validate game phase transitions', () => {
      type GamePhase = 'waiting' | 'speech' | 'discussion' | 'voting' | 'defense' | 'final_vote' | 'ended';
      
      const validTransitions: Record<GamePhase, GamePhase[]> = {
        waiting: ['speech'],
        speech: ['discussion'],
        discussion: ['voting'],
        voting: ['defense', 'ended'],
        defense: ['final_vote'],
        final_vote: ['ended'],
        ended: ['waiting']
      };

      const isValidPhaseTransition = (from: GamePhase, to: GamePhase): boolean => {
        return validTransitions[from]?.includes(to) ?? false;
      };

      expect(isValidPhaseTransition('waiting', 'speech')).toBe(true);
      expect(isValidPhaseTransition('speech', 'discussion')).toBe(true);
      expect(isValidPhaseTransition('waiting', 'voting')).toBe(false); // Invalid skip
      expect(isValidPhaseTransition('ended', 'waiting')).toBe(true); // Restart game
    });

    it('should validate time-based constraints', () => {
      const isWithinTimeLimit = (
        startTime: Date,
        currentTime: Date,
        limitSeconds: number
      ): boolean => {
        const elapsedMs = currentTime.getTime() - startTime.getTime();
        const elapsedSeconds = elapsedMs / 1000;
        return elapsedSeconds <= limitSeconds;
      };

      const startTime = new Date('2024-01-15T10:00:00Z');
      const currentTime1 = new Date('2024-01-15T10:02:00Z'); // 2 minutes
      const currentTime2 = new Date('2024-01-15T10:06:00Z'); // 6 minutes

      expect(isWithinTimeLimit(startTime, currentTime1, 300)).toBe(true); // Within 5 minutes
      expect(isWithinTimeLimit(startTime, currentTime2, 300)).toBe(false); // Exceeds 5 minutes
    });

    it('should validate player count constraints', () => {
      const validatePlayerCount = (
        currentPlayers: number,
        maxPlayers: number,
        minPlayers: number = 3
      ): { valid: boolean; message?: string } => {
        if (currentPlayers < minPlayers) {
          return {
            valid: false,
            message: `최소 ${minPlayers}명의 플레이어가 필요합니다.`
          };
        }
        
        if (currentPlayers > maxPlayers) {
          return {
            valid: false,
            message: `최대 ${maxPlayers}명의 플레이어만 허용됩니다.`
          };
        }
        
        return { valid: true };
      };

      expect(validatePlayerCount(2, 6).valid).toBe(false);
      expect(validatePlayerCount(2, 6).message).toBe('최소 3명의 플레이어가 필요합니다.');
      
      expect(validatePlayerCount(7, 6).valid).toBe(false);
      expect(validatePlayerCount(7, 6).message).toBe('최대 6명의 플레이어만 허용됩니다.');
      
      expect(validatePlayerCount(4, 6).valid).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle validation errors gracefully', () => {
      const validateWithFallback = <T>(
        schema: z.ZodSchema<T>,
        data: unknown,
        fallback: T
      ): { data: T; errors: string[] } => {
        const result = schema.safeParse(data);
        
        if (result.success) {
          return { data: result.data, errors: [] };
        }
        
        const errors = result.error.errors.map(err => err.message);
        return { data: fallback, errors };
      };

      const schema = z.object({
        name: z.string().min(2),
        age: z.number().min(0)
      });

      const validData = { name: 'John', age: 25 };
      const validResult = validateWithFallback(schema, validData, { name: '', age: 0 });
      
      expect(validResult.data).toEqual(validData);
      expect(validResult.errors).toHaveLength(0);

      const invalidData = { name: 'J', age: -5 };
      const invalidResult = validateWithFallback(schema, invalidData, { name: 'Anonymous', age: 0 });
      
      expect(invalidResult.data).toEqual({ name: 'Anonymous', age: 0 });
      expect(invalidResult.errors.length).toBeGreaterThan(0);
    });

    it('should collect and format validation errors', () => {
      const formatValidationErrors = (errors: z.ZodIssue[]): Record<string, string> => {
        return errors.reduce((acc, error) => {
          const path = error.path.join('.');
          acc[path] = error.message;
          return acc;
        }, {} as Record<string, string>);
      };

      const mockErrors: z.ZodIssue[] = [
        {
          code: 'too_small',
          minimum: 2,
          type: 'string',
          inclusive: true,
          message: '닉네임은 2자 이상이어야 합니다.',
          path: ['nickname']
        },
        {
          code: 'too_small',
          minimum: 3,
          type: 'number',
          inclusive: true,
          message: '최소 3명의 플레이어가 필요합니다.',
          path: ['settings', 'maxPlayers']
        }
      ];

      const formattedErrors = formatValidationErrors(mockErrors);

      expect(formattedErrors['nickname']).toBe('닉네임은 2자 이상이어야 합니다.');
      expect(formattedErrors['settings.maxPlayers']).toBe('최소 3명의 플레이어가 필요합니다.');
    });
  });
});