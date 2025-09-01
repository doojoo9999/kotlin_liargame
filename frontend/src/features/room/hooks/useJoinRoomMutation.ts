import {useMutation, useQueryClient} from '@tanstack/react-query';
import {useNavigate} from 'react-router-dom';
import {useNotifications} from '../../../shared/hooks';
import type {JoinRoomPayload} from '../api/joinRoom';
import {joinRoom} from '../api/joinRoom';
import {isAxiosError} from 'axios';

import {useUserStore} from '../../../shared/stores/userStore';

export const useJoinRoomMutation = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showError } = useNotifications();
  const nickname = useUserStore((state) => state.nickname);

  return useMutation({
    mutationFn: (data: Omit<JoinRoomPayload, 'nickname'>) => {
      return joinRoom({ ...data, nickname });
    },
    onSuccess: (data) => {
      const gameNumber = data.gameNumber;
      console.log(`Successfully joined room #${gameNumber}`);

      // Pre-populate the cache for the game state query
      queryClient.setQueryData(['game', gameNumber], data);

      navigate(`/game/${gameNumber}`);
    },
    onError: (error) => {
      console.error('Failed to join room:', error);
      let errorMessage = '방에 참여할 수 없습니다.';
      let errorTitle = '참여 실패';

      if (isAxiosError(error) && error.response) {
        const status = error.response.status;

        switch (status) {
          case 409:
            // Conflict - Room full or game already started
            errorTitle = '참여 불가';
            errorMessage = '방이 가득 찼거나 이미 게임이 시작되었습니다. 다른 방을 선택하거나 새로운 방을 만들어보세요.';
            break;
          case 404:
            errorTitle = '방을 찾을 수 없음';
            errorMessage = '존재하지 않는 게임방입니다.';
            break;
          case 401:
            errorTitle = '인증 필요';
            errorMessage = '로그인이 필요합니다. 다시 로그인해주세요.';
            break;
          case 400:
            errorTitle = '잘못된 요청';
            errorMessage = '세션 인증에 실패했습니다. 페이지를 새로고침하고 다시 시도해주세요.';
            break;
          default:
            errorMessage = (error.response.data as { message?: string })?.message ?? error.message ?? '알 수 없는 오류가 발생했습니다.';
            break;
        }
      }

      showError(errorTitle, errorMessage);
    },
  });
};
