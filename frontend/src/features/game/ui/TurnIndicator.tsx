import {Alert, Avatar, Badge, Card, Group, Stack, Text, ThemeIcon} from '@mantine/core';
import {ArrowRight, Clock, Star, User, Users} from 'lucide-react';

interface Player {
  id: string;
  nickname: string;
  isAlive: boolean;
  isReady?: boolean;
}

interface TurnIndicatorProps {
  currentPlayer: Player | null;
  nextPlayer?: Player | null;
  allPlayers: Player[];
  turnNumber?: number;
  totalTurns?: number;
  timeRemaining?: number;
  isMyTurn?: boolean;
}

export function TurnIndicator({
  currentPlayer,
  nextPlayer,
  allPlayers,
  turnNumber,
  totalTurns,
  timeRemaining,
  isMyTurn = false
}: TurnIndicatorProps) {
  const alivePlayers = allPlayers.filter(player => player.isAlive);

  if (!currentPlayer) {
    return (
      <Card withBorder padding="md" style={{ backgroundColor: '#f8f9fa' }}>
        <Group gap="sm">
          <Users size={20} color="#868e96" />
          <Text c="dimmed">턴이 시작되지 않았습니다.</Text>
        </Group>
      </Card>
    );
  }

  return (
    <Card
      withBorder
      padding="lg"
      shadow="sm"
      style={{
        borderColor: isMyTurn ? '#51cf66' : '#e9ecef',
        backgroundColor: isMyTurn ? '#f3f9f3' : '#ffffff'
      }}
    >
      <Stack gap="md">
        {/* 현재 턴 플레이어 */}
        <Group justify="space-between">
          <Group gap="md">
            <ThemeIcon
              color={isMyTurn ? 'green' : 'blue'}
              variant="light"
              size="lg"
            >
              <User size={20} />
            </ThemeIcon>

            <div>
              <Group gap="xs">
                <Text fw={600} size="lg">
                  {currentPlayer.nickname}
                </Text>
                {isMyTurn && (
                  <Badge color="green" variant="filled" size="sm">
                    내 턴
                  </Badge>
                )}
              </Group>
              <Text size="sm" c="dimmed">
                {isMyTurn ? '당신의 차례입니다!' : '현재 턴'}
              </Text>
            </div>
          </Group>

          <Avatar
            size="lg"
            color={isMyTurn ? 'green' : 'blue'}
            variant="filled"
          >
            {currentPlayer.nickname.charAt(0)}
          </Avatar>
        </Group>

        {/* 턴 진행 정보 */}
        {(turnNumber !== undefined && totalTurns !== undefined) && (
          <Group justify="space-between">
            <Text size="sm" c="dimmed">턴 진행</Text>
            <Badge variant="outline" color="blue">
              {turnNumber} / {totalTurns}
            </Badge>
          </Group>
        )}

        {/* 시간 정보 */}
        {timeRemaining !== undefined && (
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
              {timeRemaining}초
            </Text>
          </Group>
        )}

        {/* 다음 플레이어 */}
        {nextPlayer && (
          <Group gap="sm" style={{ opacity: 0.7 }}>
            <ArrowRight size={16} color="#868e96" />
            <Text size="sm" c="dimmed">다음:</Text>
            <Avatar size="sm" color="gray">
              {nextPlayer.nickname.charAt(0)}
            </Avatar>
            <Text size="sm" c="dimmed">{nextPlayer.nickname}</Text>
          </Group>
        )}

        {/* 내 턴 알림 */}
        {isMyTurn && (
          <Alert color="green" variant="light">
            <Group gap="xs">
              <Star size={16} />
              <Text size="sm" fw={500}>
                지금 당신의 차례입니다! 행동을 취해주세요.
              </Text>
            </Group>
          </Alert>
        )}

        {/* 시간 경고 */}
        {timeRemaining !== undefined && timeRemaining <= 10 && (
          <Alert color="red" variant="light">
            <Text size="sm" fw={500}>
              ⚠️ {currentPlayer.nickname}님의 시간이 얼마 남지 않았습니다!
            </Text>
          </Alert>
        )}

        {/* 플레이어 순서 표시 */}
        <Group gap="xs" justify="center">
          {alivePlayers.map((player) => (
            <Avatar
              key={player.id}
              size="sm"
              color={player.id === currentPlayer.id ? 'blue' : 'gray'}
              variant={player.id === currentPlayer.id ? 'filled' : 'outline'}
              style={{
                opacity: player.id === currentPlayer.id ? 1 : 0.5,
                transform: player.id === currentPlayer.id ? 'scale(1.1)' : 'scale(1)'
              }}
            >
              {player.nickname.charAt(0)}
            </Avatar>
          ))}
        </Group>
      </Stack>
    </Card>
  );
}
