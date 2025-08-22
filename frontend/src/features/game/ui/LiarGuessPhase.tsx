import {zodResolver} from '@hookform/resolvers/zod';
import {Button, Group, Paper, Stack, Text, TextInput, Title} from '@mantine/core';
import {useForm} from 'react-hook-form';
import {z} from 'zod';
import {Timer} from '../../../shared/ui/Timer';
import {useUserStore} from '../../../shared/stores/userStore';
import type {GameStateResponse} from '../../room/types';
import {useSubmitLiarGuessMutation} from '../hooks/useSubmitLiarGuessMutation';

interface LiarGuessPhaseProps {
  gameState: GameStateResponse;
}

const guessSchema = z.object({
  guess: z.string().min(1, '추측할 단어를 입력해주세요.'),
});
type GuessFormInputs = z.infer<typeof guessSchema>;

export function LiarGuessPhase({ gameState }: LiarGuessPhaseProps) {
  const currentUserNickname = useUserStore((state) => state.nickname);
  const submitGuessMutation = useSubmitLiarGuessMutation(gameState.gameNumber);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<GuessFormInputs>({
    resolver: zodResolver(guessSchema),
  });

  const isLiar = gameState.yourRole === 'LIAR';
  // The person who was accused should be the one guessing.
  const isMyTurnToGuess = gameState.accusedPlayer?.nickname === currentUserNickname;

  const onSubmit = (data: GuessFormInputs) => {
    submitGuessMutation.mutate(data.guess);
  };

  return (
    <Paper p="lg" withBorder>
      <Group justify="space-between" mb="md">
        <Title order={3}>라이어 단어 추측</Title>
        <Timer endTime={gameState.phaseEndTime} />
      </Group>
      <Text ta="center" mb="xl">
        탈락한 라이어는 시민들의 단어를 맞힐 마지막 기회가 주어집니다.
      </Text>
      {isLiar && isMyTurnToGuess ? (
        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack>
            <TextInput
              label="시민들의 단어"
              placeholder="시민들이 본 단어를 입력하세요"
              required
              error={errors.guess?.message}
              {...register('guess')}
            />
            <Button type="submit" loading={isSubmitting || submitGuessMutation.isPending}>
              최종 추측
            </Button>
          </Stack>
        </form>
      ) : (
        <Text ta="center" c="dimmed">
          {gameState.accusedPlayer?.nickname}님이 단어를 추측하고 있습니다...
        </Text>
      )}
    </Paper>
  );
}
