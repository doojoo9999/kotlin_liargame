import {Avatar, Badge, Card, Group, Progress, Stack, Text} from '@mantine/core';
import {ArrowRight, Clock, User} from 'lucide-react';

interface Player {
  id: number;  // React key용
  userId: number;  // 비즈니스 로직용
  nickname: string;
  isHost: boolean;
  isAlive: boolean;
}

interface TurnIndicatorProps {
  currentPlayer?: Player;
  nextPlayer?: Player;
  allPlayers: Player[];
  currentUserId?: number;  // currentPlayerId -> currentUserId로 변경
  turnTimeLeft?: number;
  totalTurnTime?: number;
  turnOrder?: string[];  // nickname 배열 (백엔드에서 실제로 전송하는 형태)
}

export function TurnIndicator({
  currentPlayer,
  nextPlayer,
  allPlayers,
  currentUserId,
  turnTimeLeft,
  totalTurnTime,
  turnOrder
}: TurnIndicatorProps) {
  const isMyTurn = currentPlayer?.userId === currentUserId;  // userId 사용

  const progressValue = turnTimeLeft && totalTurnTime
    ? ((totalTurnTime - turnTimeLeft) / totalTurnTime) * 100
    : 0;

  const getPlayerPosition = (nickname: string) => {  // nickname 기반으로 수정
    if (!turnOrder) return null;
    return turnOrder.indexOf(nickname) + 1;
  };

  return (
    <Card withBorder p="md" radius="md" shadow="sm" bg={isMyTurn ? 'blue.0' : undefined}>
      <Stack gap="sm">
        <Group justify="space-between" align="center">
          <Text size="lg" fw={600} c={isMyTurn ? 'blue' : 'dark'}>
            <User size={20} style={{ display: 'inline', marginRight: '8px' }} />
            {isMyTurn ? '당신의 턴입니다!' : '현재 턴'}
          </Text>

          {turnTimeLeft !== undefined && (
            <Badge
              color={turnTimeLeft <= 10 ? 'red' : turnTimeLeft <= 20 ? 'orange' : 'blue'}
              variant="filled"
              leftSection={<Clock size={14} />}
            >
              {turnTimeLeft}초
            </Badge>
          )}
        </Group>

        {currentPlayer && (
          <Group gap="md">
            <Avatar size="md" radius="xl">
              {currentPlayer.nickname.charAt(0)}
            </Avatar>
            <Stack gap="xs">
              <Group gap="xs">
                <Text fw={500} size="md">
                  {currentPlayer.nickname}
                </Text>
                {currentPlayer.isHost && (
                  <Badge size="xs" color="yellow">HOST</Badge>
                )}
                {isMyTurn && (
                  <Badge size="xs" color="blue">YOU</Badge>
                )}
              </Group>

              {getPlayerPosition(currentPlayer.nickname) && (
                <Text size="xs" c="dimmed">
                  턴 순서: {getPlayerPosition(currentPlayer.nickname)}번째
                </Text>
              )}
            </Stack>
          </Group>
        )}

        {turnTimeLeft !== undefined && totalTurnTime && (
          <Stack gap="xs">
            <Progress
              value={progressValue}
              color={turnTimeLeft <= 10 ? 'red' : turnTimeLeft <= 20 ? 'orange' : 'blue'}
              size="sm"
              radius="sm"
            />
            {turnTimeLeft <= 10 && (
              <Text size="xs" c="red" ta="center" fw={500}>
                시간이 얼마 남지 않았습니다!
              </Text>
            )}
          </Stack>
        )}

        {nextPlayer && (
          <Group gap="sm" align="center">
            <Text size="sm" c="dimmed">다음 턴:</Text>
            <ArrowRight size={16} color="var(--mantine-color-dimmed)" />
            <Group gap="xs">
              <Avatar size="sm" radius="xl">
                {nextPlayer.nickname.charAt(0)}
              </Avatar>
              <Text size="sm" fw={500}>
                {nextPlayer.nickname}
              </Text>
              {nextPlayer.userId === currentUserId && (
                <Badge size="xs" color="blue" variant="light">YOU</Badge>
              )}
            </Group>
          </Group>
        )}

        {/* 턴 순서 표시 (옵션) */}
        {turnOrder && turnOrder.length > 0 && (
          <Stack gap="xs">
            <Text size="xs" c="dimmed">턴 순서:</Text>
            <Group gap="xs">
              {turnOrder.map((nickname, index) => {  // nickname 기반으로 수정
                const player = allPlayers.find(p => p.nickname === nickname);  // nickname으로 검색
                if (!player) return null;

                const isCurrent = player.userId === currentPlayer?.userId;
                const isMe = player.userId === currentUserId;

                return (
                  <Badge
                    key={player.userId}  // React key를 userId로 변경
                    size="sm"
                    color={isCurrent ? 'blue' : 'gray'}
                    variant={isCurrent ? 'filled' : 'light'}
                  >
                    {index + 1}. {player.nickname}
                    {isMe && ' (나)'}
                  </Badge>
                );
              })}
            </Group>
          </Stack>
        )}
      </Stack>
    </Card>
  );
}
