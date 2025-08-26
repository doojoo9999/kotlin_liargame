import {useEffect} from 'react';
import {useQueryClient} from '@tanstack/react-query';
import {socketManager} from '../../../shared/socket/SocketManager';
import type {StompSubscription} from '@stomp/stompjs';

interface SubjectEvent {
  type: 'SUBJECT_ADDED' | 'SUBJECT_DELETED' | 'WORD_ADDED' | 'WORD_DELETED';
  subject?: {
    id: number;
    name: string;
  };
  subjectId?: string;
  word?: string;
  wordId?: number;
}

export const useSubjectWebSocketEvents = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    let subscription: StompSubscription | null = null;

    const handleSubjectEvent = (message: any) => {
      try {
        const event: SubjectEvent = JSON.parse(message.body);
        console.log('[DEBUG] Subject WebSocket event received:', event);

        switch (event.type) {
          case 'SUBJECT_ADDED':
            // 주제가 추가되었을 때 주제 목록 캐시 무효화
            queryClient.invalidateQueries({ queryKey: ['subjects'] });
            console.log('[DEBUG] Subjects cache invalidated after SUBJECT_ADDED');
            break;

          case 'SUBJECT_DELETED':
            // 주제가 삭제되었을 때 주제 목록 캐시 무효화
            queryClient.invalidateQueries({ queryKey: ['subjects'] });
            console.log('[DEBUG] Subjects cache invalidated after SUBJECT_DELETED');
            break;

          case 'WORD_ADDED':
            // 답안이 추가되었을 때도 주제 목록을 새로고침 (단어 개수 업데이트 등을 위해)
            queryClient.invalidateQueries({ queryKey: ['subjects'] });
            console.log('[DEBUG] Subjects cache invalidated after WORD_ADDED');
            break;

          case 'WORD_DELETED':
            // 답안이 삭제되었을 때도 주제 목록을 새로고침
            queryClient.invalidateQueries({ queryKey: ['subjects'] });
            console.log('[DEBUG] Subjects cache invalidated after WORD_DELETED');
            break;

          default:
            console.log('[DEBUG] Unknown subject event type:', event.type);
        }
      } catch (error) {
        console.error('[ERROR] Failed to parse WebSocket message:', error);
      }
    };

    // /topic/subjects 구독
    const subscribeToSubjects = async () => {
      try {
        subscription = await socketManager.subscribe('/topic/subjects', handleSubjectEvent);
        console.log('[DEBUG] Subscribed to /topic/subjects for real-time subject updates');
      } catch (error) {
        console.error('[ERROR] Failed to subscribe to /topic/subjects:', error);
      }
    };

    subscribeToSubjects();

    return () => {
      if (subscription) {
        socketManager.unsubscribe('/topic/subjects');
        console.log('[DEBUG] Unsubscribed from /topic/subjects');
      }
    };
  }, []);
};
