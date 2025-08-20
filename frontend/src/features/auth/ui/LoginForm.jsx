import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import {Stack, TextInput} from '@mantine/core';
import {Button} from '@/shared/ui';
import {useLogin} from '@/features/auth/hooks/useLogin';

const loginSchema = z.object({
  nickname: z.string().min(2, 'Nickname must be at least 2 characters long').max(15, 'Nickname must be at most 15 characters long'),
});

export const LoginForm = () => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const loginMutation = useLogin();

  const onSubmit = (data) => {
    loginMutation.mutate(data.nickname);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Stack>
        <TextInput
          label="Nickname"
          placeholder="Enter your nickname"
          error={errors.nickname?.message}
          {...register('nickname')}
        />
        <Button type="submit" loading={loginMutation.isPending}>
          Enter Lobby
        </Button>
      </Stack>
    </form>
  );
};
