import {Group, Paper, Text, Title} from '@mantine/core';
import {Timer} from '../../../shared/ui/Timer';
import type {GameStateResponse} from '../../room/types';

interface DefensePhaseProps {
  gameState: GameStateResponse;
}

export function DefensePhase({ gameState }: DefensePhaseProps) {
  const accusedPlayerNickname = gameState.accusedPlayer?.nickname;

  return (
    <Paper p="lg" withBorder>
      <Group justify="space-between" mb="md">
        <Title order={3}>변론 시간</Title>
        <Timer endTime={gameState.phaseEndTime} />
      </Group>
      {accusedPlayerNickname ? (
        <Text ta="center" size="xl">
          {accusedPlayerNickname}님이 라이어가 아님을 변론하고 있습니다.
        </Text>
      ) : (
        <Text ta="center" size="xl" c="dimmed">
          피의자 정보를 기다리는 중...
        </Text>
      )}
    </Paper>
  );
}
