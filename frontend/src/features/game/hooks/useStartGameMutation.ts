import {useMutation, useQueryClient} from '@tanstack/react-query';
import {startGame} from '../api/startGame';
import {useNotifications} from '../../../shared/hooks/useNotifications';

export const useStartGameMutation = (gameNumber: number) => {
  const queryClient = useQueryClient();
  const {showError} = useNotifications();

  return useMutation({
    mutationFn: startGame,
    onSuccess: (data) => {
      console.log('Game started successfully:', data);

      queryClient.setQueryData(['game', gameNumber], data);
    },
    onError: (error) => {
      showError('게임 시작 실패', '게임을 시작할 수 없습니다. (예: 인원 부족)');

      console.error('Failed to start game:', error);
    },
  });
};
