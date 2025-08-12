import React, {useEffect} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {useGame} from '../hooks/useGame';
import {Alert, Badge, Button, Container, Grid, Group, LoadingOverlay, Paper, Stack, Text, Title} from '@mantine/core';
import {IconLogout} from '@tabler/icons-react';

// Import the new components
import PlayerCircle from '../components/game/PlayerCircle';
import ActionPanel from '../components/game/ActionPanel';
import ChatWindow from '../components/domain/ChatWindow'; // Assuming ChatWindow is a separate component

function GameRoomPage() {
  const { gameNumber } = useParams();
  const navigate = useNavigate();
  const game = useGame();

  useEffect(() => {
    // If there's no room data and we're not loading, redirect to lobby
    if (!game.currentRoom && !game.isJoiningRoom) {
        // Attempt to join the room if gameNumber is present
        if (gameNumber) {
            game.joinRoom({ gameNumber });
        } else {
            navigate('/lobby');
        }
    }

    // Setup WebSocket connection and subscriptions
    if (game.currentRoom?.gameNumber) {
      game.connectSocket();
      game.initializeSubscriptions(game.currentRoom.gameNumber);
    }

    // Cleanup on component unmount
    return () => {
      if (game.isSocketConnected) {
        game.disconnectSocket();
      }
      game.resetGameState();
    };
  }, [game.currentRoom?.gameNumber]);

  if (!game.currentRoom) {
    return <LoadingOverlay visible={true} />;
  }

  if (game.joinRoomError) {
    return (
        <Container>
            <Alert color="red" title="Error Joining Room">
                {game.joinRoomError.message}
                <Button onClick={() => navigate('/lobby')} mt="md">Back to Lobby</Button>
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
            <Text size="sm" c="dimmed">Room #{game.currentRoom.gameNumber}</Text>
          </Stack>
          <Group>
            <Badge color={game.isSocketConnected ? 'green' : 'red'} variant="light">
              {game.isSocketConnected ? 'Connected' : 'Disconnected'}
            </Badge>
            <Button 
              leftSection={<IconLogout size={16} />} 
              onClick={() => game.leaveRoom(game.currentRoom.gameNumber)}
              loading={game.isLeavingRoom}
              color="red"
              variant="outline"
            >
              Leave
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
                <Title order={4}>Game Info</Title>
                <Text>Status: <Badge>{game.gameStatus}</Badge></Text>
                <Text>Round: {game.currentRound}</Text>
                <Text>Time: {game.gameTimer}s</Text>
                {game.playerRole && <Text>Role: <Badge color={game.playerRole === 'LIAR' ? 'red' : 'blue'}>{game.playerRole}</Badge></Text>}
                {game.assignedWord && <Text>Word: <Text span fw={700}>{game.assignedWord}</Text></Text>}
                {game.moderatorMessage && <Alert color="grape" title="Moderator">{game.moderatorMessage}</Alert>}
            </Paper>
            <ChatWindow />
          </Stack>
        </Grid.Col>
      </Grid>
    </Container>
  );
}

export default GameRoomPage;
