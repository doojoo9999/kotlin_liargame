export interface WeightedEntry<T> {
  item: T;
  weight: number;
}

export function weightedRandom<T>(entries: WeightedEntry<T>[]): T | null {
  const positiveEntries = entries.filter((entry) => entry.weight > 0);
  if (!positiveEntries.length) return null;

  const total = positiveEntries.reduce((sum, entry) => sum + entry.weight, 0);
  const threshold = Math.random() * total;
  let cumulative = 0;

  for (const entry of positiveEntries) {
    cumulative += entry.weight;
    if (threshold <= cumulative) {
      return entry.item;
    }
  }

  return positiveEntries[positiveEntries.length - 1].item;
}

