export interface AdaptiveUIConfig {
  screenSize: 'mobile' | 'tablet' | 'desktop';
  deviceCapability: 'low' | 'medium' | 'high';
  networkSpeed: 'slow' | 'fast';
  userPreferences: {
    animationLevel: 'minimal' | 'reduced' | 'full';
    colorScheme: 'light' | 'dark' | 'auto';
    fontSize: 'small' | 'medium' | 'large';
    contrast: 'normal' | 'high';
  };
}

export class AdaptiveUIManager {
  private config: AdaptiveUIConfig;
  private mediaQueries: Map<string, MediaQueryList> = new Map();

  constructor() {
    this.config = this.detectConfiguration();
    this.setupMediaQueryListeners();
  }

  getLayoutConfig() {
    const { screenSize } = this.config;

    return {
      playerCard: {
        size: screenSize === 'mobile' ? 'compact' : 'full',
        columns: screenSize === 'mobile' ? 2 : screenSize === 'tablet' ? 3 : 4,
        spacing: screenSize === 'mobile' ? 'tight' : 'comfortable',
        orientation: screenSize === 'mobile' ? 'vertical' : 'horizontal'
      },
      gameBoard: {
        layout: screenSize === 'mobile' ? 'stack' : 'grid',
        orientation: screenSize === 'mobile' ? 'portrait' : 'landscape',
        padding: screenSize === 'mobile' ? '1rem' : '2rem'
      },
      chat: {
        position: screenSize === 'mobile' ? 'bottom' : 'side',
        height: screenSize === 'mobile' ? '40%' : '100%',
        width: screenSize === 'desktop' ? '300px' : '100%'
      },
      navigation: {
        type: screenSize === 'mobile' ? 'bottom' : 'top',
        collapsible: screenSize !== 'desktop'
      }
    };
  }

  getAnimationLevel() {
    const { deviceCapability, userPreferences } = this.config;

    if (userPreferences.animationLevel === 'minimal') return 'none';
    if (userPreferences.animationLevel === 'reduced') return 'essential';
    if (deviceCapability === 'low') return 'reduced';

    return 'full';
  }

  getDynamicStyles() {
    const { userPreferences } = this.config;

    return {
      fontSize: {
        small: '14px',
        medium: '16px',
        large: '18px'
      }[userPreferences.fontSize],

      contrast: userPreferences.contrast === 'high' ? {
        backgroundColor: '#000000',
        color: '#ffffff',
        borderWidth: '2px',
        borderStyle: 'solid'
      } : {},

      colorScheme: userPreferences.colorScheme === 'auto'
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : userPreferences.colorScheme,

      spacing: this.config.screenSize === 'mobile' ? 'compact' : 'comfortable'
    };
  }

  updateUserPreference<K extends keyof AdaptiveUIConfig['userPreferences']>(
    key: K,
    value: AdaptiveUIConfig['userPreferences'][K]
  ) {
    this.config.userPreferences[key] = value;
    localStorage.setItem('adaptive-ui-preferences', JSON.stringify(this.config.userPreferences));
    this.notifyConfigChange();
  }

  getConfig(): AdaptiveUIConfig {
    return { ...this.config };
  }

  // 성능 최적화를 위한 메서드
  shouldUseAdvancedFeatures(): boolean {
    return this.config.deviceCapability === 'high' &&
           this.config.networkSpeed === 'fast' &&
           this.getAnimationLevel() === 'full';
  }

  getOptimalImageQuality(): 'low' | 'medium' | 'high' {
    if (this.config.deviceCapability === 'low' || this.config.networkSpeed === 'slow') {
      return 'low';
    }
    if (this.config.deviceCapability === 'medium') {
      return 'medium';
    }
    return 'high';
  }

  private detectConfiguration(): AdaptiveUIConfig {
    return {
      screenSize: this.detectScreenSize(),
      deviceCapability: this.detectDeviceCapability(),
      networkSpeed: this.detectNetworkSpeed(),
      userPreferences: this.loadUserPreferences()
    };
  }

  private detectScreenSize(): 'mobile' | 'tablet' | 'desktop' {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  private detectDeviceCapability(): 'low' | 'medium' | 'high' {
    // Navigator API를 사용한 기기 성능 추정
    const connection = (navigator as any).connection;
    const hardwareConcurrency = navigator.hardwareConcurrency || 4;
    const deviceMemory = (navigator as any).deviceMemory || 4;

    let score = 0;

    // CPU 코어 수
    if (hardwareConcurrency >= 8) score += 2;
    else if (hardwareConcurrency >= 4) score += 1;

    // 메모리
    if (deviceMemory >= 8) score += 2;
    else if (deviceMemory >= 4) score += 1;

    // 네트워크 품질
    if (connection) {
      if (connection.effectiveType === '4g') score += 1;
      else if (connection.effectiveType === '3g') score -= 1;
    }

    if (score >= 4) return 'high';
    if (score >= 2) return 'medium';
    return 'low';
  }

  private detectNetworkSpeed(): 'slow' | 'fast' {
    const connection = (navigator as any).connection;
    if (!connection) return 'fast';

    const effectiveType = connection.effectiveType;
    return ['slow-2g', '2g', '3g'].includes(effectiveType) ? 'slow' : 'fast';
  }

  private loadUserPreferences() {
    const stored = localStorage.getItem('adaptive-ui-preferences');
    const defaults = {
      animationLevel: 'full' as const,
      colorScheme: 'auto' as const,
      fontSize: 'medium' as const,
      contrast: 'normal' as const
    };

    if (stored) {
      try {
        return { ...defaults, ...JSON.parse(stored) };
      } catch {
        return defaults;
      }
    }

    // 시스템 설정에서 기본값 추론
    return {
      ...defaults,
      colorScheme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
      animationLevel: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'reduced' : 'full',
      contrast: window.matchMedia('(prefers-contrast: high)').matches ? 'high' : 'normal'
    };
  }

  private setupMediaQueryListeners() {
    // 화면 크기 변화 감지
    const mobileQuery = window.matchMedia('(max-width: 767px)');
    const tabletQuery = window.matchMedia('(min-width: 768px) and (max-width: 1023px)');

    mobileQuery.addEventListener('change', () => this.updateScreenSize());
    tabletQuery.addEventListener('change', () => this.updateScreenSize());

    // 색상 스키마 변화 감지
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    darkModeQuery.addEventListener('change', (e) => {
      if (this.config.userPreferences.colorScheme === 'auto') {
        this.updateColorScheme(e.matches ? 'dark' : 'light');
      }
    });

    // 애니메이션 설정 변화 감지
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotionQuery.addEventListener('change', (e) => {
      this.config.userPreferences.animationLevel = e.matches ? 'reduced' : 'full';
      this.notifyConfigChange();
    });
  }

  private updateScreenSize() {
    const newSize = this.detectScreenSize();
    if (newSize !== this.config.screenSize) {
      this.config.screenSize = newSize;
      this.notifyConfigChange();
    }
  }

  private updateColorScheme(scheme: 'light' | 'dark') {
    if (this.config.userPreferences.colorScheme === 'auto') {
      this.notifyConfigChange();
    }
  }

  private notifyConfigChange() {
    // 설정 변경 이벤트 발생
    window.dispatchEvent(new CustomEvent('adaptive-ui-change', {
      detail: this.config
    }));
  }
}

// 전역 인스턴스
export const adaptiveUIManager = new AdaptiveUIManager();
