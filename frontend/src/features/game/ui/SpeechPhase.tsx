import {Alert, Group, Paper, Stack, Text, Title} from '@mantine/core';
import {Mic} from 'lucide-react';
import {Timer} from '../../../shared/ui/Timer';
import {useUserStore} from '../../../shared/stores/userStore';
import type {GameStateResponse} from '../../room/types';

interface SpeechPhaseProps {
  gameState: GameStateResponse;
}

export function SpeechPhase({ gameState }: SpeechPhaseProps) {
  const currentUserNickname = useUserStore((state) => state.nickname);

  const currentPlayerTurnNickname =
    gameState.turnOrder && gameState.currentTurnIndex != null
      ? gameState.turnOrder[gameState.currentTurnIndex]
      : null;

  const isMyTurn = currentUserNickname === currentPlayerTurnNickname;

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
            ? "당신의 차례입니다! 채팅창에 제시어와 관련된 힌트를 입력해주세요."
            : "다른 플레이어가 힌트를 제공하고 있습니다."}
        </Alert>
      </Paper>

      <Paper p="lg" withBorder>
        <Text size="sm" c="dimmed">당신의 제시어</Text>
        <Text size="xl" fw={700}>{gameState.yourWord || '???'}</Text>
      </Paper>
    </Stack>
  );
}
