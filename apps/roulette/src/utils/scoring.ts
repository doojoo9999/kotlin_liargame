import {Participant, ResolvedEvent, WinnerResult} from '../types';

const BASE_POINTS = [5, 3, 1];
const STREAK_BONUS_THRESHOLD = 2;
const STREAK_BONUS_POINTS = 2;

export interface ApplySpinResultParams {
  participants: Participant[];
  winners: Participant[];
  events: ResolvedEvent[];
  previousFirstWinnerId: string | null;
}

export interface ApplySpinResultResponse {
  updatedParticipants: Participant[];
  breakdown: WinnerResult[];
  nextFirstWinnerId: string | null;
}

export function applySpinResults({
  participants,
  winners,
  events,
  previousFirstWinnerId,
}: ApplySpinResultParams): ApplySpinResultResponse {
  const scoreBonusesByPlacement = events
    .map((event) => event.scoreBonus)
    .filter((bonus): bonus is NonNullable<typeof bonus> => Boolean(bonus))
    .reduce<Record<number, number>>((acc, bonus) => {
      acc[bonus.position] = (acc[bonus.position] ?? 0) + bonus.amount;
      return acc;
    }, {});

  const firstWinner = winners[0] ?? null;
  const breakdown: WinnerResult[] = [];

  const updatedParticipants = participants.map((participant) => {
    const placement = winners.findIndex((winner) => winner.id === participant.id);
    let pointsEarned = 0;
    let nextStreak = participant.streak;

    if (placement >= 0) {
      pointsEarned = BASE_POINTS[placement] ?? 0;
      pointsEarned += scoreBonusesByPlacement[placement] ?? 0;

      if (placement === 0) {
        nextStreak =
          previousFirstWinnerId === participant.id
            ? participant.streak + 1
            : 1;

        if (nextStreak >= STREAK_BONUS_THRESHOLD) {
          pointsEarned += STREAK_BONUS_POINTS;
        }
      } else if (participant.id === previousFirstWinnerId) {
        nextStreak = 0;
      }

      breakdown.push({
        participantId: participant.id,
        placement,
        pointsEarned,
        streak: placement === 0 ? nextStreak : participant.streak,
      });
    } else if (participant.id === previousFirstWinnerId) {
      nextStreak = 0;
    }

    return {
      ...participant,
      points: participant.points + pointsEarned,
      streak: nextStreak,
    };
  });

  breakdown.sort((a, b) => a.placement - b.placement);

  const nextFirstWinnerId = firstWinner ? firstWinner.id : null;

  return {
    updatedParticipants,
    breakdown,
    nextFirstWinnerId,
  };
}
