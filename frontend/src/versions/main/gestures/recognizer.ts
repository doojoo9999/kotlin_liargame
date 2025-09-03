import {useEffect, useRef, useState} from 'react';

export interface GestureConfig {
  swipe?: {
    threshold: number;
    direction: 'horizontal' | 'vertical' | 'both';
    onSwipeLeft?: () => void;
    onSwipeRight?: () => void;
    onSwipeUp?: () => void;
    onSwipeDown?: () => void;
  };
  pinch?: {
    threshold: number;
    onPinchIn?: () => void;
    onPinchOut?: () => void;
  };
  longPress?: {
    duration: number;
    onLongPress?: () => void;
  };
  tap?: {
    onSingleTap?: () => void;
    onDoubleTap?: () => void;
    doubleTapDelay?: number;
  };
}

interface GestureState {
  isPressed: boolean;
  startTime: number;
  startPos: { x: number; y: number };
  currentPos: { x: number; y: number };
  lastTapTime: number;
  tapCount: number;
  initialDistance?: number;
  currentDistance?: number;
}

export const useAdvancedGestures = (
  element: React.RefObject<HTMLElement>,
  config: GestureConfig
) => {
  const [gestureState, setGestureState] = useState<GestureState>({
    isPressed: false,
    startTime: 0,
    startPos: { x: 0, y: 0 },
    currentPos: { x: 0, y: 0 },
    lastTapTime: 0,
    tapCount: 0
  });

  const longPressTimer = useRef<number>();
  const doubleTapTimer = useRef<number>();

  useEffect(() => {
    const el = element.current;
    if (!el) return;

    const getTouchDistance = (touch1: Touch, touch2: Touch): number => {
      const dx = touch1.clientX - touch2.clientX;
      const dy = touch1.clientY - touch2.clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      const now = Date.now();

      setGestureState(prev => ({
        ...prev,
        isPressed: true,
        startTime: now,
        startPos: { x: touch.clientX, y: touch.clientY },
        currentPos: { x: touch.clientX, y: touch.clientY },
        initialDistance: e.touches.length === 2 ? getTouchDistance(e.touches[0], e.touches[1]) : undefined
      }));

      // 롱프레스 타이머 시작
      if (config.longPress) {
        longPressTimer.current = window.setTimeout(() => {
          config.longPress!.onLongPress?.();
        }, config.longPress.duration);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (!gestureState.isPressed) return;

      const touch = e.touches[0];
      const currentDistance = e.touches.length === 2 ? getTouchDistance(e.touches[0], e.touches[1]) : undefined;

      setGestureState(prev => ({
        ...prev,
        currentPos: { x: touch.clientX, y: touch.clientY },
        currentDistance
      }));

      // 이동이 감지되면 롱프레스 취소
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = undefined;
      }

      // 핀치 제스처 처리
      if (config.pinch && gestureState.initialDistance && currentDistance) {
        const scale = currentDistance / gestureState.initialDistance;
        if (scale < 1 - config.pinch.threshold / 100) {
          config.pinch.onPinchIn?.();
        } else if (scale > 1 + config.pinch.threshold / 100) {
          config.pinch.onPinchOut?.();
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      if (!gestureState.isPressed) return;

      const duration = Date.now() - gestureState.startTime;
      const deltaX = gestureState.currentPos.x - gestureState.startPos.x;
      const deltaY = gestureState.currentPos.y - gestureState.startPos.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      // 롱프레스 타이머 정리
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = undefined;
      }

      // 스와이프 감지
      if (config.swipe && distance > config.swipe.threshold) {
        const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY);

        if (config.swipe.direction === 'both' ||
            (config.swipe.direction === 'horizontal' && isHorizontal) ||
            (config.swipe.direction === 'vertical' && !isHorizontal)) {

          if (isHorizontal) {
            if (deltaX > 0) config.swipe.onSwipeRight?.();
            else config.swipe.onSwipeLeft?.();
          } else {
            if (deltaY > 0) config.swipe.onSwipeDown?.();
            else config.swipe.onSwipeUp?.();
          }
        }
      }
      // 탭 제스처 처리 (작은 이동량과 짧은 시간)
      else if (config.tap && distance < 10 && duration < 300) {
        const now = Date.now();
        const timeSinceLastTap = now - gestureState.lastTapTime;
        const doubleTapDelay = config.tap.doubleTapDelay || 300;

        if (timeSinceLastTap < doubleTapDelay) {
          // 더블탭
          if (doubleTapTimer.current) {
            clearTimeout(doubleTapTimer.current);
            doubleTapTimer.current = undefined;
          }
          config.tap.onDoubleTap?.();
          setGestureState(prev => ({ ...prev, tapCount: 0, lastTapTime: 0 }));
        } else {
          // 싱글탭 (더블탭 대기)
          if (config.tap.onDoubleTap) {
            doubleTapTimer.current = window.setTimeout(() => {
              config.tap!.onSingleTap?.();
              setGestureState(prev => ({ ...prev, tapCount: 0 }));
            }, doubleTapDelay);
          } else {
            config.tap.onSingleTap?.();
          }
          setGestureState(prev => ({
            ...prev,
            tapCount: prev.tapCount + 1,
            lastTapTime: now
          }));
        }
      }

      setGestureState(prev => ({
        ...prev,
        isPressed: false,
        initialDistance: undefined,
        currentDistance: undefined
      }));
    };

    // 마우스 이벤트도 지원
    const handleMouseDown = (e: MouseEvent) => {
      const now = Date.now();
      setGestureState(prev => ({
        ...prev,
        isPressed: true,
        startTime: now,
        startPos: { x: e.clientX, y: e.clientY },
        currentPos: { x: e.clientX, y: e.clientY }
      }));

      if (config.longPress) {
        longPressTimer.current = window.setTimeout(() => {
          config.longPress!.onLongPress?.();
        }, config.longPress.duration);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!gestureState.isPressed) return;

      setGestureState(prev => ({
        ...prev,
        currentPos: { x: e.clientX, y: e.clientY }
      }));

      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = undefined;
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!gestureState.isPressed) return;

      const duration = Date.now() - gestureState.startTime;
      const deltaX = e.clientX - gestureState.startPos.x;
      const deltaY = e.clientY - gestureState.startPos.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = undefined;
      }

      // 스와이프 감지 (마우스)
      if (config.swipe && distance > config.swipe.threshold) {
        const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY);

        if (config.swipe.direction === 'both' ||
            (config.swipe.direction === 'horizontal' && isHorizontal) ||
            (config.swipe.direction === 'vertical' && !isHorizontal)) {

          if (isHorizontal) {
            if (deltaX > 0) config.swipe.onSwipeRight?.();
            else config.swipe.onSwipeLeft?.();
          } else {
            if (deltaY > 0) config.swipe.onSwipeDown?.();
            else config.swipe.onSwipeUp?.();
          }
        }
      }
      // 클릭 제스처 처리
      else if (config.tap && distance < 5 && duration < 300) {
        const now = Date.now();
        const timeSinceLastTap = now - gestureState.lastTapTime;
        const doubleTapDelay = config.tap.doubleTapDelay || 300;

        if (timeSinceLastTap < doubleTapDelay) {
          if (doubleTapTimer.current) {
            clearTimeout(doubleTapTimer.current);
            doubleTapTimer.current = undefined;
          }
          config.tap.onDoubleTap?.();
          setGestureState(prev => ({ ...prev, tapCount: 0, lastTapTime: 0 }));
        } else {
          if (config.tap.onDoubleTap) {
            doubleTapTimer.current = window.setTimeout(() => {
              config.tap!.onSingleTap?.();
              setGestureState(prev => ({ ...prev, tapCount: 0 }));
            }, doubleTapDelay);
          } else {
            config.tap.onSingleTap?.();
          }
          setGestureState(prev => ({
            ...prev,
            tapCount: prev.tapCount + 1,
            lastTapTime: now
          }));
        }
      }

      setGestureState(prev => ({ ...prev, isPressed: false }));
    };

    // 이벤트 리스너 등록
    el.addEventListener('touchstart', handleTouchStart, { passive: false });
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    el.addEventListener('touchend', handleTouchEnd, { passive: false });
    el.addEventListener('mousedown', handleMouseDown);
    el.addEventListener('mousemove', handleMouseMove);
    el.addEventListener('mouseup', handleMouseUp);

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
      el.removeEventListener('mousedown', handleMouseDown);
      el.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseup', handleMouseUp);

      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
      if (doubleTapTimer.current) {
        clearTimeout(doubleTapTimer.current);
      }
    };
  }, [element, config, gestureState]);

  // 정리 함수
  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
      if (doubleTapTimer.current) {
        clearTimeout(doubleTapTimer.current);
      }
    };
  }, []);

  return gestureState;
};

// 제스처 유틸리티 훅
export const useGesturePresets = () => {
  return {
    // 게임 카드용 제스처
    gameCard: {
      tap: {
        onSingleTap: () => console.log('Card selected'),
        onDoubleTap: () => console.log('Card quick action')
      },
      longPress: {
        duration: 500,
        onLongPress: () => console.log('Card context menu')
      }
    },

    // 플레이어 목록용 제스처
    playerList: {
      swipe: {
        threshold: 50,
        direction: 'horizontal' as const,
        onSwipeLeft: () => console.log('Previous player'),
        onSwipeRight: () => console.log('Next player')
      }
    },

    // 채팅 영역용 제스처
    chatArea: {
      swipe: {
        threshold: 30,
        direction: 'vertical' as const,
        onSwipeUp: () => console.log('Show more messages'),
        onSwipeDown: () => console.log('Hide chat')
      }
    }
  };
};
