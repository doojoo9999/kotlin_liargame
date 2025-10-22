import type {EventCard, Participant, ResolvedEvent} from '../types';

const randomItem = <T>(arr: T[]): T | null => {
  if (!arr.length) return null;
  const index = Math.floor(Math.random() * arr.length);
  return arr[index];
};

const findTiedExtremes = (eligible: Participant[], mode: 'max' | 'min') => {
  if (!eligible.length) return eligible;
  const values = eligible.map((p) => p.entryCount || 0);
  const target = mode === 'max' ? Math.max(...values) : Math.min(...values);
  const matches = eligible.filter((p) => p.entryCount === target);
  if (matches.length === eligible.length) {
    return eligible;
  }
  return matches;
};

export function resolveEvent(
  card: EventCard,
  participants: Participant[],
): ResolvedEvent | null {
  const eligible = participants.filter((p) => p.isActive);
  if (!eligible.length) return null;

  let targets: Participant[] = [];

  switch (card.target) {
    case 'random-active':
    case 'highest-weight':
    case 'lowest-weight': {
      const pool =
        card.target === 'highest-weight'
          ? findTiedExtremes(eligible, 'max')
          : card.target === 'lowest-weight'
            ? findTiedExtremes(eligible, 'min')
            : eligible;
      const pick = randomItem(pool);
      if (!pick) return null;
      targets = [pick];
      break;
    }
    case 'everyone': {
      targets = eligible;
      break;
    }
    default:
      targets = [];
  }

  const targetIds = targets.map((target) => target.id);
  const resolved: ResolvedEvent = {
    card,
    affectedParticipantIds: targetIds,
    summary: card.title,
  };

  if (card.type === 'ban') {
    resolved.bannedParticipantIds = targetIds;
  }

  return resolved;
}

export function combineEffects(events: ResolvedEvent[]) {
  const bannedIds = new Set<string>();

  events.forEach((event) => {
    if (event.bannedParticipantIds) {
      event.bannedParticipantIds.forEach((id) => bannedIds.add(id));
    }
  });

  return {
    bannedIds,
  };
}
