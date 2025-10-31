import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { leaderboardKeys } from '@/lib/queryKeys';

export type LeaderboardEntry = {
  rank: number;
  subjectKey: string;
  nickname?: string | null;
  score: number;
  timeMs?: number | null;
  combo: number;
  perfect: boolean;
  mode: string;
  updatedAt: string;
};

type LeaderboardResponse = {
  entries: LeaderboardEntry[];
  mode: string;
  window: string;
};

export const usePuzzleLeaderboard = (puzzleId: string, mode = 'NORMAL') =>
  useQuery({
    queryKey: leaderboardKeys.puzzle(puzzleId, mode),
    enabled: Boolean(puzzleId),
    queryFn: async () => {
      const { data } = await apiClient.get<LeaderboardResponse>(`/puzzles/${puzzleId}/leaderboard`, {
        params: { mode }
      });
      return data;
    }
  });
