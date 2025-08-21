import {Button, Group, Paper, Text, Title} from '@mantine/core';
import {Timer} from '../../../shared/ui/Timer';
import type {GameStateResponse} from '../../room/types';
import {useSubmitFinalVoteMutation} from '../hooks/useSubmitFinalVoteMutation';

interface FinalVotePhaseProps {
  gameState: GameStateResponse;
}

export function FinalVotePhase({ gameState }: FinalVotePhaseProps) {
  const submitFinalVoteMutation = useSubmitFinalVoteMutation(gameState.gameNumber);
  const accusedPlayerNickname = gameState.accusedPlayer?.nickname;

  const handleVote = (isYes: boolean) => {
    submitFinalVoteMutation.mutate(isYes);
  };

  return (
    <Paper p="lg" withBorder>
      <Group justify="space-between" mb="md">
        <Title order={3}>최종 투표</Title>
        <Timer endTime={gameState.phaseEndTime} />
      </Group>
      <Text ta="center" mb="xl">
        {accusedPlayerNickname}님을 라이어로 지목하여 탈락시키겠습니까?
      </Text>
      <Group justify="center">
        <Button
          color="red"
          size="lg"
          loading={submitFinalVoteMutation.isPending}
          onClick={() => handleVote(true)}
        >
          찬성 (탈락)
        </Button>
        <Button
          color="blue"
          size="lg"
          loading={submitFinalVoteMutation.isPending}
          onClick={() => handleVote(false)}
        >
          반대 (생존)
        </Button>
      </Group>
    </Paper>
  );
}
