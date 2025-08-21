import {useMutation, useQueryClient} from '@tanstack/react-query';
import {useNavigate} from 'react-router-dom';
import {useNotifications} from '../../../shared/hooks/useNotifications';
import {createRoom} from '../api/createRoom';
import {isAxiosError} from 'axios';

export const useCreateRoomMutation = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showError } = useNotifications();

  return useMutation({
    mutationFn: createRoom,
    onSuccess: (gameNumber) => {
      console.log(`Room created successfully. Game number: ${gameNumber}`);
      // Invalidate rooms query to refetch the list in the lobby
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      // Navigate to the new game room
      navigate(`/game/${gameNumber}`);
    },
    onError: (error) => {
      console.error('Failed to create room:', error);
      let errorMessage = '방을 만드는 데 실패했습니다.';
      if (isAxiosError(error) && error.response) {
        errorMessage = error.response.data?.message || error.message;
      }
      showError('방 생성 오류', errorMessage);
    },
  });
};
