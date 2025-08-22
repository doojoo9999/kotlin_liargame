import {useMutation} from '@tanstack/react-query';
import {createRoom} from '../api/createRoom';
import {useJoinRoomMutation} from './useJoinRoomMutation';

export const useCreateRoomMutation = () => {
  const { mutate: joinRoom } = useJoinRoomMutation();

  return useMutation({
    mutationFn: createRoom,
    onSuccess: (gameNumber) => {
      joinRoom({ gameNumber });
    },
    onError: (error) => {
      console.error('Error creating room:', error);
      // Handle error (e.g., show notification)
    },
  });
};

