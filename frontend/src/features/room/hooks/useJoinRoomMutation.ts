import {useMutation, useQueryClient} from '@tanstack/react-query';
import {useNavigate} from 'react-router-dom';
import {joinRoom} from '../api/joinRoom';

export const useJoinRoomMutation = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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
      // TODO: Show user-friendly error notification (e.g., wrong password, room full)
      console.error('Failed to join room:', error);
    },
  });
};
