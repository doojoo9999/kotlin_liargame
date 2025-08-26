import {useEffect, useRef} from 'react';
import {useGameStore} from '../stores/gameStore';

/**
 * 올바른 Zustand 패턴을 사용한 GameSocket 훅
 */
export const useGameSocket = (gameNumber: number) => {
    const actions = useGameStore((state) => state.actions);
    const hasInitialized = useRef(false);

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

        console.log('[useGameSocket] Initializing for game:', gameNumber);

        // 비동기 구독
        actions.subscribeToGame(gameNumber);

        return () => {
            console.log('[useGameSocket] Cleanup for game:', gameNumber);
            actions.unsubscribeFromGame();
            hasInitialized.current = false;
        };
    }, [gameNumber]); // actions는 의존성에서 제외 (Zustand actions는 안정적)
};
