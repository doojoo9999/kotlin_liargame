import {z} from 'zod';

export const loginSchema = z.object({
  nickname: z.string().min(2, '닉네임은 2글자 이상이어야 합니다.'),
});

export type LoginFormInputs = z.infer<typeof loginSchema>;
