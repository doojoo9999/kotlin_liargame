import {useEffect, useRef} from 'react';
import {useChatStore} from '../stores/chatStore';

/**
 * 올바른 Zustand 패턴을 사용한 ChatSocket 훅
 */
export const useChatSocket = (gameNumber: number) => {
    // 상태와 액션을 분리하여 선택
    const messages = useChatStore((state) => state.messages);
    const actions = useChatStore((state) => state.actions);
    const hasInitialized = useRef(false);

    // 메시지 배열 변경 시 로그 출력
    useEffect(() => {
        console.log('[useChatSocket] Messages updated:', messages);
    }, [messages]);

    useEffect(() => {
        // gameNumber가 유효하지 않으면 구독하지 않음
        if (!gameNumber || gameNumber <= 0) {
            return;
        }

        // React Strict Mode에서 중복 실행 방지
        if (hasInitialized.current) {
            return;
        }
        hasInitialized.current = true;

        console.log('[useChatSocket] Initializing for game:', gameNumber);

        // 비동기 구독
        actions.subscribeToChat(gameNumber);

        return () => {
            console.log('[useChatSocket] Cleanup for game:', gameNumber);
            actions.unsubscribeFromChat();
            actions.clearMessages();
            hasInitialized.current = false;
        };
    }, [gameNumber]); // actions는 의존성에서 제외 (Zustand actions는 안정적)

    return {
        messages,
        sendMessage: (content: string) => actions.sendMessage(gameNumber, content),
    };
};
