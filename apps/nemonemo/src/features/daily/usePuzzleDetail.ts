import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { puzzleKeys } from '@/lib/queryKeys';

export type PuzzleContentStyle = 'GENERIC_PIXEL' | 'CLI_ASCII' | 'LETTERFORM' | 'SYMBOLIC' | 'MIXED';

export type PuzzleDetail = {
  id: string;
  title: string;
  description?: string | null;
  width: number;
  height: number;
  contentStyle?: PuzzleContentStyle;
  tags?: string[];
  hints: {
    rows: number[][];
    cols: number[][];
  };
  statistics: {
    playCount: number;
    clearCount: number;
    averageTimeMs?: number | null;
  };
};

export const usePuzzleDetail = (puzzleId?: string) =>
  useQuery({
    queryKey: puzzleKeys.detail(puzzleId ?? 'unknown'),
    enabled: Boolean(puzzleId),
    queryFn: async () => {
      const { data } = await apiClient.get<PuzzleDetail>(`/puzzles/${puzzleId}`);
      return data;
    }
  });
