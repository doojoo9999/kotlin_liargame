import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { challengeKeys } from '@/lib/queryKeys';

export type ChallengeSummary = {
  id: string;
  type: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  title: string;
  description?: string | null;
  progress: Record<string, unknown>;
  rewards: Record<string, unknown>;
  completed: boolean;
  claimed: boolean;
};

export const useChallengeSummary = () =>
  useQuery({
    queryKey: challengeKeys.list(),
    queryFn: async () => {
      const { data } = await apiClient.get<ChallengeSummary[]>('/challenges');
      return data;
    }
  });

export const useAchievementSummary = () =>
  useQuery({
    queryKey: challengeKeys.achievements(),
    queryFn: async () => {
      const { data } = await apiClient.get('/achievements');
      return data;
    }
  });

export const useSeasonPassProgress = () =>
  useQuery({
    queryKey: challengeKeys.season(),
    queryFn: async () => {
      const { data } = await apiClient.get('/season-pass');
      return data;
    }
  });
