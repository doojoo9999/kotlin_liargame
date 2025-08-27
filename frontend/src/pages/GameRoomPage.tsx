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

  // 인증되지 않은 사용자 처리 - 더 관대한 정책 적용
  useEffect(() => {
    // 아직 로딩 중이면 대기
    if (isAuthLoading) {
      return;
    }

    // 인증 오류가 있지만 일시적일 수 있으므로 즉시 리다이렉트하지 않음
    if (isAuthError) {
      console.warn('[GameRoomPage] Auth error detected:', isAuthError);
      // 3초 후에도 오류가 지속되면 리다이렉트
      const timer = setTimeout(() => {
        if (!authData?.authenticated) {
          console.warn('[GameRoomPage] Auth error persists, redirecting to login');
          navigate('/login');
        }
      }, 3000);

      return () => clearTimeout(timer);
    }

    // 로딩이 완료되고 명확히 인증되지 않은 경우에만 리다이렉트
    if (!authData?.authenticated) {
      console.warn('[GameRoomPage] User not authenticated after loading complete, redirecting to login');
      navigate('/login');
    }
  }, [authData?.authenticated, isAuthLoading, isAuthError, navigate]);

  // 게임방 정리(ROOM_DELETED) 시 안내 및 로비로 리다이렉트
  useEffect(() => {
    if (gameState?.type === 'ROOM_DELETED') {
      alert(`게임방이 정리되었습니다.\n이유: ${gameState.reason || '알 수 없음'}`);
      navigate('/');
    }
  }, [gameState, navigate]);

  // 임시 디버깅: 채팅 히스토리 확인
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

  // 임시 디버깅: 현재 사용자 정보 확인
  const checkCurrentUser = () => {
    if (authData) {
      console.log('[DEBUG] Current user data:', authData);
      alert(`현재 사용자: ${authData.nickname} (ID: ${authData.userId})`);
    } else {
      alert('사용자 정보가 없습니다.');
    }
  };

  // 인증 로딩 중이거나 인증되지 않은 경우
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

    switch (gameState.gameState) {
      case 'WAITING':
        return <GameLobby gameState={gameState} />;
      case 'IN_PROGRESS':
        return <GameInProgress gameState={gameState} />;
      case 'ENDED':
        // NOTE: GameEndedPhase is now part of GameInProgress logic
        return <GameInProgress gameState={gameState} />;
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