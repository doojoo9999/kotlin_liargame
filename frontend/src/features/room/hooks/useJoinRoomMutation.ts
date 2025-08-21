import {useMutation, useQueryClient} from '@tanstack/react-query';
import {useNavigate} from 'react-router-dom';
import {useNotifications} from '../../../shared/hooks/useNotifications';
import {joinRoom} from '../api/joinRoom';
import {isAxiosError} from 'axios';

export const useJoinRoomMutation = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showError } = useNotifications();

  return useMutation({
    mutationFn: joinRoom,
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
      if (isAxiosError(error) && error.response) {
        errorMessage = error.response.data?.message || error.message;
      }
      showError('참여 실패', errorMessage);
    },
  });
};
