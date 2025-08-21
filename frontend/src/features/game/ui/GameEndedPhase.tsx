import {Button, List, Paper, Stack, Table, Text, Title} from '@mantine/core';
import {useNavigate} from 'react-router-dom';
import type {GameStateResponse} from '../../room/types';

interface GameEndedPhaseProps {
  gameState: GameStateResponse;
}

export function GameEndedPhase({ gameState }: GameEndedPhaseProps) {
  const navigate = useNavigate();

  const winnerText = gameState.winner === 'CITIZEN' ? '시민' : '라이어';
  const liars = gameState.players.filter(p => p.role === 'LIAR').map(p => p.nickname).join(', ');

  const playerRows = gameState.players.map((player) => (
    <Table.Tr key={player.id}>
      <Table.Td>{player.nickname}</Table.Td>
      <Table.Td>{player.role === 'LIAR' ? '라이어' : '시민'}</Table.Td>
    </Table.Tr>
  ));

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
          <List spacing="xs" size="sm" mb="md">
            <List.Item>
              <Text span fw={500}>시민 제시어: </Text>
              {gameState.citizenSubject}
            </List.Item>
            <List.Item>
              <Text span fw={500}>라이어 제시어: </Text>
              {liarSubject || gameState.citizenSubject}
            </List.Item>
          </List>
          
          <Title order={5} mb="xs">플레이어 역할</Title>
          <Table withTableBorder withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>닉네임</Table.Th>
                <Table.Th>역할</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>{playerRows}</Table.Tbody>
          </Table>
        </Paper>

        <Button onClick={() => navigate('/')} mt="xl" size="md">
          로비로 돌아가기
        </Button>
      </Stack>
    </Paper>
  );
}
