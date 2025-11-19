import {describe, expect, it, vi} from 'vitest';
import {render, screen, within} from '@/test/utils/test-utils';
import {RoundStageTimeline} from './RoundStageTimeline';
import type {GameTimer, RoundUxStage} from '@/stores/unified/types';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({children, layout: _layout, ...props}: any) => {
      void _layout;
      return <div {...props}>{children}</div>;
    },
  },
}));

describe('RoundStageTimeline', () => {
  const baseTimer: GameTimer = {
    isActive: true,
    timeRemaining: 65,
    totalTime: 90,
    phase: 'SPEECH',
  };

  const baseProps = {
    round: 2,
    totalRounds: 5,
    stage: 'debate' as RoundUxStage,
    hasRoundStarted: true,
    currentPhase: 'VOTING_FOR_LIAR' as const,
    currentTopic: '과일',
    timer: baseTimer,
    stageEnteredAt: Date.now(),
  };

  it('highlights urgency when 10 seconds remain', () => {
    const urgentTimer: GameTimer = {
      ...baseTimer,
      timeRemaining: 9,
    };

    render(<RoundStageTimeline {...baseProps} timer={urgentTimer} />);

    const statusRegion = screen.getByRole('status');
    expect(within(statusRegion).getByText('0:09')).toBeInTheDocument();
    expect(screen.getByText('마지막 10초!')).toBeInTheDocument();
    expect(screen.getByLabelText('라운드 진행률')).toBeInTheDocument();
  });
});
