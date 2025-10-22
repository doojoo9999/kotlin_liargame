import type {Participant} from '../types';

export interface WheelSegment {
  participant: Participant;
  startAngle: number;
  endAngle: number;
  labelAngle: number;
  weight: number;
}

export function buildWheelSegments(participants: Participant[]): WheelSegment[] {
  const eligible = participants.filter(
    (participant) => participant.isActive && participant.entryCount > 0,
  );

  if (typeof window !== 'undefined') {
    (window as any).__debugEligible = eligible;
  }

  if (!eligible.length) {
    return [];
  }

  const weights = eligible.map((participant) => participant.entryCount);
  const total = weights.reduce((sum, weight) => sum + weight, 0);

  let cursor = 0;
  const segments = eligible.map((participant, index) => {
    const weight = weights[index];
    const span = (weight / total) * 360;
    const segment: WheelSegment = {
      participant,
      startAngle: cursor,
      endAngle: cursor + span,
      labelAngle: cursor + span / 2,
      weight,
    };
    cursor += span;
    return segment;
  });
  if (typeof window !== 'undefined') {
    (window as any).__debugEligible = eligible;
    (window as any).__debugSegments = segments;
  }
  return segments;
}

export function findSegment(
  segments: WheelSegment[],
  participantId: string,
): WheelSegment | undefined {
  return segments.find((segment) => segment.participant.id === participantId);
}
