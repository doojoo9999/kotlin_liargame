import type {EventCard, Participant, ResolvedEvent} from '../types';

const randomItem = <T>(arr: T[]): T | null => {
  if (!arr.length) return null;
  const index = Math.floor(Math.random() * arr.length);
  return arr[index];
};

const formatParticipantNames = (participants: Participant[]) => {
  const names = participants
    .map((participant) => participant.name.trim())
    .filter((name) => name.length > 0);
  return names.length ? names.join(', ') : '이름 미상';
};

const buildSummary = (card: EventCard, targets: Participant[]) => {
  if (!targets.length) {
    return `${card.title}: 제외 대상 없음`;
  }

  if (card.type === 'ban') {
    switch (card.target) {
      case 'random-active': {
        const names = formatParticipantNames(targets);
        return `${card.title}: ${names} (무작위) 제외`;
      }
      case 'lowest-weight': {
        const names = formatParticipantNames(targets);
        return `${card.title}: ${names} (최저 티켓) 제외`;
      }
      case 'everyone': {
        return `${card.title}: ${targets.length}명 전원 제외`;
      }
      default: {
        const names = formatParticipantNames(targets);
        return `${card.title}: ${names} 제외`;
      }
    }
  }

  return card.title;
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
    case 'lowest-weight': {
      const pool =
        card.target === 'lowest-weight' ? findTiedExtremes(eligible, 'min') : eligible;
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
    summary: buildSummary(card, targets),
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
