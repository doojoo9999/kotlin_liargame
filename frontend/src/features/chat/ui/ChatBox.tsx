import {Stack, Text} from '@mantine/core';
import {ChatInput} from './ChatInput';
import {ChatMessageList} from './ChatMessageList';
import type {ChatMessage} from '../types';
import type {GameStateResponse} from '../../room/types';
import {useAuth} from '../../auth';

interface ChatBoxProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  gameState?: GameStateResponse;
}

export function ChatBox({ messages, onSendMessage, disabled, gameState }: ChatBoxProps) {
  const { data: authData } = useAuth();

  // 채팅 입력 가능 여부 판단
  const getChatStatus = () => {
    if (disabled) {
      return { disabled: true, message: "채팅이 비활성화되었습니다." };
    }

    if (!gameState) {
      return { disabled: true, message: "게임 상태를 로딩 중입니다." };
    }

    if (gameState.gameState === 'ENDED') {
      return { disabled: true, message: "게임이 종료되었습니다." };
    }

    if (gameState.gameState === 'WAITING') {
      return { disabled: false, message: "" };
    }

    // 게임 진행 중일 때의 채팅 제한 체크
    if (gameState.gameState === 'IN_PROGRESS') {
      const currentUser = authData;
      if (!currentUser) {
        return { disabled: true, message: "사용자 정보가 없습니다." };
      }

      // 현재 플레이어 찾기
      const currentPlayer = gameState.players.find((p: any) => p.userId === currentUser.userId);
      if (!currentPlayer) {
        return { disabled: true, message: "플레이어 정보를 찾을 수 없습니다." };
      }

      // 게임 페이즈별 채팅 제한
      switch (gameState.currentPhase) {
        case 'SPEECH':
          // 힌트 제공 단계에서는 현재 턴인 플레이어만 채팅 가능
          const currentTurnPlayer = getCurrentTurnPlayer(gameState);
          if (currentTurnPlayer && currentTurnPlayer.id === currentPlayer.id) {
            return { disabled: false, message: "" };
          } else {
            return {
              disabled: true,
              message: `${currentTurnPlayer?.nickname || '다른 플레이어'}님의 턴입니다. 힌트를 기다려주세요.`
            };
          }

        case 'VOTE':
          return { disabled: true, message: "라이어 투표 중입니다." };

        case 'DEFENSE':
          // 변론 단계에서는 지목된 플레이어만 채팅 가능
          const accusedPlayer = gameState.accusedPlayer;
          if (accusedPlayer && accusedPlayer.id === currentPlayer.id) {
            return { disabled: false, message: "" };
          } else {
            return {
              disabled: true,
              message: `${accusedPlayer?.nickname || '지목된 플레이어'}님의 변론을 기다려주세요.`
            };
          }

        case 'FINAL_VOTE':
          return { disabled: true, message: "최종 투표 중입니다." };

        case 'LIAR_GUESS':
          // 라이어 추측 단계에서는 라이어만 채팅 가능
          if (currentPlayer.role === 'LIAR') {
            return { disabled: false, message: "" };
          } else {
            return { disabled: true, message: "라이어의 단어 추측을 기다려주세요." };
          }

        default:
          return { disabled: true, message: "현재 채팅을 할 수 없습니다." };
      }
    }

    return { disabled: false, message: "" };
  };

  // 현재 턴인 플레이어를 찾는 헬퍼 함수
  const getCurrentTurnPlayer = (gameState: GameStateResponse) => {
    if (!gameState.turnOrder || gameState.currentTurnIndex === undefined) {
      return null;
    }

    const currentTurnNickname = gameState.turnOrder[gameState.currentTurnIndex];
    return gameState.players.find((p: any) => p.nickname === currentTurnNickname);
  };

  const chatStatus = getChatStatus();

  return (
    <Stack>
      <ChatMessageList messages={messages} />
      {chatStatus.message && (
        <Text size="sm" c="dimmed" ta="center" py="xs">
          {chatStatus.message}
        </Text>
      )}
      <ChatInput
        onSendMessage={onSendMessage}
        disabled={chatStatus.disabled}
      />
    </Stack>
  );
}
