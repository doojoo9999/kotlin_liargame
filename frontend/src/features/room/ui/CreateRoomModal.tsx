import {zodResolver} from '@hookform/resolvers/zod';
import {Button, Modal, NumberInput, PasswordInput, SimpleGrid, Stack, TextInput} from '@mantine/core';
import {Controller, useForm} from 'react-hook-form';
import {useCreateRoomMutation} from '../hooks/useCreateRoomMutation';
import type {CreateRoomFormInputs} from './createRoomSchema';
import {createRoomSchema} from './createRoomSchema';

interface CreateRoomModalProps {
  opened: boolean;
  onClose: () => void;
}

export function CreateRoomModal({ opened, onClose }: CreateRoomModalProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CreateRoomFormInputs>({
    resolver: zodResolver(createRoomSchema),
    defaultValues: {
      gameParticipants: 5,
      gameTotalRounds: 3,
      gameLiarCount: 1,
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
    <Modal opened={opened} onClose={onClose} title="새로운 방 만들기" centered size="lg">
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
          <SimpleGrid cols={3}>
            <Controller
              name="gameParticipants"
              control={control}
              render={({ field }) => (
                <NumberInput
                  {...field}
                  label="최대 인원"
                  min={3}
                  max={15}
                  required
                  error={errors.gameParticipants?.message}
                />
              )}
            />
            <Controller
              name="gameTotalRounds"
              control={control}
              render={({ field }) => (
                <NumberInput
                  {...field}
                  label="총 라운드"
                  min={1}
                  max={10}
                  required
                  error={errors.gameTotalRounds?.message}
                />
              )}
            />
            <Controller
              name="gameLiarCount"
              control={control}
              render={({ field }) => (
                <NumberInput
                  {...field}
                  label="라이어 수"
                  min={1}
                  max={5}
                  required
                  error={errors.gameLiarCount?.message}
                />
              )}
            />
          </SimpleGrid>
          
          <Button type="submit" loading={createRoomMutation.isPending} fullWidth mt="md">
            방 만들기
          </Button>
        </Stack>
      </form>
    </Modal>
  );
}
