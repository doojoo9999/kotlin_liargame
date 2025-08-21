import {z} from 'zod';

export const createRoomSchema = z.object({
  gameName: z.string().min(2, '방 제목은 2글자 이상이어야 합니다.').max(50, '방 제목은 50자를 넘을 수 없습니다.'),
  gamePassword: z.string().max(20, '비밀번호는 20자를 넘을 수 없습니다.').optional(),
  gameParticipants: z.number().min(3, '최소 3명 이상이어야 합니다.').max(15, '최대 15명까지 가능합니다.'),
});

export type CreateRoomFormInputs = z.infer<typeof createRoomSchema>;
