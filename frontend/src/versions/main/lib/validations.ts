import {z} from 'zod';

// 게임 생성 폼 스키마
export const createGameSchema = z.object({
  gameParticipants: z.number().min(4, '최소 4명 이상이어야 합니다.').max(10, '최대 10명까지 가능합니다.'),
  gameLiarCount: z.number().min(1, '최소 1명의 라이어가 필요합니다.').max(3, '최대 3명까지 가능합니다.'),
  gameTotalRounds: z.number().min(1, '최소 1라운드 이상이어야 합니다.').max(10, '최대 10라운드까지 가능합니다.'),
  gameMode: z.enum(['LIARS_KNOW', 'LIARS_DIFFERENT_WORD'], {
    errorMap: () => ({ message: '유효한 게임 모드를 선택해주세요.' })
  }),
  targetPoints: z.number().min(1, '최소 1점 이상이어야 합니다.').max(50, '최대 50점까지 가능합니다.'),
  useRandomSubjects: z.boolean().default(true),
  subjectIds: z.array(z.number()).optional(),
  randomSubjectCount: z.number().min(1).max(10).optional(),
});

// 채팅 메시지 스키마
export const chatMessageSchema = z.object({
  gameNumber: z.number(),
  content: z.string().min(1, '메시지를 입력해주세요.').max(500, '메시지는 500자를 초과할 수 없습니다.'),
  type: z.enum(['HINT', 'DISCUSSION', 'DEFENSE', 'POST_ROUND', 'SYSTEM']).default('DISCUSSION'),
});

// 투표 스키마
export const votingSchema = z.object({
  targetPlayerId: z.number(),
  confidence: z.number().min(1).max(5).optional(),
});

// 변론 스키마
export const defenseSchema = z.object({
  defenseText: z.string().min(1, '변론 내용을 입력해주세요.').max(1000, '변론은 1000자를 초과할 수 없습니다.'),
});

// 라이어 추측 스키마
export const liarGuessSchema = z.object({
  guess: z.string().min(1, '추측할 단어를 입력해주세요.').max(50, '단어는 50자를 초과할 수 없습니다.'),
});

// 로그인 스키마
export const loginSchema = z.object({
  nickname: z.string().min(2, '닉네임은 2자 이상이어야 합니다.').max(20, '닉네임은 20자를 초과할 수 없습니다.'),
  password: z.string().optional(),
});

// 타입 정의
export type CreateGameFormData = z.infer<typeof createGameSchema>;
export type ChatMessageFormData = z.infer<typeof chatMessageSchema>;
export type VotingFormData = z.infer<typeof votingSchema>;
export type DefenseFormData = z.infer<typeof defenseSchema>;
export type LiarGuessFormData = z.infer<typeof liarGuessSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
