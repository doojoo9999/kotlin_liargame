import {useMutation, useQueryClient} from '@tanstack/react-query';
import {useNavigate} from 'react-router-dom';
import {leaveRoom} from '../api/leaveRoom';
import {useNotifications} from '../../../shared/hooks/useNotifications';

export const useLeaveRoomMutation = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {showError} = useNotifications();

  return useMutation({
    mutationFn: leaveRoom,
    onSuccess: () => {
      console.log('Successfully left the room');
      // Invalidate rooms query to refetch the list in the lobby
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      // Navigate back to the lobby
      navigate('/');
    },
    onError: (error) => {
      showError('방 나가기 실패', '방을 나가는 중에 오류가 발생했습니다.');
      console.error('Failed to leave room:', error);
      // As a fallback, still navigate the user away
      navigate('/');
    },
  });
};
