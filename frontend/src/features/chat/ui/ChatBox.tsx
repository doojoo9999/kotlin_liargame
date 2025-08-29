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

      // 현재 플레이어 찾기 - nickname으로 매칭
      const currentPlayer = gameState.players.find((p: any) => p.nickname === currentUser.nickname);

      // 디버깅 정보 출력
      console.log('[ChatBox DEBUG] Current user:', currentUser);
      console.log('[ChatBox DEBUG] Game players:', gameState.players);
      console.log('[ChatBox DEBUG] Found current player:', currentPlayer);
      console.log('[ChatBox DEBUG] Game phase:', gameState.currentPhase);
      console.log('[ChatBox DEBUG] Turn order:', gameState.turnOrder);
      console.log('[ChatBox DEBUG] Current turn index:', gameState.currentTurnIndex);

      if (!currentPlayer) {

          console.log('[ChatBox ERROR] Player not found! Auth nickname:', currentUser.nickname);
        console.log('[ChatBox ERROR] Available players:', gameState.players.map((p: any) => p.nickname));

        // 게임이 종료되었거나 플레이어가 게임에서 제거된 경우
        if (gameState.gameState === 'ENDED' || gameState.players.length === 0) {
          return { disabled: true, message: "게임이 종료되었습니다." };
        }

        // 플레이어 정보 불일치 - 로비로 리다이렉트하는 것이 좋겠지만 일단 채팅만 비활성화
        return { disabled: true, message: "게임 참가자가 아닙니다. 페이지를 새로고침해주세요." };
      }

      // 게임 페이즈별 채팅 제한
      switch (gameState.currentPhase) {
        case 'SPEECH':
          // 발언 단계에서는 현재 턴인 플레이어만 채팅(힌트) 가능
          const currentTurnPlayer = getCurrentTurnPlayer(gameState);
          if (currentTurnPlayer && currentTurnPlayer.id === currentPlayer.id) {
            return { disabled: false, message: "" };
          } else {
            return {
              disabled: true,
              message: `${currentTurnPlayer?.nickname || '다른 플레이어'}님의 턴입니다. 힌트를 기다려주세요.`
            };
          }

        case 'VOTING_FOR_LIAR':
          // 투표 중에는 모든 사용자가 채팅 가능
          return { disabled: false, message: "" };

        case 'DEFENDING':
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

        case 'VOTING_FOR_SURVIVAL':
          // 최종 투표 중에는 모든 사용자가 채팅 가능
          return { disabled: false, message: "" };

        case 'GUESSING_WORD':
          // 라이어 추측 단계에서는 라이어만 채팅 가능
          if (currentPlayer.role === 'LIAR') {
            return { disabled: false, message: "" };
          } else {
            return { disabled: true, message: "라이어의 단어 추측을 기다려주세요." };
          }

        default:
          return { disabled: false, message: "" };
      }
    }

    return { disabled: false, message: "" };
  };

  // 현재 턴인 플레이어를 찾는 헬퍼 함수
  const getCurrentTurnPlayer = (gameState: GameStateResponse) => {
    // turnOrder와 currentTurnIndex가 있는 경우
    if (gameState.turnOrder && gameState.currentTurnIndex !== undefined && gameState.currentTurnIndex !== null) {
      const currentTurnNickname = gameState.turnOrder[gameState.currentTurnIndex];
      return gameState.players.find((p: any) => p.nickname === currentTurnNickname);
    }

    // turnOrder가 없는 경우 fallback: 시스템 메시지에서 현재 턴 플레이어를 추출
    // "🎯 XXX님의 차례입니다!" 메시지에서 닉네임 추출
    const recentMessages = messages.slice(-10); // 최근 10개 메시지만 확인
    for (let i = recentMessages.length - 1; i >= 0; i--) {
      const message = recentMessages[i];
      if (message.type === 'SYSTEM' && message.content.includes('님의 차례입니다!')) {
        const match = message.content.match(/🎯\s*(.+?)님의\s*차례입니다!/);
        if (match) {
          const turnPlayerNickname = match[1];
          console.log('[ChatBox DEBUG] Extracted turn player from system message:', turnPlayerNickname);
          return gameState.players.find((p: any) => p.nickname === turnPlayerNickname);
        }
      }
    }

    console.log('[ChatBox DEBUG] Could not determine current turn player');
    return null;
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
