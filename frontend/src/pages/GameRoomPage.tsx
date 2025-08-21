import {Alert, Center, Container, Loader, SimpleGrid, Stack, Text, Title} from '@mantine/core';
import {AlertCircle} from 'lucide-react';
import {useParams} from 'react-router-dom';
import {ChatBox, useChatSocket} from '../features/chat';
import {GameInProgress, GameLobby, useGameStateQuery} from '../features/game';
import {useGameSocket} from '../features/game/hooks/useGameSocket';

export function GameRoomPage() {
  const { gameNumber } = useParams();
  const parsedGameNumber = Number(gameNumber);

  const { data: gameState, isLoading, isError } = useGameStateQuery(parsedGameNumber);
  useGameSocket(parsedGameNumber);
  const { messages, sendMessage } = useChatSocket(parsedGameNumber);

  const renderGameContent = () => {
    if (isLoading) {
      return <Center h="50vh"><Loader size="xl" /></Center>;
    }

    if (isError || !gameState) {
      return (
        <Alert icon={<AlertCircle />} title="오류" color="red" variant="light">
          게임 정보를 불러오는 데 실패했습니다. 로비로 돌아가 다시 시도해 주세요.
        </Alert>
      );
    }

    switch (gameState.gameState) {
      case 'WAITING':
        return <GameLobby gameState={gameState} />;
      case 'IN_PROGRESS':
        return <GameInProgress gameState={gameState} />;
      case 'ENDED':
        return <Title order={2}>게임 종료</Title>;
      default:
        return <Text>알 수 없는 게임 상태입니다.</Text>;
    }
  };

  return (
    <Container py="xl" fluid>
      <Title order={1} mb="lg">
        {gameState ? gameState.gameName : `Game Room #${gameNumber}`}
      </Title>
      <SimpleGrid cols={{ base: 1, lg: 2 }}>
        <Stack>{renderGameContent()}</Stack>
        <Stack>
          <Title order={3}>채팅</Title>
          <ChatBox
            messages={messages}
            onSendMessage={sendMessage}
            disabled={!gameState || gameState.gameState === 'ENDED'}
          />
        </Stack>
      </SimpleGrid>
    </Container>
  );
}
t>
      );
    }

    // Render different components based on the game state
    switch (gameState.gameState) {
      case 'WAITING':
        return <GameLobby gameState={gameState} />;
      case 'IN_PROGRESS':
        // TODO: Implement GameInProgress component
        return <Title order={2}>게임 진행 중...</Title>;
      case 'ENDED':
        // TODO: Implement GameEnded component
        return <Title order={2}>게임 종료</Title>;
      default:
        return <Text>알 수 없는 게임 상태입니다.</Text>;
    }
  };

  return (
    <Container py="xl">
      <Stack gap="lg">
        <Title order={1}>
          {gameState ? gameState.gameName : `Game Room #${gameNumber}`}
        </Title>
        {renderContent()}
      </Stack>
    </Container>
  );
}
