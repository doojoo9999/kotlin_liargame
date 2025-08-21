import {Button, Group, SimpleGrid, Stack, Text} from '@mantine/core';
import {useUserStore} from '../../../shared/stores/userStore';
import type {GameStateResponse} from '../../room/types';
import {useLeaveRoomMutation} from '../hooks/useLeaveRoomMutation';
import {useStartGameMutation} from '../hooks/useStartGameMutation';
import {PlayerList} from './PlayerList';

interface GameLobbyProps {
  gameState: GameStateResponse;
}

export function GameLobby({ gameState }: GameLobbyProps) {
  const currentUserNickname = useUserStore((state) => state.nickname);
  const isOwner = currentUserNickname === gameState.gameOwner;
  const startGameMutation = useStartGameMutation(gameState.gameNumber);
  const leaveRoomMutation = useLeaveRoomMutation();

  const handleStartGame = () => {
    startGameMutation.mutate();
  };

  const handleLeaveRoom = () => {
    leaveRoomMutation.mutate({ gameNumber: gameState.gameNumber });
  };

  return (
    <Stack gap="xl">
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xl">
        <div>
          <Text size="lg" fw={700} mb="md">
            플레이어 ({gameState.players.length} / {gameState.gameParticipants})
          </Text>
          <PlayerList players={gameState.players} gameOwner={gameState.gameOwner} />
        </div>
        <div>
          {/* Game settings info can go here */}
          <Text>게임 모드: {gameState.gameMode}</Text>
          <Text>총 라운드: {gameState.gameTotalRounds}</Text>
          <Text>라이어 수: {gameState.gameLiarCount}</Text>
        </div>
      </SimpleGrid>

      <Group justify="flex-end">
        {isOwner && (
          <Button size="lg" onClick={handleStartGame} loading={startGameMutation.isPending}>
            게임 시작
          </Button>
        )}
        <Button
          variant="outline"
          color="red"
          onClick={handleLeaveRoom}
          loading={leaveRoomMutation.isPending}
        >
          방 나가기
        </Button>
      </Group>
    </Stack>
  );
}
