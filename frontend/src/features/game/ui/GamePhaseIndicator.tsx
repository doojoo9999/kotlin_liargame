import {Badge, Card, Group, Progress, Stack, Text, ThemeIcon} from '@mantine/core';
import {Brain, Clock, MessageCircle, Play, Shield, Trophy, Users, Vote} from 'lucide-react';

type GamePhase =
  | 'WAITING'
  | 'ROLE_ASSIGNMENT'
  | 'SPEECH'
  | 'VOTE'
  | 'DEFENSE'
  | 'FINAL_VOTE'
  | 'LIAR_GUESS'
  | 'GAME_ENDED';

interface GamePhaseIndicatorProps {
  currentPhase: GamePhase;
  timeRemaining?: number;
  maxTime?: number;
  round?: number;
  maxRounds?: number;
}

const phaseConfig = {
  WAITING: {
    label: '대기 중',
    color: 'gray',
    icon: Users,
    description: '게임 시작을 기다리고 있습니다'
  },
  ROLE_ASSIGNMENT: {
    label: '역할 배정',
    color: 'blue',
    icon: Play,
    description: '플레이어들에게 역할을 배정하고 있습니다'
  },
  SPEECH: {
    label: '힌트 단계',
    color: 'cyan',
    icon: MessageCircle,
    description: '플레이어들이 순서대로 힌트를 제공합니다'
  },
  VOTE: {
    label: '1차 투표',
    color: 'orange',
    icon: Vote,
    description: '라이어라고 생각하는 플레이어에게 투표하세요'
  },
  DEFENSE: {
    label: '변론 단계',
    color: 'yellow',
    icon: Shield,
    description: '투표 1위 플레이어가 변론합니다'
  },
  FINAL_VOTE: {
    label: '최종 투표',
    color: 'red',
    icon: Vote,
    description: '최종 투표로 라이어를 결정합니다'
  },
  LIAR_GUESS: {
    label: '라이어 추측',
    color: 'grape',
    icon: Brain,
    description: '라이어가 주제를 추측할 마지막 기회입니다'
  },
  GAME_ENDED: {
    label: '게임 종료',
    color: 'green',
    icon: Trophy,
    description: '게임이 종료되었습니다'
  }
};

export function GamePhaseIndicator({
  currentPhase,
  timeRemaining,
  maxTime,
  round,
  maxRounds
}: GamePhaseIndicatorProps) {
  const config = phaseConfig[currentPhase];
  const IconComponent = config.icon;

  const progressValue = timeRemaining && maxTime
    ? ((maxTime - timeRemaining) / maxTime) * 100
    : 0;

  return (
    <Card withBorder padding="lg" shadow="sm">
      <Stack gap="md">
        <Group justify="space-between">
          <Group gap="sm">
            <ThemeIcon color={config.color} variant="light" size="lg">
              <IconComponent size={20} />
            </ThemeIcon>
            <div>
              <Text fw={600} size="lg">{config.label}</Text>
              <Text size="sm" c="dimmed">{config.description}</Text>
            </div>
          </Group>

          <Badge color={config.color} variant="filled" size="lg">
            {currentPhase}
          </Badge>
        </Group>

        {(round !== undefined && maxRounds !== undefined) && (
          <Group justify="space-between">
            <Text size="sm" c="dimmed">라운드 진행</Text>
            <Badge variant="outline" color="blue">
              {round} / {maxRounds}
            </Badge>
          </Group>
        )}

        {timeRemaining !== undefined && (
          <Stack gap="xs">
            <Group justify="space-between">
              <Group gap="xs">
                <Clock size={16} />
                <Text size="sm" fw={500}>남은 시간</Text>
              </Group>
              <Text
                size="sm"
                fw={600}
                c={timeRemaining <= 10 ? 'red' : timeRemaining <= 30 ? 'orange' : 'blue'}
              >
                {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
              </Text>
            </Group>

            {maxTime && (
              <Progress
                value={progressValue}
                color={timeRemaining <= 10 ? 'red' : timeRemaining <= 30 ? 'orange' : 'blue'}
                size="sm"
                radius="xl"
              />
            )}
          </Stack>
        )}

        {timeRemaining !== undefined && timeRemaining <= 10 && (
          <Text size="sm" c="red" fw={500} ta="center">
            ⚠️ 시간이 얼마 남지 않았습니다!
          </Text>
        )}
      </Stack>
    </Card>
  );
}
