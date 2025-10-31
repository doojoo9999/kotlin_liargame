import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { leaderboardKeys } from '@/lib/queryKeys';

export const useCreateMultiplayerSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      mode: 'COOP' | 'VERSUS' | 'RELAY';
      puzzleId: string;
      maxParticipants?: number;
    }) => {
      const { data } = await apiClient.post('/multiplayer/sessions', body);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leaderboardKeys.root });
    }
  });
};
