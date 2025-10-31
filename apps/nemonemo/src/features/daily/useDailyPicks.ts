import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { puzzleKeys } from '@/lib/queryKeys';

type DailyPickItem = {
  id: string;
  title: string;
  difficultyCategory?: string;
  thumbnailUrl?: string | null;
  playCount: number;
};

type DailyPickResponse = {
  date: string;
  items: DailyPickItem[];
};

export const useDailyPicks = () =>
  useQuery({
    queryKey: puzzleKeys.dailyPicks(),
    queryFn: async () => {
      const { data } = await apiClient.get<DailyPickResponse>('/daily-picks');
      return data;
    }
  });
