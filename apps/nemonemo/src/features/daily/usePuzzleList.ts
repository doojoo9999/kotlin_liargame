import { useInfiniteQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { puzzleKeys } from '@/lib/queryKeys';

export type PuzzleSummary = {
  id: string;
  title: string;
  width: number;
  height: number;
  difficultyCategory?: string;
  thumbnailUrl?: string | null;
  tags: string[];
  playCount: number;
};

type PuzzleListResponse = {
  items: PuzzleSummary[];
  nextCursor?: string | null;
};

export const usePuzzleList = (status: 'APPROVED' | 'OFFICIAL' = 'APPROVED') =>
  useInfiniteQuery({
    queryKey: puzzleKeys.list({ status }),
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const { data } = await apiClient.get<PuzzleListResponse>('/puzzles', {
        params: { page: pageParam, status }
      });
      return data;
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage.nextCursor) return undefined;
      const [, next] = lastPage.nextCursor.split(':');
      return Number(next);
    }
  });
