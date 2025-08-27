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
    // 인증 상태 체크를 더 신중하게 처리
    if (!isAuthLoading && isAuthError) {
      // 네트워크 오류 등 일시적인 문제일 수 있으므로 즉시 리다이렉트하지 않음
      console.warn('[GameRoomPage] Auth error detected, but not redirecting immediately:', isAuthError);
      return;
    }

    if (!isAuthLoading && !authData?.authenticated) {
      // 인증 데이터가 없는 경우에만 리다이렉트
      console.warn('[GameRoomPage] User not authenticated, redirecting to login');

      // 사용자에게 더 나은 안내 메시지 제공
      const confirmRedirect = confirm(
        '로그인 세션이 만료되었습니다. 로그인 페이지로 이동하시겠습니까?\n' +
        '취소를 선택하면 페이지를 새로고침하여 다시 시도할 수 있습니다.'
      );

      if (confirmRedirect) {
        navigate('/login');
      } else {
        // 사용자가 취소를 선택하면 페이지 새로고침
        window.location.reload();
      }
    }
  }, [authData?.authenticated, isAuthLoading, isAuthError, navigate]);

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