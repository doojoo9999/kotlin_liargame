import {Participant, ResolvedEvent} from '../types';
import {applyWeightModifiers, combineEffects} from './events';

export interface WheelSegment {
  participant: Participant;
  startAngle: number;
  endAngle: number;
  labelAngle: number;
  weight: number;
}

export function buildWheelSegments(
  participants: Participant[],
  events: ResolvedEvent[],
) {
  const { weightMultipliers, bannedIds } = combineEffects(events);
  const eligible = participants.filter(
    (participant) =>
      participant.isActive &&
      !bannedIds.has(participant.id) &&
      applyWeightModifiers(participant, weightMultipliers) > 0,
  );

  if (!eligible.length) {
    return {
      segments: [] as WheelSegment[],
      weightMultipliers,
      bannedIds,
    };
  }

  const weights = eligible.map((participant) =>
    applyWeightModifiers(participant, weightMultipliers),
  );

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

  return {
    segments,
    weightMultipliers,
    bannedIds,
  };
}

export function findSegment(
  segments: WheelSegment[],
  participantId: string,
): WheelSegment | undefined {
  return segments.find((segment) => segment.participant.id === participantId);
}

