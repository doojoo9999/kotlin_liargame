import {zodResolver} from '@hookform/resolvers/zod';
import {Button, Stack, TextInput} from '@mantine/core';
import {useForm} from 'react-hook-form';
import {useLoginMutation} from '../hooks/useLoginMutation';
import {type LoginFormInputs, loginSchema} from './schema';

export function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
  });

  const loginMutation = useLoginMutation();

  const onSubmit = (data: LoginFormInputs) => {
    loginMutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Stack>
        <TextInput
          label="닉네임"
          placeholder="사용할 닉네임을 입력하세요"
          required
          error={errors.nickname?.message}
          {...register('nickname')}
        />
        <Button type="submit" loading={loginMutation.isPending} fullWidth>
          입장하기
        </Button>
      </Stack>
    </form>
  );
}
