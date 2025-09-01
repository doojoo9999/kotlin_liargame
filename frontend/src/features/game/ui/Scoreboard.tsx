import {Badge, Group, Paper, Progress, Stack, Text, Title} from '@mantine/core';
import type {GameStateResponse} from '../../room/types';

interface ScoreboardProps {
  gameState: GameStateResponse;
}

export function Scoreboard({ gameState }: ScoreboardProps) {
  // Use real scoreboard data from WebSocket
  const scoreboard = gameState.scoreboard ?? [];
  
  // Sort players by score (descending)
  const sortedPlayers = [...scoreboard].sort((a, b) => b.score - a.score);
  
  // Use target points from game state
  const targetPoints = gameState.targetPoints ?? 10;
  
  // Find the highest score to calculate progress
  const highestScore = sortedPlayers[0]?.score ?? 0;
  const progress = targetPoints > 0 ? Math.min((highestScore / targetPoints) * 100, 100) : 0;

  

  return (
    <Paper p="md" withBorder>
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Title order={4}>점수판</Title>
          <Text size="sm" c="dimmed">
            목표 점수: {targetPoints}점
          </Text>
        </Group>
        
        <Progress 
          value={progress} 
          size="lg" 
          color={progress >= 100 ? 'green' : 'blue'}
        />
        <Text size="xs" c="dimmed" ta="center">
          최고 점수: {highestScore}/{targetPoints}
        </Text>

        <Stack gap="xs">
          {sortedPlayers.map((player, index) => (
            <Paper key={`scoreboard-${player.userId}`} p="sm" withBorder variant="light">
              <Group justify="space-between" align="center">
                <Group align="center" gap="sm">
                  <Text fw={index === 0 ? 700 : 500} size="sm">
                    #{index + 1} {player.nickname}
                  </Text>
                  
                  {!player.isAlive && (
                    <Badge size="xs" color="gray" variant="outline">
                      탈락
                    </Badge>
                  )}
                </Group>
                
                <Group align="center" gap="sm">
                  <Text fw={700} size="lg" c={index === 0 ? 'blue' : undefined}>
                    {player.score ?? 0}점
                  </Text>
                  {(player.score ?? 0) >= targetPoints && (
                    <Badge color="green" variant="filled" size="sm">
                      승리!
                    </Badge>
                  )}
                </Group>
              </Group>
            </Paper>
          ))}
        </Stack>
        
        {sortedPlayers.length === 0 && (
          <Text ta="center" c="dimmed" size="sm">
            점수 정보를 불러오는 중...
          </Text>
        )}
      </Stack>
    </Paper>
  );
}