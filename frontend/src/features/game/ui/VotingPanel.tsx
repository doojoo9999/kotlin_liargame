import {useState} from 'react';
import {Alert, Avatar, Badge, Button, Card, Group, SimpleGrid, Stack, Text} from '@mantine/core';
import {CheckCircle, Clock, Users, Vote} from 'lucide-react';

interface Player {
  id: string;
  nickname: string;
  isAlive: boolean;
}

interface VotingPanelProps {
  players: Player[];
  onVote: (playerId: string) => void;
  votedPlayerId?: string;
  isVotingPhase: boolean;
  timeRemaining?: number;
  voteCounts?: Record<string, number>;
  isDisabled?: boolean;
}

export function VotingPanel({
  players,
  onVote,
  votedPlayerId,
  isVotingPhase,
  timeRemaining,
  voteCounts = {},
  isDisabled = false
}: VotingPanelProps) {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(votedPlayerId || null);

  const handleVote = (playerId: string) => {
    if (isDisabled || !isVotingPhase) return;

    setSelectedPlayerId(playerId);
    onVote(playerId);
  };

  const alivePlayers = players.filter(player => player.isAlive);

  if (!isVotingPhase) {
    return (
      <Card withBorder padding="md" style={{ backgroundColor: '#f8f9fa' }}>
        <Group gap="sm">
          <Users size={20} color="#868e96" />
          <Text c="dimmed">투표 단계가 아닙니다.</Text>
        </Group>
      </Card>
    );
  }

  return (
    <Card withBorder padding="lg" shadow="sm">
      <Stack gap="md">
        <Group justify="space-between">
          <Group gap="sm">
            <Vote size={20} />
            <Text fw={600} size="lg">라이어 투표</Text>
          </Group>
          {timeRemaining && (
            <Group gap="xs">
              <Clock size={16} />
              <Text size="sm" c={timeRemaining <= 10 ? 'red' : 'blue'}>
                {timeRemaining}초
              </Text>
            </Group>
          )}
        </Group>

        <Text size="sm" c="dimmed">
          라이어라고 생각하는 플레이어를 선택하세요:
        </Text>

        {timeRemaining && timeRemaining <= 10 && (
          <Alert color="orange" variant="light">
            투표 시간이 얼마 남지 않았습니다!
          </Alert>
        )}

        <SimpleGrid cols={2} spacing="sm">
          {alivePlayers.map((player) => {
            const isSelected = selectedPlayerId === player.id;
            const voteCount = voteCounts[player.id] || 0;

            return (
              <Button
                key={player.id}
                variant={isSelected ? 'filled' : 'outline'}
                color={isSelected ? 'blue' : 'gray'}
                size="md"
                onClick={() => handleVote(player.id)}
                disabled={isDisabled}
                style={{
                  height: 'auto',
                  padding: '12px',
                }}
              >
                <Stack gap="xs" align="center">
                  <Group gap="xs">
                    <Avatar size="sm" color="blue">
                      {player.nickname.charAt(0)}
                    </Avatar>
                    <Text size="sm" fw={500}>
                      {player.nickname}
                    </Text>
                    {isSelected && (
                      <CheckCircle size={16} />
                    )}
                  </Group>

                  {voteCount > 0 && (
                    <Badge size="xs" color="red" variant="filled">
                      {voteCount}표
                    </Badge>
                  )}
                </Stack>
              </Button>
            );
          })}
        </SimpleGrid>

        {selectedPlayerId && (
          <Alert color="blue" variant="light">
            <Text size="sm">
              {players.find(p => p.id === selectedPlayerId)?.nickname}님을 라이어로 선택했습니다.
            </Text>
          </Alert>
        )}

        <Text size="xs" c="dimmed" ta="center">
          선택한 후에는 변경할 수 없습니다. 신중하게 선택하세요.
        </Text>
      </Stack>
    </Card>
  );
}
