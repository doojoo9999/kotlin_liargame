import {EventCard, Participant, ResolvedEvent} from '../types';

const randomItem = <T>(arr: T[]): T | null => {
  if (!arr.length) return null;
  const index = Math.floor(Math.random() * arr.length);
  return arr[index];
};

const toSummary = (names: string[], fallback: string) =>
  names.length ? names.join(', ') : fallback;

export function resolveEvent(
  card: EventCard,
  participants: Participant[],
): ResolvedEvent | null {
  const eligible = participants.filter((p) => p.isActive);
  if (!eligible.length) return null;

  let targets: Participant[] = [];

  switch (card.target) {
    case 'random-active': {
      const pick = randomItem(eligible);
      if (!pick) return null;
      targets = [pick];
      break;
    }
    case 'highest-weight': {
      const max = Math.max(...eligible.map((p) => p.baseWeight));
      targets = eligible.filter((p) => p.baseWeight === max);
      break;
    }
    case 'lowest-weight': {
      const min = Math.min(...eligible.map((p) => p.baseWeight));
      targets = eligible.filter((p) => p.baseWeight === min);
      break;
    }
    case 'everyone': {
      targets = eligible;
      break;
    }
    case 'first-place': {
      targets = [];
      break;
    }
    default:
      targets = [];
  }

  const targetIds = targets.map((target) => target.id);
  const names = card.target === 'everyone'
    ? ['Everyone']
    : targets.map((target) => target.name);

  const resolved: ResolvedEvent = {
    card,
    affectedParticipantIds: targetIds,
    summary: '',
  };

  switch (card.type) {
    case 'weight-multiplier':
      resolved.weightMultipliers = targetIds.reduce<Record<string, number>>(
        (acc, id) => {
          acc[id] = card.magnitude;
          return acc;
        },
        {},
      );
      resolved.summary = `${card.title}: ${toSummary(
        names,
        'No one',
      )} ${(card.magnitude >= 1 ? 'boost' : 'penalty')} ×${card.magnitude.toFixed(
        2,
      )}`;
      break;
    case 'ban':
      resolved.bannedParticipantIds = targetIds;
      resolved.summary = `${card.title}: ${toSummary(
        names,
        'No one',
      )} is benched`;
      break;
    case 'score-bonus':
      resolved.scoreBonus = {
        position: 0,
        amount: Math.round(card.magnitude),
      };
      resolved.summary = `${card.title}: First place gains +${Math.round(
        card.magnitude,
      )} pts`;
      break;
    default:
      resolved.summary = card.title;
  }

  return resolved;
}

export function combineEffects(events: ResolvedEvent[]) {
  const weightMultipliers = new Map<string, number>();
  const bannedIds = new Set<string>();
  const scoreBonuses: { position: number; amount: number }[] = [];

  events.forEach((event) => {
    if (event.weightMultipliers) {
      Object.entries(event.weightMultipliers).forEach(([id, multiplier]) => {
        weightMultipliers.set(
          id,
          Number(
            (weightMultipliers.get(id) ?? 1) * multiplier,
          ),
        );
      });
    }

    if (event.bannedParticipantIds) {
      event.bannedParticipantIds.forEach((id) => bannedIds.add(id));
    }

    if (event.scoreBonus) {
      scoreBonuses.push(event.scoreBonus);
    }
  });

  return {
    weightMultipliers,
    bannedIds,
    scoreBonuses,
  };
}

export function applyWeightModifiers(
  participant: Participant,
  weightMultipliers: Map<string, number>,
): number {
  const multiplier = weightMultipliers.get(participant.id) ?? 1;
  return Number((participant.baseWeight * multiplier).toFixed(3));
}
