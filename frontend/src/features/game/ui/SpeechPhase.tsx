import {zodResolver} from '@hookform/resolvers/zod';
import {Alert, Button, Group, Paper, Stack, Text, TextInput, Title} from '@mantine/core';
import {Mic} from 'lucide-react';
import {useForm} from 'react-hook-form';
import {z} from 'zod';
import {Timer} from '../../../shared/ui/Timer';
import {useUserStore} from '../../../shared/stores/userStore';
import type {GameStateResponse} from '../../room/types';
import {useSubmitHintMutation} from '../hooks/useSubmitHintMutation';

interface SpeechPhaseProps {
  gameState: GameStateResponse;
}

const hintSchema = z.object({
  hint: z.string().min(1, '힌트를 입력해주세요.').max(200, '힌트는 200자를 넘을 수 없습니다.'),
});
type HintFormInputs = z.infer<typeof hintSchema>;

export function SpeechPhase({ gameState }: SpeechPhaseProps) {
  const currentUserNickname = useUserStore((state) => state.nickname);
  const submitHintMutation = useSubmitHintMutation(gameState.gameNumber);

  // Get the nickname of the player whose turn it is
  const currentPlayerTurnNickname =
    gameState.turnOrder && gameState.currentTurnIndex != null
      ? gameState.turnOrder[gameState.currentTurnIndex]
      : null;

  const isMyTurn = currentUserNickname === currentPlayerTurnNickname;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<HintFormInputs>({
    resolver: zodResolver(hintSchema),
  });

  const onSubmit = (data: HintFormInputs) => {
    submitHintMutation.mutate(
      { gameNumber: gameState.gameNumber, hint: data.hint },
      {
        onSuccess: () => reset(), // Reset form on successful submission
      }
    );
  };

  return (
    <Stack>
      <Paper p="lg" withBorder>
        <Group justify="space-between" mb="md">
          <Title order={3}>발언 단계</Title>
          <Timer endTime={gameState.phaseEndTime} />
        </Group>
        <Text ta="center" size="xl" fw={700} mb="lg">
          {currentPlayerTurnNickname ? `${currentPlayerTurnNickname}님의 차례` : '...'}
        </Text>
        
        <Alert icon={<Mic size={18} />} color={isMyTurn ? 'blue' : 'gray'}>
          {isMyTurn 
            ? "당신의 차례입니다! 제시어와 관련된 힌트를 입력해주세요." 
            : "다른 플레이어가 힌트를 제공하고 있습니다."}
        </Alert>
      </Paper>

      <Paper p="lg" withBorder>
        <Text size="sm" c="dimmed">당신의 제시어</Text>
        <Text size="xl" fw={700}>{gameState.yourWord || '???'}</Text>
      </Paper>

      {isMyTurn && (
        <Paper p="lg" withBorder component="form" onSubmit={handleSubmit(onSubmit)}>
          <Stack>
            <TextInput
              label="나의 힌트"
              placeholder="제시어를 설명하는 힌트를 입력하세요"
              required
              error={errors.hint?.message}
              {...register('hint')}
            />
            <Button type="submit" loading={isSubmitting || submitHintMutation.isPending}>
              힌트 제출
            </Button>
          </Stack>
        </Paper>
      )}
    </Stack>
  );
}
