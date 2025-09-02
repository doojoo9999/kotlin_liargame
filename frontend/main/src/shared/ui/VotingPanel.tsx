import {Badge, Button, Card, Grid, Group, Progress, Stack, Text} from '@mantine/core';
import {IconClock, IconTarget} from '@tabler/icons-react';

interface VoteOption {
  playerId: number;
  playerName: string;
  voteCount: number;
  isCurrentUser?: boolean;
  hasVoted?: boolean;
}

interface VotingPanelProps {
  title: string;
  description?: string;
  options: VoteOption[];
  timeLeft?: number;
  maxTime?: number;
  onVote: (playerId: number) => void;
  userVote?: number;
  disabled?: boolean;
  type: 'liar-vote' | 'final-vote' | 'elimination-vote';
  showResults?: boolean;
}

export function VotingPanel({
  title,
  description,
  options,
  timeLeft,
  maxTime,
  onVote,
  userVote,
  disabled = false,
  type,
  showResults = false
}: VotingPanelProps) {
  const getTypeColor = () => {
    switch (type) {
      case 'liar-vote': return 'orange';
      case 'final-vote': return 'red';
      case 'elimination-vote': return 'purple';
      default: return 'blue';
    }
  };

  const totalVotes = options.reduce((sum, option) => sum + option.voteCount, 0);

  return (
    <Card padding="lg" radius="md" withBorder shadow="sm">
      <Stack gap="md">
        {/* 투표 헤더 */}
        <Group justify="space-between">
          <div>
            <Text size="lg" fw={700}>{title}</Text>
            {description && (
              <Text size="sm" c="dimmed">{description}</Text>
            )}
          </div>
          <Badge color={getTypeColor()} variant="light" size="lg">
            투표 진행중
          </Badge>
        </Group>

        {/* 시간 표시 */}
        {timeLeft !== undefined && maxTime && (
          <div>
            <Group justify="space-between" mb="xs">
              <Text size="sm" c="dimmed">남은 시간</Text>
              <Group gap="xs">
                <IconClock size={14} />
                <Text size="sm" fw={600} c={timeLeft < 10 ? 'red' : 'dark'}>
                  {timeLeft}초
                </Text>
              </Group>
            </Group>
            <Progress
              value={(timeLeft / maxTime) * 100}
              color={timeLeft < 10 ? 'red' : timeLeft < 30 ? 'yellow' : getTypeColor()}
              size="sm"
              radius="xl"
              animated={timeLeft < 10}
            />
          </div>
        )}

        {/* 투표 옵션들 */}
        <Grid>
          {options.map((option) => (
            <Grid.Col key={option.playerId} span={{ base: 12, sm: 6 }}>
              <Card
                padding="md"
                radius="md"
                withBorder
                style={{
                  cursor: disabled || option.isCurrentUser ? 'not-allowed' : 'pointer',
                  border: userVote === option.playerId ? `2px solid var(--mantine-color-${getTypeColor()}-5)` : undefined,
                  opacity: option.isCurrentUser ? 0.5 : 1,
                }}
                onClick={() => {
                  if (!disabled && !option.isCurrentUser) {
                    onVote(option.playerId);
                  }
                }}
              >
                <Stack gap="sm">
                  <Group justify="space-between">
                    <Text fw={600} size="md">
                      {option.playerName}
                      {option.isCurrentUser && (
                        <Text component="span" size="xs" c="dimmed" ml="xs">
                          (나)
                        </Text>
                      )}
                    </Text>
                    {userVote === option.playerId && (
                      <Badge color={getTypeColor()} size="sm">
                        투표함
                      </Badge>
                    )}
                  </Group>

                  {showResults && (
                    <div>
                      <Group justify="space-between" mb="xs">
                        <Text size="sm" c="dimmed">득표수</Text>
                        <Text size="sm" fw={600}>
                          {option.voteCount}표 ({totalVotes > 0 ? Math.round((option.voteCount / totalVotes) * 100) : 0}%)
                        </Text>
                      </Group>
                      <Progress
                        value={totalVotes > 0 ? (option.voteCount / totalVotes) * 100 : 0}
                        color={getTypeColor()}
                        size="sm"
                        radius="xl"
                      />
                    </div>
                  )}

                  {!disabled && !option.isCurrentUser && (
                    <Button
                      size="sm"
                      variant={userVote === option.playerId ? "filled" : "light"}
                      color={getTypeColor()}
                      leftSection={<IconTarget size={14} />}
                      onClick={(e) => {
                        e.stopPropagation();
                        onVote(option.playerId);
                      }}
                    >
                      {userVote === option.playerId ? '투표 취소' : '투표하기'}
                    </Button>
                  )}
                </Stack>
              </Card>
            </Grid.Col>
          ))}
        </Grid>

        {/* 투표 현황 요약 */}
        <Group justify="center">
          <Text size="sm" c="dimmed">
            총 {totalVotes}표 투표됨
          </Text>
        </Group>
      </Stack>
    </Card>
  );
}
