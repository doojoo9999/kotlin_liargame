import { useMemo } from 'react'

export default function usePlayersDistribution(players) {
  return useMemo(() => {
    if (!players || players.length === 0) {
      return { top: [], right: [], bottom: [], left: [] }
    }

    const playerCount = players.length

    const calculate = (count) => {
      if (count <= 3) {
        return { top: 1, right: 1, bottom: 1, left: 0 }
      } else if (count <= 4) {
        return { top: 1, right: 1, bottom: 1, left: 1 }
      } else if (count <= 8) {
        const perSide = Math.floor(count / 4)
        const remainder = count % 4
        return {
          top: perSide + (remainder > 0 ? 1 : 0),
          right: perSide + (remainder > 1 ? 1 : 0),
          bottom: perSide + (remainder > 2 ? 1 : 0),
          left: perSide,
        }
      } else {
        const perSide = Math.floor(count / 4)
        const remainder = count % 4
        return {
          top: perSide + (remainder > 0 ? 1 : 0),
          right: perSide + (remainder > 1 ? 1 : 0),
          bottom: perSide + (remainder > 2 ? 1 : 0),
          left: perSide + (remainder > 3 ? 1 : 0),
        }
      }
    }

    const distribution = calculate(playerCount)
    const positions = { top: [], right: [], bottom: [], left: [] }

    let index = 0
    for (let i = 0; i < distribution.top; i++) if (index < playerCount) positions.top.push(players[index++])
    for (let i = 0; i < distribution.right; i++) if (index < playerCount) positions.right.push(players[index++])
    for (let i = 0; i < distribution.bottom; i++) if (index < playerCount) positions.bottom.push(players[index++])
    for (let i = 0; i < distribution.left; i++) if (index < playerCount) positions.left.push(players[index++])

    return positions
  }, [players])
}
