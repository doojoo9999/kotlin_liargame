import React from 'react';

export class ScreenReaderManager {
  private announceQueue: string[] = [];
  private isAnnouncing = false;
  private announceTimeout?: number;

  announceGameEvent(event: string | GameEvent, priority: 'low' | 'medium' | 'high' = 'medium') {
    const announcement = this.formatAnnouncement(event);

    if (priority === 'high') {
      // 즉시 공지
      this.announceImmediate(announcement);
    } else {
      // 큐에 추가
      this.announceQueue.push(announcement);
      this.processQueue();
    }
  }

  // 게임별 특화 공지 메서드
  announcePlayerTurn(playerName: string) {
    this.announceGameEvent(`${playerName}님의 차례입니다. 힌트를 제출해주세요.`, 'high');
  }

  announceVotingPhase(playersCount: number) {
    this.announceGameEvent(`투표 단계입니다. ${playersCount}명 중 라이어를 찾아 투표해주세요.`, 'high');
  }

  announceGameResult(winner: string, liar: string) {
    this.announceGameEvent(`게임이 종료되었습니다. 승자: ${winner}, 라이어: ${liar}`, 'high');
  }

  announcePlayerCount(count: number) {
    this.announceGameEvent(`현재 ${count}명의 플레이어가 접속해 있습니다.`, 'medium');
  }

  // 정리 메서드
  cleanup() {
    if (this.announceTimeout) {
      clearTimeout(this.announceTimeout);
    }
    this.announceQueue = [];
    this.isAnnouncing = false;
  }

  private announceImmediate(message: string) {
    const ariaLive = document.getElementById('aria-live-assertive');
    if (ariaLive) {
      ariaLive.textContent = message;
      setTimeout(() => {
        ariaLive.textContent = '';
      }, 1000);
    }
  }

  private async processQueue() {
    if (this.isAnnouncing || this.announceQueue.length === 0) return;

    this.isAnnouncing = true;

    while (this.announceQueue.length > 0) {
      const message = this.announceQueue.shift()!;
      await this.announcePolite(message);
      await new Promise(resolve => setTimeout(resolve, 500)); // 간격 두기
    }

    this.isAnnouncing = false;
  }

  private announcePolite(message: string): Promise<void> {
    return new Promise((resolve) => {
      const ariaLive = document.getElementById('aria-live-polite');
      if (ariaLive) {
        ariaLive.textContent = message;
        this.announceTimeout = window.setTimeout(() => {
          ariaLive.textContent = '';
          resolve();
        }, 2000);
      } else {
        resolve();
      }
    });
  }

  private formatAnnouncement(event: string | GameEvent): string {
    if (typeof event === 'string') {
      return event;
    }

    // 게임 이벤트를 자연스러운 문장으로 변환
    const formats: Record<string, (data: any) => string> = {
      'player_joined': (data: any) => `${data.nickname}님이 게임에 참가했습니다.`,
      'player_left': (data: any) => `${data.nickname}님이 게임을 떠났습니다.`,
      'turn_changed': (data: any) => `${data.nickname}님의 차례입니다.`,
      'vote_cast': (data: any) => `${data.voter}님이 ${data.target}님에게 투표했습니다.`,
      'phase_changed': (data: any) => {
        const phaseNames = {
          'waiting': '대기',
          'playing': '진행',
          'voting': '투표',
          'ended': '종료'
        };
        return `게임 단계가 ${phaseNames[data.phase] || data.phase}로 변경되었습니다.`;
      },
      'game_ended': (data: any) => `게임이 종료되었습니다. ${data.result}`,
      'hint_submitted': (data: any) => `힌트가 제출되었습니다: ${data.hint}`,
      'player_eliminated': (data: any) => `${data.nickname}님이 탈락했습니다.`,
      'liar_revealed': (data: any) => `라이어는 ${data.nickname}님이었습니다!`,
    };

    return formats[event.type]?.(event.data) || '게임 이벤트가 발생했습니다.';
  }
}

// 게임 이벤트 타입 정의
interface GameEvent {
  type: string;
  data: any;
}

// React 컴포넌트로 aria-live 영역 제공
export const AriaLiveRegion = () => (
  <>
    <div
      id="aria-live-polite"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
      role="status"
      aria-label="게임 알림"
    />
    <div
      id="aria-live-assertive"
      aria-live="assertive"
      aria-atomic="true"
      className="sr-only"
      role="alert"
      aria-label="중요 알림"
    />
  </>
);

// React 훅으로 스크린 리더 매니저 사용
export const useScreenReader = () => {
  const managerRef = React.useRef<ScreenReaderManager>();

  React.useEffect(() => {
    if (!managerRef.current) {
      managerRef.current = new ScreenReaderManager();
    }

    return () => {
      managerRef.current?.cleanup();
    };
  }, []);

  return managerRef.current;
};

// 전역 인스턴스
export const screenReaderManager = new ScreenReaderManager();
