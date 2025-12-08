import type {Participant} from "../types";

export type PartyTargetConfig = {
  damageTarget: number;
  buffTarget: number;
};

export type AutoAssignResult = {
  assignments: Array<{participantId: string; partyNumber: number | null; slotIndex: number | null}>;
  usedCount: number;
  duplicateAdventureCount: number;
  unplacedCount: number;
};

type PartyState = {
  partyNumber: number;
  members: Participant[];
  sumDamage: number;
  sumBuff: number;
  target: PartyTargetConfig;
};

const BUFF_SCORE_WEIGHT = 8;

const scoreParticipant = (participant: Participant) =>
  participant.damage + participant.buffPower * BUFF_SCORE_WEIGHT;

const selectBetterParticipant = (a: Participant, b: Participant) => {
  const aScore = scoreParticipant(a);
  const bScore = scoreParticipant(b);
  if (aScore === bScore) {
    return a.buffPower >= b.buffPower ? a : b;
  }
  return aScore > bScore ? a : b;
};

const normalizeTargets = (targets: PartyTargetConfig[], partyCount: number): PartyTargetConfig[] => {
  const fallback = targets[0] ?? {damageTarget: 1, buffTarget: 1};
  return Array.from({length: partyCount}, (_, idx) => {
    const target = targets[idx] ?? fallback;
    const safeDamage = target.damageTarget > 0 ? target.damageTarget : 1;
    const safeBuff = target.buffTarget > 0 ? target.buffTarget : 1;
    return {damageTarget: safeDamage, buffTarget: safeBuff};
  });
};

const assignToParty = (party: PartyState, participant: Participant) => {
  party.members.push(participant);
  party.sumDamage += participant.damage;
  party.sumBuff += participant.buffPower;
};

const evaluateFit = (party: PartyState, participant: Participant, slotsPerParty: number) => {
  const nextCount = party.members.length + 1;
  const nextDamageAvg = (party.sumDamage + participant.damage) / nextCount;
  const nextBuffAvg = (party.sumBuff + participant.buffPower) / nextCount;
  const targetDamage = Math.max(party.target.damageTarget, 1);
  const targetBuff = Math.max(party.target.buffTarget, 1);

  const damageDiff = Math.abs(nextDamageAvg - targetDamage) / targetDamage;
  const buffDiff = Math.abs(nextBuffAvg - targetBuff) / targetBuff;
  const loadPenalty = party.members.length / slotsPerParty;

  return damageDiff + buffDiff + loadPenalty * 0.1;
};

export function autoAssignParticipants(options: {
  participants: Participant[];
  partyCount: number;
  slotsPerParty: number;
  targets: PartyTargetConfig[];
}): AutoAssignResult {
  const {participants, partyCount, slotsPerParty, targets} = options;
  if (partyCount <= 0 || slotsPerParty <= 0 || participants.length === 0) {
    return {
      assignments: participants.map((p) => ({participantId: p.id, partyNumber: null, slotIndex: null})),
      usedCount: 0,
      duplicateAdventureCount: 0,
      unplacedCount: participants.length,
    };
  }

  const safeTargets = normalizeTargets(targets, partyCount);

  // 모험단 단위 중복 제거: 한 기수에 동일 모험단은 1명만 배치
  const adventureMap = new Map<string, Participant>();
  let duplicateAdventureCount = 0;

  participants.forEach((participant) => {
    const raw = participant.character.adventureName?.trim().toLowerCase();
    const key = raw && raw.length > 0 ? `adv:${raw}` : `char:${participant.character.characterId}`;
    const existing = adventureMap.get(key);
    if (!existing) {
      adventureMap.set(key, participant);
      return;
    }
    const better = selectBetterParticipant(existing, participant);
    if (better.id !== existing.id) {
      duplicateAdventureCount += 1;
      adventureMap.set(key, better);
    } else {
      duplicateAdventureCount += 1;
    }
  });

  const uniqueParticipants = Array.from(adventureMap.values());

  const parties: PartyState[] = Array.from({length: partyCount}, (_, idx) => ({
    partyNumber: idx + 1,
    members: [],
    sumDamage: 0,
    sumBuff: 0,
    target: safeTargets[idx],
  }));

  const usedIds = new Set<string>();

  // 1) 우선 버퍼를 각 파티에 한 명씩 배치하려 시도
  const bufferCandidates = uniqueParticipants
    .filter((p) => p.buffPower > 0)
    .sort((a, b) => b.buffPower - a.buffPower || scoreParticipant(b) - scoreParticipant(a));

  parties.forEach((party) => {
    if (party.members.length >= slotsPerParty) return;
    const buffer = bufferCandidates.find((candidate) => !usedIds.has(candidate.id));
    if (buffer) {
      assignToParty(party, buffer);
      usedIds.add(buffer.id);
    }
  });

  // 2) 남은 인원 배치
  const remainingCandidates = uniqueParticipants
    .filter((p) => !usedIds.has(p.id))
    .sort((a, b) => scoreParticipant(b) - scoreParticipant(a));

  remainingCandidates.forEach((candidate) => {
    let bestParty: PartyState | null = null;
    let bestScore = Number.POSITIVE_INFINITY;

    parties.forEach((party) => {
      if (party.members.length >= slotsPerParty) return;
      const fit = evaluateFit(party, candidate, slotsPerParty);
      if (
        fit < bestScore - 1e-6 ||
        (Math.abs(fit - bestScore) < 1e-6 && party.members.length < (bestParty?.members.length ?? Infinity))
      ) {
        bestParty = party;
        bestScore = fit;
      }
    });

    if (bestParty) {
      assignToParty(bestParty, candidate);
      usedIds.add(candidate.id);
    }
  });

  const assignmentMap = new Map<string, {partyNumber: number | null; slotIndex: number | null}>();

  parties.forEach((party) => {
    party.members.forEach((member, idx) => {
      assignmentMap.set(member.id, {partyNumber: party.partyNumber, slotIndex: idx});
    });
  });

  participants.forEach((participant) => {
    if (!assignmentMap.has(participant.id)) {
      assignmentMap.set(participant.id, {partyNumber: null, slotIndex: null});
    }
  });

  const assignments = participants.map((participant) => {
    const assignment = assignmentMap.get(participant.id);
    return {
      participantId: participant.id,
      partyNumber: assignment?.partyNumber ?? null,
      slotIndex: assignment?.slotIndex ?? null,
    };
  });

  const usedCount = assignments.filter((assignment) => assignment.partyNumber !== null).length;
  const unplacedCount = participants.length - usedCount;

  return {
    assignments,
    usedCount,
    duplicateAdventureCount,
    unplacedCount,
  };
}
