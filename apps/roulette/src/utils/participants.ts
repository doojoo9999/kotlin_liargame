import {Participant} from '../types';

interface ParsedEntry {
  name: string;
  weight: number;
}

const NAME_REGEX =
  /^\s*(?<name>[^/*:,]+?)(?:\s*[:/]\s*(?<weight>\d+(?:\.\d+)?))?(?:\s*\*\s*(?<count>\d+))?\s*$/;

export function parseParticipantInput(input: string): ParsedEntry[] {
  const tokens = input
    .split(/[\n,]+/g)
    .map((entry) => entry.trim())
    .filter(Boolean);

  const aggregated = new Map<string, number>();

  for (const token of tokens) {
    const match = token.match(NAME_REGEX);
    if (!match || !match.groups) continue;
    const rawName = match.groups.name.trim();
    if (!rawName) continue;

    const weightValue = match.groups.weight
      ? parseFloat(match.groups.weight)
      : 1;

    const count = match.groups.count ? parseInt(match.groups.count, 10) : 1;

    if (!Number.isFinite(weightValue) || weightValue <= 0) continue;
    if (!Number.isFinite(count) || count <= 0) continue;

    const effectiveWeight = weightValue * count;
    const key = rawName;
    aggregated.set(key, (aggregated.get(key) ?? 0) + effectiveWeight);
  }

  return Array.from(aggregated.entries()).map(([name, weight]) => ({
    name,
    weight,
  }));
}

export function hydrateParticipants(entries: ParsedEntry[]): Participant[] {
  if (!entries.length) return [];

  return entries.map(({ name, weight }, index, arr) => {
    const hue = Math.round((360 / arr.length) * index);
    return {
      id: crypto.randomUUID(),
      name,
      baseWeight: Number(weight.toFixed(2)),
      isActive: true,
      points: 0,
      streak: 0,
      colorHue: hue,
    };
  });
}

export function formatParticipantsForTextarea(participants: Participant[]) {
  return participants.map((p) => `${p.name}/${p.baseWeight.toFixed(2)}`).join('\n');
}

