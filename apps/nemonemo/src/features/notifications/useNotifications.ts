import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { notificationKeys } from '@/lib/queryKeys';

export type NotificationItem = {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string | null;
  read: boolean;
  createdAt: string;
};

export const useNotifications = () =>
  useQuery({
    queryKey: notificationKeys.list(),
    queryFn: async () => {
      const { data } = await apiClient.get<NotificationItem[]>('/notifications');
      return data;
    }
  });
