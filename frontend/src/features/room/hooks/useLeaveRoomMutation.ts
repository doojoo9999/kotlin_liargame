import {useMutation} from '@tanstack/react-query';
import {leaveRoom} from '../api/leaveRoom';

export function useLeaveRoomMutation() {
  return useMutation({
    mutationFn: (roomId: string) => leaveRoom(roomId),
  });
}

