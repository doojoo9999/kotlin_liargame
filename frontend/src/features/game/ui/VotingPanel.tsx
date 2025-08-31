import {useState} from 'react';
import {Alert, Avatar, Badge, Button, Card, Group, SimpleGrid, Stack, Text} from '@mantine/core';
import {Clock, Users, Vote} from 'lucide-react';

interface Player {
  id: number;  // React key용
  userId: number;  // 비즈니스 로직용
  nickname: string;
  isHost: boolean;
  isAlive: boolean;
}

interface VotingPanelProps {
  players: Player[];
  currentUserId?: number;  // currentPlayerId -> currentUserId로 변경
  onVote: (targetUserId: number) => void;  // targetPlayerId -> targetUserId로 변경
  votedUserId?: number;  // votedPlayerId -> votedUserId로 변경
  isVotingPhase: boolean;
  timeLeft?: number;
  votes?: Record<number, number>; // userId -> targetUserId
}

export function VotingPanel({
  players,
  currentUserId,  // currentPlayerId -> currentUserId로 변경
  onVote,
  votedUserId,  // votedPlayerId -> votedUserId로 변경
  isVotingPhase,
  timeLeft,
  votes = {}
}: VotingPanelProps) {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);  // selectedPlayerId -> selectedUserId로 변경

  const alivePlayers = players.filter(p => p.isAlive && p.userId !== currentUserId);  // userId 사용
  const voteCount = Object.values(votes).reduce((acc, targetId) => {
    acc[targetId] = (acc[targetId] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  const handleVote = () => {
    if (selectedUserId !== null && !votedUserId) {  // selectedUserId, votedUserId 사용
      onVote(selectedUserId);  // selectedUserId 사용
      setSelectedUserId(null);  // selectedUserId 사용
    }
  };

  if (!isVotingPhase) {
    return (
      <Card withBorder p="md" radius="md" bg="gray.0">
        <Text size="sm" c="dimmed" ta="center">
          투표 단계가 아닙니다
        </Text>
      </Card>
    );
  }

  return (
    <Card withBorder p="md" radius="md" shadow="sm">
      <Stack gap="md">
        <Group justify="space-between">
          <Text size="lg" fw={600} c="red">
            <Vote size={20} style={{ display: 'inline', marginRight: '8px' }} />
            라이어 투표
          </Text>
          {timeLeft !== undefined && (
            <Badge color="orange" leftSection={<Clock size={14} />}>
              {timeLeft}초
            </Badge>
          )}
        </Group>

        {timeLeft !== undefined && timeLeft <= 10 && (
          <Alert color="red" variant="light">
            투표 시간이 얼마 남지 않았습니다!
          </Alert>
        )}

        <Text size="sm" c="dimmed">
          라이어라고 생각하는 플레이어에게 ���표하세요
        </Text>

        <SimpleGrid cols={2} spacing="sm">
          {alivePlayers.map((player) => {
            const isSelected = selectedUserId === player.userId;  // userId 사용
            const hasVoted = votedUserId === player.userId;  // userId 사용
            const voteCountForPlayer = voteCount[player.userId] || 0;  // userId 사용

            return (
              <Card
                key={player.id}  // React key는 player.id 사용
                withBorder
                p="sm"
                radius="sm"
                style={{
                  cursor: votedUserId ? 'default' : 'pointer',  // votedUserId 사용
                  backgroundColor: isSelected
                    ? 'var(--mantine-color-blue-0)'
                    : hasVoted
                    ? 'var(--mantine-color-red-0)'
                    : undefined,
                  borderColor: isSelected
                    ? 'var(--mantine-color-blue-5)'
                    : hasVoted
                    ? 'var(--mantine-color-red-5)'
                    : undefined
                }}
                onClick={() => {
                  if (!votedUserId) {  // votedUserId 사용
                    setSelectedUserId(isSelected ? null : player.userId);  // selectedUserId, userId 사용
                  }
                }}
              >
                <Group justify="space-between" gap="xs">
                  <Group gap="xs">
                    <Avatar size="sm" radius="xl">
                      {player.nickname.charAt(0)}
                    </Avatar>
                    <div>
                      <Text size="sm" fw={500}>
                        {player.nickname}
                      </Text>
                      {player.isHost && (
                        <Badge size="xs" color="yellow">HOST</Badge>
                      )}
                    </div>
                  </Group>

                  {voteCountForPlayer > 0 && (
                    <Badge color="red" size="sm">
                      {voteCountForPlayer}표
                    </Badge>
                  )}
                </Group>
              </Card>
            );
          })}
        </SimpleGrid>

        {votedUserId ? (  // votedUserId 사용
          <Alert color="green" variant="light">
            투표를 완료했습니다! 다른 플레이어들을 기다리고 있습니다.
          </Alert>
        ) : (
          <Button
            onClick={handleVote}
            disabled={selectedUserId === null}  // selectedUserId 사용
            color="red"
            fullWidth
            leftSection={<Vote size={16} />}
          >
            {selectedUserId  // selectedUserId 사용
              ? `${players.find(p => p.userId === selectedUserId)?.nickname}에게 투표`  // userId 사용
              : '플레이어를 선택하세요'}
          </Button>
        )}

        <Group gap="xs">
          <Users size={16} />
          <Text size="xs" c="dimmed">
            투표 참여: {Object.keys(votes).length}/{alivePlayers.length + 1}명
          </Text>
        </Group>
      </Stack>
    </Card>
  );
}
