import {useMutation, useQueryClient} from '@tanstack/react-query';
import {useNavigate} from 'react-router-dom';
import {createRoom} from '../api/createRoom';

export const useCreateRoomMutation = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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
      // TODO: Show user-friendly error notification
      console.error('Failed to create room:', error);
    },
  });
};
