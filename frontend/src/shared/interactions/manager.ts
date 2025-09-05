export type InteractionType =
  | 'hover' | 'click' | 'focus' | 'drag'
  | 'vote_cast' | 'hint_submit' | 'turn_change'
  | 'player_join' | 'player_leave' | 'game_start';

export interface InteractionConfig {
  type: InteractionType;
  trigger: string;
  animation: any;
  sound?: string;
  haptic?: boolean;
  cooldown?: number;
}

export class InteractionManager {
  private activeInteractions = new Map<string, number>();
  private soundEnabled = true;
  private hapticsEnabled = true;

  async executeInteraction(
    element: HTMLElement,
    config: InteractionConfig
  ): Promise<void> {
    // 쿨다운 체크
    if (this.isOnCooldown(config.type)) return;

    // 멀티모달 피드백 실행
    await Promise.all([
      this.playAnimation(element, config.animation),
      this.playSound(config.sound),
      this.playHaptic(config.haptic)
    ]);

    // 쿨다운 설정
    if (config.cooldown) {
      this.setCooldown(config.type, config.cooldown);
    }
  }

  setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
  }

  setHapticsEnabled(enabled: boolean) {
    this.hapticsEnabled = enabled;
  }

  private async playAnimation(element: HTMLElement, animation: any) {
    return new Promise<void>((resolve) => {
      if (!animation?.keyframes) {
        resolve();
        return;
      }

      const animationInstance = element.animate(animation.keyframes, {
        duration: animation.duration || 300,
        easing: animation.easing || 'ease-out'
      });

      animationInstance.addEventListener('finish', () => resolve());
    });
  }

  private async playSound(soundKey?: string) {
    if (!this.soundEnabled || !soundKey) return;

    try {
      const audio = new Audio(`/sounds/${soundKey}.mp3`);
      audio.volume = 0.3;
      await audio.play();
    } catch (error) {
      // 사운드 재생 실패는 무시
      console.debug('Sound playback failed:', error);
    }
  }

  private async playHaptic(enabled?: boolean) {
    if (!this.hapticsEnabled || !enabled) return;
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  }

  private isOnCooldown(type: InteractionType): boolean {
    const lastTime = this.activeInteractions.get(type);
    if (!lastTime) return false;

    return Date.now() - lastTime < 100; // 최소 100ms 간격
  }

  private setCooldown(type: InteractionType, duration: number) {
    this.activeInteractions.set(type, Date.now());
    setTimeout(() => {
      this.activeInteractions.delete(type);
    }, duration);
  }
}

// 전역 인스턴스
export const interactionManager = new InteractionManager();
