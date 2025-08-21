import {zodResolver} from '@hookform/resolvers/zod';
import {Button, Modal, NumberInput, PasswordInput, Stack, TextInput} from '@mantine/core';
import {useForm} from 'react-hook-form';
import {useCreateRoomMutation} from '../hooks/useCreateRoomMutation';
import {CreateRoomFormInputs, createRoomSchema} from './createRoomSchema';

interface CreateRoomModalProps {
  opened: boolean;
  onClose: () => void;
}

export function CreateRoomModal({ opened, onClose }: CreateRoomModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateRoomFormInputs>({
    resolver: zodResolver(createRoomSchema),
    defaultValues: {
      gameParticipants: 5,
    },
  });

  const createRoomMutation = useCreateRoomMutation();

  const onSubmit = (data: CreateRoomFormInputs) => {
    createRoomMutation.mutate(data, {
      onSuccess: () => {
        onClose(); // Close modal only on success
      },
    });
  };

  return (
    <Modal opened={opened} onClose={onClose} title="새로운 방 만들기" centered>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack>
          <TextInput
            label="방 제목"
            placeholder="방 제목을 입력하세요"
            required
            error={errors.gameName?.message}
            {...register('gameName')}
          />
          <PasswordInput
            label="비밀번호 (선택)"
            placeholder="비공개 방으로 만들려면 입력하세요"
            error={errors.gamePassword?.message}
            {...register('gamePassword')}
          />
          <NumberInput
            label="최대 인원"
            min={3}
            max={15}
            required
            error={errors.gameParticipants?.message}
            {...register('gameParticipants', { valueAsNumber: true })}
          />
          <Button type="submit" loading={createRoomMutation.isPending} fullWidth mt="md">
            방 만들기
          </Button>
        </Stack>
      </form>
    </Modal>
  );
}
