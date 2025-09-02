import {Button, Group, Paper, Stack, Text, Title} from '@mantine/core';
import {Timer} from '../../../shared/ui/Timer';
import {useUserStore} from '../../../shared/stores/userStore';
import type {GameStateResponse, Player} from '../../room/types';
import {useSubmitVoteMutation} from '../hooks/useSubmitVoteMutation';

interface VotePhaseProps {
  gameState: GameStateResponse;
}

export function VotePhase({ gameState }: VotePhaseProps) {
  const currentUserNickname = useUserStore((state) => state.nickname);
  const submitVoteMutation = useSubmitVoteMutation(gameState.gameNumber);

  // Players who are not eliminated and are not the current user
  const votablePlayers = gameState.players.filter(
    (p) => !p.isEliminated && p.nickname !== currentUserNickname
  );

  const handleVote = (targetPlayer: Player) => {
    submitVoteMutation.mutate({
      gameNumber: gameState.gameNumber,
      targetUserId: targetPlayer.userId,  // targetPlayer.id -> targetPlayer.userId로 변경
    });
  };

  const currentUser = gameState.players.find(p => p.nickname === currentUserNickname);
  const hasVoted = currentUser?.hasVoted || false;

  return (
    <Paper p="lg" withBorder>
      <Group justify="space-between" mb="md">
        <Title order={3}>투표 단계</Title>
        <Timer endTime={gameState.phaseEndTime} />
      </Group>
      <Text ta="center" mb="xl">
        {hasVoted
          ? '다른 플레이어들이 투표하기를 기다리고 있습니다.'
          : '라이어로 의심되는 플레이어에게 투표하세요.'}
      </Text>
      <Stack>
        {votablePlayers.map((player) => (
          <Button
            key={player.userId}
            variant="outline"
            size="lg"
            onClick={() => handleVote(player)}
            loading={submitVoteMutation.isPending}
            disabled={hasVoted}
          >
            {player.nickname}
          </Button>
        ))}
      </Stack>
    </Paper>
  );
}
