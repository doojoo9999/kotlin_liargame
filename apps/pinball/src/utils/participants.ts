interface ParsedEntry {
  name: string
  count: number
}

export const PARTICIPANT_ENTRY_REGEX =
  /^\s*(?<name>[^*,/:]+(?:\s[^*,/:]+)*)\s*(?:\*\s*(?<count>\d+))?\s*$/

export function parseParticipantInput(input: string): ParsedEntry[] {
  const tokens = input
    .split(/[\n,]+/g)
    .map((entry) => entry.trim())
    .filter(Boolean)

  const aggregated = new Map<string, ParsedEntry>()

  for (const token of tokens) {
    const match = token.match(PARTICIPANT_ENTRY_REGEX)
    if (!match || !match.groups) continue

    const rawName = match.groups.name.trim()
    if (!rawName) continue

    const countRaw = match.groups.count ? parseInt(match.groups.count, 10) : 1
    const parsedCount = Number.isFinite(countRaw) && countRaw > 0 ? countRaw : 1

    const existing = aggregated.get(rawName)
    if (existing) {
      aggregated.set(rawName, {
        name: rawName,
        count: existing.count + parsedCount,
      })
    } else {
      aggregated.set(rawName, {
        name: rawName,
        count: parsedCount,
      })
    }
  }

  return Array.from(aggregated.values())
}
