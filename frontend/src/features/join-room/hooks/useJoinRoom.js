import {useMutation} from '@tanstack/react-query';
import {useNavigate} from 'react-router-dom';
import {joinRoom as joinRoomApi} from '@/features/join-room/api';
import {useAppNotifications} from '@/shared/hooks/useNotifications.jsx';

export const useJoinRoom = (options = {}) => {
  const navigate = useNavigate();
  const { handleError } = useAppNotifications();

  return useMutation({
    mutationFn: (joinData) => joinRoomApi(joinData),
    ...options,
    onSuccess: (data, variables, context) => {
      const { gameNumber } = variables;
      console.log(`Successfully joined room #${gameNumber}. Navigating...`);
      navigate(`/rooms/${gameNumber}`);

      if (options.onSuccess) {
        options.onSuccess(data, variables, context);
      }
    },
    onError: (error, variables, context) => {
      console.error('Failed to join room:', error);
      handleError(error, 'Failed to join room');
      if (options.onError) {
        options.onError(error, variables, context);
      }
    },
  });
};
