import {Badge, Box, Group, Paper, ScrollArea, Stack, Text, Title} from '@mantine/core';
import type {ChatMessage} from '../../chat/types';
import type {GameStateResponse} from '../../room/types';

interface HintHistoryProps {
  messages: ChatMessage[];
  gameState: GameStateResponse | null;
}

export function HintHistory({ messages, gameState }: HintHistoryProps) {
  // 디버깅을 위한 로그 추가
  console.log('[HintHistory] DEBUG - All messages:', messages);
  console.log('[HintHistory] DEBUG - Game state:', gameState);

  // HINT 타입 메시지만 필터링하여 힌트로 간주
  const hintMessages = messages.filter((message) => {
    const isHintMessage = message.type === 'HINT' && message.sender;
    console.log('[HintHistory] DEBUG - Message:', message, 'isHint:', isHintMessage);
    return isHintMessage;
  });

  console.log('[HintHistory] DEBUG - Filtered hint messages:', hintMessages);

  // turnOrder가 없을 때 폴백: 힌트를 제공한 플레이어들의 고유 목록 생성
  const fallbackTurnOrder = Array.from(new Set(hintMessages.map(msg => msg.sender))).filter(Boolean);
  const actualTurnOrder = gameState?.turnOrder || fallbackTurnOrder;

  console.log('[HintHistory] DEBUG - Turn order:', gameState?.turnOrder);
  console.log('[HintHistory] DEBUG - Fallback turn order:', fallbackTurnOrder);
  console.log('[HintHistory] DEBUG - Actual turn order:', actualTurnOrder);

  // 턴 순서에 따라 힌트 정리
  const organizedHints = actualTurnOrder.map((playerNickname, index) => {
    // 해당 플레이어가 제공한 힌트 메시지들
    const playerHints = hintMessages.filter(msg => msg.sender === playerNickname);
    console.log('[HintHistory] DEBUG - Player:', playerNickname, 'hints:', playerHints);

    return {
      player: playerNickname,
      turnIndex: index + 1,
      hints: playerHints,
      isCurrentTurn: gameState?.currentTurnIndex === index && gameState?.currentPhase === 'SPEECH'
    };
  });

  console.log('[HintHistory] DEBUG - Organized hints:', organizedHints);

  return (
    <Stack>
      <Title order={3} size="h4">힌트 기록</Title>
      <ScrollArea h={400}>
        <Stack gap="sm">
          {organizedHints.length === 0 ? (
            <Text c="dimmed" ta="center" py="xl">
              아직 힌트가 없습니다.
            </Text>
          ) : (
            organizedHints.map(({ player, turnIndex, hints, isCurrentTurn }) => (
              <Paper
                key={player}
                p="sm"
                withBorder
                style={{
                  backgroundColor: isCurrentTurn ? 'var(--mantine-color-blue-0)' : undefined,
                  borderColor: isCurrentTurn ? 'var(--mantine-color-blue-4)' : undefined
                }}
              >
                <Group justify="space-between" mb="xs">
                  <Text fw={500} c={isCurrentTurn ? 'blue' : undefined}>
                    {player} {isCurrentTurn && '(현재 턴)'}
                  </Text>
                  <Badge
                    size="xs"
                    variant="light"
                    color={isCurrentTurn ? 'blue' : 'gray'}
                  >
                    {turnIndex}번째 턴
                  </Badge>
                </Group>
                {hints.length === 0 ? (
                  <Text c="dimmed" size="sm" fs="italic">
                    {isCurrentTurn ? "힌트를 입력 중..." : "아직 힌트를 제공하지 않았습니다."}
                  </Text>
                ) : (
                  <Stack gap="xs">
                    {hints.map((hint, idx) => (
                      <Box key={idx}>
                        <Text size="sm" fw={500} c="blue">{hint.content}</Text>
                        <Text size="xs" c="dimmed">
                          {new Date(hint.timestamp).toLocaleTimeString()}
                        </Text>
                      </Box>
                    ))}
                  </Stack>
                )}
              </Paper>
            ))
          )}
        </Stack>
      </ScrollArea>
    </Stack>
  );
}
