import '@testing-library/jest-dom';
import {cleanup} from '@testing-library/react';
import {afterAll, afterEach, beforeAll} from 'vitest';

// 각 테스트 후 정리
afterEach(() => {
  cleanup();
});

// 전역 모킹 설정
beforeAll(() => {
  // IntersectionObserver 모킹
  global.IntersectionObserver = class IntersectionObserver {
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
  };

  // ResizeObserver 모킹
  global.ResizeObserver = class ResizeObserver {
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
  };

  // Web API 모킹
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => {},
    }),
  });

  // Navigator API 모킹
  Object.defineProperty(navigator, 'vibrate', {
    writable: true,
    value: () => true,
  });

  // Audio API 모킹
  global.Audio = class Audio {
    volume = 1;
    currentTime = 0;
    duration = 0;
    paused = true;
    ended = false;

    constructor() {}

    play() { return Promise.resolve(); }

    pause() {}

    load() {}
  };

  // Performance API 모킹
  Object.defineProperty(window, 'performance', {
    writable: true,
    value: {
      now: () => Date.now(),
      getEntriesByType: () => [],
      getEntriesByName: () => [],
      memory: {
        usedJSHeapSize: 1000000,
        totalJSHeapSize: 2000000,
        jsHeapSizeLimit: 4000000,
      },
    },
  });

  // 애니메이션 API 모킹
  Element.prototype.animate = function() {
    return {
      addEventListener: () => {},
      removeEventListener: () => {},
      finish: () => {},
      cancel: () => {},
      pause: () => {},
      play: () => {},
      reverse: () => {},
      updatePlaybackRate: () => {},
      playbackRate: 1,
      currentTime: 0,
      effect: null,
      finished: Promise.resolve(),
      id: '',
      pending: false,
      playState: 'finished',
      ready: Promise.resolve(),
      replaceState: 'active',
      startTime: 0,
      timeline: null,
    };
  };

  Element.prototype.getAnimations = function() {
    return [];
  };
});

// 테스트 종료 후 정리
afterAll(() => {
  // 정리 작업
});
