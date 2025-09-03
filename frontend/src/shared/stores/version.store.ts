import {create} from 'zustand';
import {persist} from 'zustand/middleware';

// Navigator 인터페이스 확장 (deviceMemory는 실험적 기능)
declare global {
  interface Navigator {
    deviceMemory?: number;
  }
}

export type AppVersion = 'light' | 'main';
export type VersionPreference = 'auto' | 'light' | 'main';

interface VersionState {
  currentVersion: AppVersion;
  userPreference: VersionPreference;
  deviceCapability: 'low' | 'medium' | 'high';
  autoDetectionEnabled: boolean;
}

interface VersionStore extends VersionState {
  // 액션
  setVersion: (version: AppVersion) => void;
  setUserPreference: (preference: VersionPreference) => void;
  setDeviceCapability: (capability: 'low' | 'medium' | 'high') => void;
  toggleAutoDetection: () => void;
  detectOptimalVersion: () => AppVersion;

  // 버전 호환성 확인
  isVersionSupported: (version: AppVersion) => boolean;
  getVersionFeatures: (version: AppVersion) => string[];

  // 초기화
  initialize: () => void;
  detectDeviceCapability: () => void;
}

export const useVersionStore = create<VersionStore>()(
  persist(
    (set, get) => ({
      // 초기 상태
      currentVersion: 'light', // 기본값은 light
      userPreference: 'auto',
      deviceCapability: 'medium',
      autoDetectionEnabled: true,

      // 버전 설정
      setVersion: (version: AppVersion) => {
        set({ currentVersion: version });

        // URL 업데이트
        const newPath = `/${version}${window.location.pathname.replace(/^\/(light|main)/, '')}`;
        window.history.pushState(null, '', newPath);
      },

      // 사용자 선호도 설정
      setUserPreference: (preference: VersionPreference) => {
        set({ userPreference: preference });

        if (preference !== 'auto') {
          get().setVersion(preference as AppVersion);
        } else {
          const optimal = get().detectOptimalVersion();
          get().setVersion(optimal);
        }
      },

      // 디바이스 성능 설정
      setDeviceCapability: (capability: 'low' | 'medium' | 'high') => {
        set({ deviceCapability: capability });

        if (get().autoDetectionEnabled && get().userPreference === 'auto') {
          const optimal = get().detectOptimalVersion();
          get().setVersion(optimal);
        }
      },

      // 자동 감지 토글
      toggleAutoDetection: () => {
        set((state) => ({ autoDetectionEnabled: !state.autoDetectionEnabled }));
      },

      // 최적 버전 감지
      detectOptimalVersion: (): AppVersion => {
        const { deviceCapability, userPreference } = get();

        // 사용자가 명시적으로 선택한 경우
        if (userPreference !== 'auto') {
          return userPreference as AppVersion;
        }

        // 디바이스 성능 기반 자동 선택
        switch (deviceCapability) {
          case 'low':
            return 'light';
          case 'high':
            return 'main';
          case 'medium':
          default:
            // 중간 성능은 브라우저 지원 여부로 결정
            return get().isVersionSupported('main') ? 'main' : 'light';
        }
      },

      // 버전 지원 여부 확인
      isVersionSupported: (version: AppVersion): boolean => {
        if (version === 'light') return true; // Light는 항상 지원

        // Main 버전 지원 확인
        const checks = {
          // 모던 브라우저 API 확인
          modernAPIs: typeof window.IntersectionObserver !== 'undefined' &&
                     typeof window.ResizeObserver !== 'undefined',

          // CSS 기능 확인
          cssSupport: CSS.supports('backdrop-filter', 'blur(10px)') &&
                     CSS.supports('display', 'grid'),

          // 메모리 확인 (대략적)
          memoryCheck: (navigator as any).deviceMemory ? (navigator as any).deviceMemory >= 2 : true,

          // 하드웨어 가속 확인
          hardwareAcceleration: (() => {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            return !!gl;
          })(),
        };

        return Object.values(checks).every(Boolean);
      },

      // 버전별 기능 목록
      getVersionFeatures: (version: AppVersion): string[] => {
        const features = {
          light: [
            'Mantine UI 컴포넌트',
            '기본 게임 기능',
            '실시간 채팅',
            '모바일 최적화',
            '저사양 디바이스 지원',
          ],
          main: [
            'shadcn/ui 고급 컴포넌트',
            'Framer Motion 애니메이션',
            '고급 게임 시각화',
            '파티클 효과',
            '동적 레이아웃',
            '성능 최적화',
            '접근성 기능',
          ],
        };

        return features[version] || [];
      },

      // 초기화
      initialize: () => {
        // URL에서 버전 감지
        const pathVersion = window.location.pathname.match(/^\/(light|main)/)?.[1] as AppVersion;

        if (pathVersion && get().isVersionSupported(pathVersion)) {
          set({ currentVersion: pathVersion });
        } else {
          // 디바이스 성능 감지
          get().detectDeviceCapability();
          const optimal = get().detectOptimalVersion();
          get().setVersion(optimal);
        }
      },

      // 디바이스 성능 감지 (내부 메서드)
      detectDeviceCapability: () => {
        let capability: 'low' | 'medium' | 'high' = 'medium';

        // 하드웨어 정보 기반 판단
        const hardwareMemory = (navigator as any).deviceMemory;
        const hardwareCores = navigator.hardwareConcurrency;

        if (hardwareMemory) {
          if (hardwareMemory <= 2) capability = 'low';
          else if (hardwareMemory >= 8) capability = 'high';
        }

        if (hardwareCores) {
          if (hardwareCores <= 2) capability = 'low';
          else if (hardwareCores >= 8) capability = 'high';
        }

        // 연결 속도 고려
        const connection = (navigator as any).connection;
        if (connection) {
          if (connection.effectiveType === '2g' || connection.effectiveType === 'slow-2g') {
            capability = 'low';
          }
        }

        set({ deviceCapability: capability });
      },
    }),
    {
      name: 'version-storage',
      partialize: (state) => ({
        userPreference: state.userPreference,
        autoDetectionEnabled: state.autoDetectionEnabled,
      }),
    }
  )
);
