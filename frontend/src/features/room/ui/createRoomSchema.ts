import {z} from 'zod';

export const createRoomSchema = z.object({
  gameName: z.string().min(2, '방 제목은 2글자 이상이어야 합니다.').max(50, '방 제목은 50자를 넘을 수 없습니다.'),
  gamePassword: z.string().max(20, '비밀번호는 20자를 넘을 수 없습니다.').optional().or(z.literal('')),
  gameParticipants: z.number().min(3, '최소 3명 이상이어야 합니다.').max(15, '최대 15명까지 가능합니다.'),
  gameTotalRounds: z.number().min(1, '최소 1라운드 이상이어야 합니다.').max(10, '최대 10라운드까지 가능합니다.'),
  gameLiarCount: z.number().min(1, '라이어는 최소 1명 이상이어야 합니다.').max(5, '라이어는 최대 5명까지 가능합니다.'),
  gameMode: z.enum(['LIARS_KNOW', 'LIARS_DIFFERENT_WORD']),
  useRandomSubjects: z.boolean(),
  randomSubjectCount: z.number().min(1).max(5).optional(),
  subjectIds: z.array(z.number()).optional(),
});

export type CreateRoomFormInputs = z.infer<typeof createRoomSchema>;
