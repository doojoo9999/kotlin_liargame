import {Button, Group, SimpleGrid, Stack, Text} from '@mantine/core';
import {useUserStore} from '../../../shared/stores/userStore';
import type {GameStateResponse} from '../../room/types';
import {useLeaveRoomMutation} from '../hooks/useLeaveRoomMutation';
import {useStartGameMutation} from '../hooks/useStartGameMutation';
import {PlayerList} from './PlayerList';
import {RoomStartCountdown} from './RoomStartCountdown';

interface GameLobbyProps {
  gameState: GameStateResponse;
}

export function GameLobby({ gameState }: GameLobbyProps) {
  const currentUserNickname = useUserStore((state) => state.nickname);
  const isOwner = currentUserNickname === gameState.gameOwner;
  const isRoomFull = gameState.players.length >= gameState.gameParticipants;
  const canStartGame = isOwner && gameState.players.length >= 2 && gameState.players.length <= gameState.gameParticipants;
  const startGameMutation = useStartGameMutation(gameState.gameNumber);
  const leaveRoomMutation = useLeaveRoomMutation();

  // 디버깅을 위한 로그
  console.log('[GameLobby] Debug info:', {
    currentUserNickname,
    gameOwner: gameState.gameOwner,
    isOwner,
    playersLength: gameState.players.length,
    gameParticipants: gameState.gameParticipants,
    isRoomFull,
    canStartGame,
    players: gameState.players
  });

  const handleStartGame = () => {
    startGameMutation.mutate();
  };

  const handleLeaveRoom = () => {
    leaveRoomMutation.mutate({ gameNumber: gameState.gameNumber });
  };

  const handleExtendTime = () => {
    // TODO: 백엔드에 시간 연장 요청 API 구현
    console.log('[GameLobby] 시간 연장 요청');
  };

  return (
    <Stack gap="xl">
      {/* 방 시작 카운트다운 컴포넌트 */}
      <RoomStartCountdown
        gameNumber={gameState.gameNumber}
        isRoomFull={isRoomFull}
        isOwner={isOwner}
        onStartGame={handleStartGame}
        onExtendTime={handleExtendTime}
      />

      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xl">
        <div>
          <Text size="lg" fw={700} mb="md">
            플레이어 ({gameState.players.length} / {gameState.gameParticipants})
          </Text>
          <PlayerList players={gameState.players} gameOwner={gameState.gameOwner} />
        </div>
        <div>
          {/* Game settings info */}
          <Text>게임 모드: {gameState.gameMode}</Text>
          <Text>총 라운드: {gameState.gameTotalRounds}</Text>
          <Text>라이어 수: {gameState.gameLiarCount}</Text>
        </div>
      </SimpleGrid>

      <Group justify="flex-end">
        {isOwner && (
          <Button
            size="lg"
            onClick={handleStartGame}
            loading={startGameMutation.isPending}
            disabled={!canStartGame}
          >
            게임 시작 {!canStartGame && `(${gameState.players.length}/${gameState.gameParticipants})`}
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
