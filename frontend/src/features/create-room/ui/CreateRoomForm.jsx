import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import {NumberInput, PasswordInput, Select, Stack, TextInput} from '@mantine/core';
import {Button} from '@/shared/ui';
import {useCreateRoom} from '@/features/create-room/hooks/useCreateRoom';

const createRoomSchema = z.object({
  roomName: z.string().min(2, 'Room name must be at least 2 characters').max(20, 'Room name must be at most 20 characters'),
  password: z.string().max(15, 'Password must be at most 15 characters').optional(),
  maxPlayers: z.number().min(3, 'Minimum 3 players').max(10, 'Maximum 10 players'),
  rounds: z.number().min(1, 'Minimum 1 round').max(5, 'Maximum 5 rounds'),
  subject: z.string().nonempty('Please select a subject'),
});

export const CreateRoomForm = ({ subjects = [], onClose }) => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(createRoomSchema),
    defaultValues: {
      maxPlayers: 5,
      rounds: 3,
    }
  });

  const createRoomMutation = useCreateRoom({
    onSuccess: () => {
      if (onClose) onClose();
    }
  });

  const onSubmit = (data) => {
    createRoomMutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Stack>
        <TextInput label="Room Name" error={errors.roomName?.message} {...register('roomName')} />
        <PasswordInput label="Password (Optional)" error={errors.password?.message} {...register('password')} />
        <NumberInput label="Max Players" min={3} max={10} error={errors.maxPlayers?.message} {...register('maxPlayers', { valueAsNumber: true })} />
        <NumberInput label="Rounds" min={1} max={5} error={errors.rounds?.message} {...register('rounds', { valueAsNumber: true })} />
        <Select
          label="Subject"
          data={subjects}
          placeholder="Select a subject"
          error={errors.subject?.message}
          {...register('subject')}
        />
        <Button type="submit" loading={createRoomMutation.isPending}>
          Create Room
        </Button>
      </Stack>
    </form>
  );
};
