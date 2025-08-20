import {useMutation} from '@tanstack/react-query';
import {useNavigate} from 'react-router-dom';
import {createRoom as createRoomApi} from '@/features/create-room/api';

export const useCreateRoom = (options = {}) => {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (roomData) => createRoomApi(roomData),
    ...options,
    onSuccess: (roomId, variables, context) => {
      console.log(`Room created successfully with ID: ${roomId}. Navigating to room...`);
      navigate(`/rooms/${roomId}`);

      if (options.onSuccess) {
        options.onSuccess(roomId, variables, context);
      }
    },
    onError: (error, variables, context) => {
      console.error('Failed to create room:', error);
      // Here you could show a notification to the user
      if (options.onError) {
        options.onError(error, variables, context);
      }
    },
  });
};
