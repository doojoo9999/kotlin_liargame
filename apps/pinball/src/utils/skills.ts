import type {ResolvedSkill, SkillCard, SkillContext} from '../types'

export const buildResolvedSkillId = (cardId: string, participantId?: string) =>
  participantId ? `${cardId}:${participantId}` : cardId

const rarityWeight = (rarity: SkillCard['rarity']) => (rarity === 'rare' ? 0.45 : 1)

export const drawSkillCards = (
  deck: SkillCard[],
  context: SkillContext,
  count: number,
): ResolvedSkill[] => {
  const usedIds = new Set<string>()
  const resolved: ResolvedSkill[] = []
  let guard = 0

  while (resolved.length < count && guard < deck.length * 4) {
    guard += 1
    const totalWeight = deck.reduce((sum, card) => sum + rarityWeight(card.rarity), 0)
    if (totalWeight <= 0) break

    const threshold = Math.random() * totalWeight
    let cumulative = 0
    let selected: SkillCard | null = null

    for (const card of deck) {
      cumulative += rarityWeight(card.rarity)
      if (threshold <= cumulative) {
        selected = card
        break
      }
    }

    if (!selected) continue
    if (usedIds.has(selected.id)) continue

    const resolvedCard = selected.apply(context)
    if (!resolvedCard) continue

    resolved.push(resolvedCard)
    usedIds.add(selected.id)
  }

  return resolved
}
