import {Button, Group, Paper, Text, Title} from '@mantine/core';
import {useState} from 'react';
import {Timer} from '../../../shared/ui/Timer';
import {useAuth} from '../../auth';
import {endDefense} from '../api/endDefense';
import {useNotifications} from '../../../shared/hooks/useNotifications';
import type {GameStateResponse} from '../../room/types';

interface DefensePhaseProps {
  gameState: GameStateResponse;
}

export function DefensePhase({ gameState }: DefensePhaseProps) {
  const { data: authData } = useAuth();
  const { showError } = useNotifications();
  const [isEndingDefense, setIsEndingDefense] = useState(false);
  const accusedPlayerNickname = gameState.accusedPlayer?.nickname;
  
  // Check if current user is the accused player
  const isCurrentUserAccused = authData && gameState.accusedPlayer &&
    authData.nickname === gameState.accusedPlayer.nickname;

  // Debug logging to understand the comparison
  console.log('[DefensePhase] Debug info:', {
    authDataUserId: authData?.userId,
    accusedPlayerId: gameState.accusedPlayer?.id,
    accusedPlayerNickname: gameState.accusedPlayer?.nickname,
    isCurrentUserAccused
  });

  const handleEndDefense = async () => {
    if (!authData || !gameState.gameNumber) return;
    
    try {
      setIsEndingDefense(true);
      await endDefense({ gameNumber: gameState.gameNumber });
      // Game state will be updated via WebSocket, no need to handle response here
    } catch (error) {
      console.error('Failed to end defense:', error);
      
      let errorMessage = '변론 종료 중에 오류가 발생했습니다.';
      
      // Handle status code specific error messages
      if (error && typeof error === 'object' && 'response' in error) {
        const errorResponse = error.response as { status?: number };
        if (errorResponse.status) {
          switch (errorResponse.status) {
            case 400:
              errorMessage = '잘못된 요청 또는 변론 종료 조건 불만족';
              break;
            case 403:
              errorMessage = '권한 없음';
              break;
            default:
              errorMessage = '변론 종료 중에 오류가 발생했습니다.';
          }
        }
      }
      
      showError('변론 종료 실패', errorMessage);
    } finally {
      setIsEndingDefense(false);
    }
  };

  return (
    <Paper p="lg" withBorder>
      <Group justify="space-between" mb="md">
        <Title order={3}>변론 시간</Title>
        <Timer endTime={gameState.phaseEndTime} />
      </Group>
      
      {accusedPlayerNickname ? (
        <>
          <Text ta="center" size="xl" mb="md">
            {accusedPlayerNickname}님이 라이어가 아님을 변론하고 있습니다.
          </Text>
          
          {isCurrentUserAccused && (
            <Group justify="center" mt="md">
              <Button
                color="red"
                variant="filled"
                onClick={() => void handleEndDefense()}
                loading={isEndingDefense}
                disabled={isEndingDefense}
                aria-label="변론 종료"
              >
                변론 종료
              </Button>
            </Group>
          )}
        </>
      ) : (
        <Text ta="center" size="xl" c="dimmed">
          피의자 정보를 기다리는 중...
        </Text>
      )}
    </Paper>
  );
}
