import React, {useEffect} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {useGame} from '../hooks/useGame';
import {Alert, Badge, Button, Container, Grid, Group, LoadingOverlay, Paper, Stack, Text, Title} from '@mantine/core';
import {IconLogout} from '@tabler/icons-react';

import PlayerCircle from '../components/game/PlayerCircle';
import ActionPanel from '../components/game/ActionPanel';
import ChatWindow from '../components/domain/ChatWindow';

function GameRoomPage() {
  const { gameNumber } = useParams();
  const navigate = useNavigate();
  const game = useGame();

  useEffect(() => {
    if (!game.currentRoom && !game.isJoiningRoom) {
        if (gameNumber) {
            game.joinRoom({ gameNumber: Number(gameNumber) });
        } else {
            navigate('/lobby');
        }
    }

    if (game.currentRoom?.gameNumber) {
      (async () => {
        try {
          await game.connectSocket();
          game.initializeSubscriptions(game.currentRoom.gameNumber);
        } catch (e) {
          console.error('[GameRoomPage] Socket connect failed', e);
        }
      })();
    }

    return () => {
      if (game.isSocketConnected) {
        game.disconnectSocket();
      }
    };
  }, [game.currentRoom?.gameNumber]);

  if (!game.currentRoom) {
    return <LoadingOverlay visible={true} />;
  }

  if (game.joinRoomError) {
    return (
        <Container>
            <Alert color="red" title="방 입장 오류">
                {game.joinRoomError.message}
                <Button onClick={() => navigate('/lobby')} mt="md">로비로 돌아가기</Button>
            </Alert>
        </Container>
    );
  }

  return (
    <Container fluid p="md" style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Paper p="sm" shadow="md" withBorder>
        <Group justify="space-between">
          <Stack gap={0}>
            <Title order={3}>{game.currentRoom.title}</Title>
            <Text size="sm" c="dimmed">방 번호 #{game.currentRoom.gameNumber}</Text>
          </Stack>
          <Group>
            <Badge color={game.isSocketConnected ? 'green' : 'red'} variant="light">
              {game.isSocketConnected ? '연결됨' : '연결 끊김'}
            </Badge>
            <Button 
              leftSection={<IconLogout size={16} />} 
              onClick={() => game.leaveRoom(game.currentRoom.gameNumber)}
              loading={game.isLeavingRoom}
              color="red"
              variant="outline"
            >
              나가기
            </Button>
          </Group>
        </Group>
      </Paper>

      <Grid grow mt="md" style={{ flex: 1 }}>
        <Grid.Col span={8}>
          <Stack style={{ height: '100%' }}>
            <Paper withBorder shadow="sm" p="md" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PlayerCircle players={game.roomPlayers} currentTurnPlayerId={game.currentTurnPlayerId} />
            </Paper>
            <ActionPanel />
          </Stack>
        </Grid.Col>
        <Grid.Col span={4}>
          <Stack style={{ height: '100%' }}>
            <Paper withBorder shadow="sm" p="md">
                <Title order={4}>게임 정보</Title>
                <Text>상태: <Badge>{game.gameStatus}</Badge></Text>
                <Text>라운드: {game.currentRound}</Text>
                <Text>시간: {game.gameTimer}초</Text>
                {game.playerRole && <Text>내 역할: <Badge color={game.playerRole === 'LIAR' ? 'red' : 'blue'}>{game.playerRole}</Badge></Text>}
                {game.assignedWord && <Text>제시어: <Text span fw={700}>{game.assignedWord}</Text></Text>}
            </Paper>
            {game.moderatorMessage && <Alert color="grape" title="사회자" mt="md">{game.moderatorMessage}</Alert>}
            <ChatWindow />
          </Stack>
        </Grid.Col>
      </Grid>
    </Container>
  );
}

export default GameRoomPage;
