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

  // 채팅 입력 가능 여부 판단 - 백엔드 isChatAvailable 플래그 우선 사용
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

    // 게임 진행 중일 때는 백엔드의 isChatAvailable 플래그를 우선 사용
    if (gameState.gameState === 'IN_PROGRESS') {
      const currentUser = authData;
      if (!currentUser) {
        return { disabled: true, message: "사용자 정보가 없습니다." };
      }

      // 현재 플레이어 찾기 - nickname으로 매칭
      const currentPlayer = gameState.players.find(p => p.nickname === currentUser.nickname);

      // 디버깅 정보 출력
      console.log('[ChatBox DEBUG] Current user:', currentUser);
      console.log('[ChatBox DEBUG] Game players:', gameState.players);
      console.log('[ChatBox DEBUG] Found current player:', currentPlayer);
      console.log('[ChatBox DEBUG] Game phase:', gameState.currentPhase);
      console.log('[ChatBox DEBUG] isChatAvailable from backend:', gameState.isChatAvailable);

      if (!currentPlayer) {
        console.log('[ChatBox ERROR] Player not found! Auth nickname:', currentUser.nickname);
        console.log('[ChatBox ERROR] Available players:', gameState.players.map(p => p.nickname));

        // 게임이 종료되었거나 플레이어가 게임에서 제거된 경우
          if (!currentPlayer){
              return { disabled: true, message: "게임이 종료되었습니다." };
        }

        // 플레이어 정보 불일치
        return { disabled: true, message: "게임 참가자가 아닙니다. 페이지를 새로고침해주세요." };
      }

      // 백엔드의 isChatAvailable 플래그 사용
      if (!gameState.isChatAvailable) {
        // 페이즈별 비활성화 메시지 제공
        switch (gameState.currentPhase) {
          case 'SPEECH': {
            const currentTurnPlayer = getCurrentTurnPlayer(gameState);
            return {
              disabled: true,
              message: `${currentTurnPlayer?.nickname ?? '다른 플레이어'}님의 턴입니다. 힌트를 기다려주세요.`
            };
          }
          case 'VOTING_FOR_SURVIVAL':
            return { disabled: true, message: "최종 투표 중입니다. 채팅이 비활성화되었습니다." };
          case 'GUESSING_WORD':
            return { disabled: true, message: "라이어의 단어 추측을 기다려주세요." };
          default:
            return { disabled: true, message: "현재 채팅을 사용할 수 없습니다." };
        }
      }

      return { disabled: false, message: "" };
    }

    return { disabled: false, message: "" };
  };

  // 현재 턴인 플레이어를 찾는 헬퍼 함수
  const getCurrentTurnPlayer = (gameState: GameStateResponse) => {
    // turnOrder와 currentTurnIndex가 있는 경우
    if (gameState.turnOrder && gameState.currentTurnIndex !== undefined && gameState.currentTurnIndex !== null) {
      const currentTurnNickname = gameState.turnOrder[gameState.currentTurnIndex];
      return gameState.players.find(p => p.nickname === currentTurnNickname);
    }

    // turnOrder가 없는 경우 fallback: 시스템 메시지에서 현재 턴 플레이어를 추출
    // "🎯 XXX님의 차례입니다!" 메시지에서 닉네임 추출
    const recentMessages = messages.slice(-10); // 최근 10개 메시지만 확인
    for (let i = recentMessages.length - 1; i >= 0; i--) {
      const message = recentMessages[i];
      if (message.type === 'SYSTEM' && message.content.includes('님의 차례입니다!')) {
        const regex = /🎯\s*(.+?)님의\s*차례입니다!/;
        const match = regex.exec(message.content);
        if (match) {
          const turnPlayerNickname = match[1];
          console.log('[ChatBox DEBUG] Extracted turn player from system message:', turnPlayerNickname);
          return gameState.players.find(p => p.nickname === turnPlayerNickname);
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
