import {Badge, Card, Group, Progress, Stack, Text} from '@mantine/core';
import {Clock, Gavel, MessageCircle, Play, Shield, Target, Trophy, Users, Vote} from 'lucide-react';
import type {GameStateResponse} from '../../room/types';

type GamePhase = GameStateResponse['currentPhase'];

interface GamePhaseIndicatorProps {
  currentPhase: GamePhase;
  timeLeft?: number;
  totalTime?: number;
  round?: number;
  totalRounds?: number;
}

const phaseConfig: Record<GamePhase, {
  label: string;
  color: string;
  icon: React.ComponentType<{size?: number; color?: string}>;
  description: string;
}> = {
  WAITING_FOR_PLAYERS: {
    label: '플레이어 대기',
    color: 'gray',
    icon: Users,
    description: '플레이어들이 입장하기를 기다리고 있습니다'
  },
  SPEECH: {
    label: '힌트 단계',
    color: 'blue',
    icon: MessageCircle,
    description: '각 플레이어가 힌트를 제공하는 단계입니다'
  },
  VOTING_FOR_LIAR: {
    label: '라이어 지목 투표',
    color: 'red',
    icon: Vote,
    description: '라이어라고 생각하는 플레이어에게 투표하세요'
  },
  DEFENDING: {
    label: '변론 단계',
    color: 'yellow',
    icon: Shield,
    description: '지목된 플레이어가 변론하는 단계입니다'
  },
  VOTING_FOR_SURVIVAL: {
    label: '최종 투표',
    color: 'orange',
    icon: Gavel,
    description: '지목된 플레이어의 생존 여부를 결정하는 투표입니다'
  },
  GUESSING_WORD: {
    label: '라이어 추측 단계',
    color: 'purple',
    icon: Target,
    description: '라이어가 주제를 추측하는 단계입니다'
  },
  GAME_OVER: {
    label: '게임 종료',
    color: 'green',
    icon: Trophy,
    description: '게임이 종료되었습니다'
  }
};

export function GamePhaseIndicator({
  currentPhase,
  timeLeft,
  totalTime,
  round,
  totalRounds
}: GamePhaseIndicatorProps) {
  const config = phaseConfig[currentPhase];
  const Icon = config.icon;

  const progressValue = timeLeft && totalTime
    ? ((totalTime - timeLeft) / totalTime) * 100
    : 0;

  return (
    <Card withBorder p="md" radius="md" shadow="sm">
      <Stack gap="sm">
        <Group justify="space-between" align="center">
          <Group gap="sm">
            <Icon size={20} color={`var(--mantine-color-${config.color}-6)`} />
            <Text size="lg" fw={600} c={config.color}>
              {config.label}
            </Text>
          </Group>

          {round && totalRounds && (
            <Badge color={config.color} variant="light">
              Round {round}/{totalRounds}
            </Badge>
          )}
        </Group>

        <Text size="sm" c="dimmed">
          {config.description}
        </Text>

        {timeLeft !== undefined && (
          <Stack gap="xs">
            <Group justify="space-between">
              <Group gap="xs">
                <Clock size={16} />
                <Text size="sm" fw={500}>
                  남은 시간
                </Text>
              </Group>
              <Badge
                color={timeLeft <= 10 ? 'red' : timeLeft <= 30 ? 'orange' : config.color}
                variant="filled"
              >
                {timeLeft}초
              </Badge>
            </Group>

            {totalTime && (
              <Progress
                value={progressValue}
                color={timeLeft <= 10 ? 'red' : timeLeft <= 30 ? 'orange' : config.color}
                size="sm"
                radius="sm"
              />
            )}
          </Stack>
        )}

        {currentPhase === 'WAITING_FOR_PLAYERS' && (
          <Group gap="xs">
            <Play size={16} />
            <Text size="xs" c="dimmed">
              호스트가 게임을 시작할 때까지 기다려주세요
            </Text>
          </Group>
        )}
      </Stack>
    </Card>
  );
}
