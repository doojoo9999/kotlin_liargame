import {useMutation, useQueryClient} from '@tanstack/react-query';
import {useNavigate} from 'react-router-dom';
import {leaveRoom} from '../api/leaveRoom';

export const useLeaveRoomMutation = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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
      // TODO: Show user-friendly error notification
      console.error('Failed to leave room:', error);
      // As a fallback, still navigate the user away
      navigate('/');
    },
  });
};
