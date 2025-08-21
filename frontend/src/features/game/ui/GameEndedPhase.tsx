import {Button, List, Paper, Stack, Text, Title} from '@mantine/core';
import {useNavigate} from 'react-router-dom';
import type {GameStateResponse} from '../../room/types';

interface GameEndedPhaseProps {
  gameState: GameStateResponse;
}

export function GameEndedPhase({ gameState }: GameEndedPhaseProps) {
  const navigate = useNavigate();

  const winnerText = gameState.winner === 'CITIZEN' ? '시민' : '라이어';
  const liars = gameState.players.filter(p => p.role === 'LIAR').map(p => p.nickname).join(', ');

  return (
    <Paper p="xl" withBorder>
      <Stack align="center" gap="lg">
        <Title order={2}>게임 종료</Title>
        
        <Stack align="center" gap="xs">
          <Text size="xl" fw={700}>
            {winnerText}의 승리!
          </Text>
          <Text c="dimmed">{gameState.reason || '게임이 정상적으로 종료되었습니다.'}</Text>
        </Stack>

        <Paper withBorder p="md" w="100%">
          <Title order={4} mb="sm">최종 결과</Title>
          <List spacing="xs" size="sm">
            <List.Item>
              <Text span fw={500}>시민 제시어: </Text>
              {gameState.citizenSubject}
            </List.Item>
            <List.Item>
              <Text span fw={500}>라이어 제시어: </Text>
              {gameState.liarSubject || gameState.citizenSubject}
            </List.Item>
            <List.Item>
              <Text span fw={500}>라이어: </Text>
              {liars || '없음'}
            </List.Item>
          </List>
        </Paper>

        <Button onClick={() => navigate('/')} mt="xl" size="md">
          로비로 돌아가기
        </Button>
      </Stack>
    </Paper>
  );
}
