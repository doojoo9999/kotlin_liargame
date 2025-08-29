import {Alert, Button, Center, Container, Group, Loader, SimpleGrid, Stack, Text, Title} from '@mantine/core';
import {AlertCircle} from 'lucide-react';
import {useNavigate, useParams} from 'react-router-dom';
import {ChatBox, useChatSocket} from '../features/chat';
import {ChatDebugInfo} from '../features/chat/ui/ChatDebugInfo';
import {GameInProgress, GameLobby, useGameSocket, useGameStateQuery} from '../features/game';
import {getChatHistory} from '../features/chat/api/getChatHistory';
import {useAuth} from '../features/auth';
import {useEffect} from 'react';

export function GameRoomPage() {
  const { gameNumber } = useParams();
  const navigate = useNavigate();
  const parsedGameNumber = Number(gameNumber);

  // 인증 상태 확인
  const { data: authData, isLoading: isAuthLoading, isError: isAuthError } = useAuth();

  const { data: gameState, isLoading, isError } = useGameStateQuery(parsedGameNumber);
  useGameSocket(parsedGameNumber);
  const { messages, sendMessage } = useChatSocket(parsedGameNumber);

  useEffect(() => {
    if (isAuthLoading) {
      console.log('[GameRoomPage] Auth loading, waiting...');
      return;
    }

    if (isAuthError) {
      console.warn('[GameRoomPage] Auth error detected:', isAuthError);
      const timer = setTimeout(() => {
        if (!authData?.authenticated) {
          console.warn('[GameRoomPage] Auth error persists after 10 seconds, redirecting to login');
          navigate('/login');
        }
      }, 10000);

      return () => clearTimeout(timer);
    }

    if (!authData?.authenticated && !isAuthLoading && !isAuthError) {
      console.warn('[GameRoomPage] User not authenticated, waiting 5 seconds before redirect...');
      const timer = setTimeout(() => {
        if (!authData?.authenticated) {
          console.warn('[GameRoomPage] User still not authenticated after 5 seconds, redirecting to login');
          navigate('/login');
        }
      }, 5000);

      return () => clearTimeout(timer);
    }

    if (authData?.authenticated) {
      console.log('[GameRoomPage] User authenticated:', authData.nickname);
    }
  }, [authData?.authenticated, isAuthLoading, isAuthError, navigate]);

  useEffect(() => {
    // 게임 에러 처리 - 게임이 삭제되었거나 찾을 수 없는 경우 자동으로 로비로 이동
    if (isError && !isLoading) {
      console.warn('[GameRoomPage] Game error detected, redirecting to lobby in 3 seconds...');
      const timer = setTimeout(() => {
        navigate('/');
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isError, isLoading, navigate]);

  useEffect(() => {
  }, [gameState, navigate]);

  const checkChatHistory = async () => {
    try {
      const history = await getChatHistory(parsedGameNumber);
      console.log('[DEBUG] Chat history from database:', history);
      alert(`데이터베이스에 저장된 채팅 메시지 수: ${history.length}`);
    } catch (error) {
      console.error('[ERROR] Failed to fetch chat history:', error);
      alert('채팅 히스토리 조회 실패');
    }
  };

  const checkCurrentUser = () => {
    if (authData) {
      console.log('[DEBUG] Current user data:', authData);
      alert(`현재 사용자: ${authData.nickname} (ID: ${authData.userId})`);
    } else {
      alert('사용자 정보가 없습니다.');
    }
  };

  if (isAuthLoading) {
    return <Center h="100vh"><Loader size="xl" /></Center>;
  }

  if (!authData?.authenticated || isAuthError) {
    return (
      <Container py="xl">
        <Alert icon={<AlertCircle />} title="인증 필요" color="yellow" variant="light">
          로그인이 필요합니다. 잠시 후 로그인 페이지로 이동합니다.
        </Alert>
      </Container>
    );
  }

  const renderGameContent = () => {
    if (isLoading) {
      return <Center h="50vh"><Loader size="xl" /></Center>;
    }

    if (isError || !gameState) {
      return (
        <Alert icon={<AlertCircle />} title="오류" color="red" variant="light">
          <Stack gap="md">
            <Text>
              게임 정보를 불러오는 데 실패했습니다. 방이 삭제되었거나 네트워크 오류가 발생했을 수 있습니다.
            </Text>
            <Group justify="flex-start">
              <Button
                variant="filled"
                color="blue"
                onClick={() => navigate('/')}
                leftSection={<AlertCircle size={16} />}
              >
                로비로 돌아가기
              </Button>
              <Button
                variant="outline"
                color="gray"
                onClick={() => window.location.reload()}
              >
                페이지 새로고침
              </Button>
            </Group>
          </Stack>
        </Alert>
      );
    }

    return (
      <Stack>
        {gameState.gameState === 'WAITING' && <GameLobby gameState={gameState} />}
        {(gameState.gameState === 'IN_PROGRESS' || gameState.gameState === 'ENDED') && (
          <GameInProgress gameState={gameState} />
        )}
        {gameState.gameState !== 'WAITING' &&
         gameState.gameState !== 'IN_PROGRESS' &&
         gameState.gameState !== 'ENDED' && (
          <Text>알 수 없는 게임 상태입니다.</Text>
        )}
      </Stack>
    );
  };

  return (
    <Container py="xl" fluid>
      <Title order={1} mb="lg">
        {gameState ? gameState.gameName : `Game Room #${gameNumber}`}
      </Title>
      <SimpleGrid cols={{ base: 1, lg: 2 }}>
        {/* 게임 컨텐츠 영역 */}
        {renderGameContent()}

        {/* 채팅 영역 - 항상 마운트 상태 유지 */}
        <Stack key={`chat-${parsedGameNumber}`}>
          <Title order={3}>채팅</Title>
          <ChatBox
            messages={messages}
            onSendMessage={sendMessage}
            disabled={!gameState || gameState.gameState === 'ENDED'}
            gameState={gameState}
          />
          {/* DEBUG: 채팅 히스토리 확인 버튼 */}
          <Group justify="flex-end">
            <Button onClick={checkChatHistory} variant="outline" size="xs">
              채팅 히스토리 확인
            </Button>
            <Button onClick={checkCurrentUser} variant="outline" size="xs">
              현재 사용자 확인
            </Button>
          </Group>
          <ChatDebugInfo gameNumber={parsedGameNumber} />
        </Stack>
      </SimpleGrid>
    </Container>
  );
}