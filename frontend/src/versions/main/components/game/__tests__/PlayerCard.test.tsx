import {fireEvent, render, screen} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {PlayerCard} from '@/versions/main/components/game/PlayerCard'
import type {Player} from '@/shared/types/api.types'

const mockPlayer: Player = {
  id: 1,
  userId: 1,
  nickname: "테스트플레이어",
  isHost: false,
  isAlive: true,
  role: 'CITIZEN',
  joinedAt: new Date().toISOString(),
  votesReceived: 0,
  hasVoted: false,
  hasProvidedHint: false
}

const mockLiarPlayer: Player = {
  ...mockPlayer,
  id: 2,
  userId: 2,
  nickname: "라이어플레이어",
  role: 'LIAR'
}

describe('PlayerCard', () => {
  const mockOnVote = vi.fn()

  beforeEach(() => {
    mockOnVote.mockClear()
  })

  it('renders player information correctly', () => {
    render(<PlayerCard player={mockPlayer} />)

    expect(screen.getByText('테스트플레이어')).toBeInTheDocument()
    expect(screen.getByText('TE')).toBeInTheDocument() // Avatar fallback
  })

  it('shows host badge when player is host', () => {
    const hostPlayer = { ...mockPlayer, isHost: true }
    render(<PlayerCard player={hostPlayer} />)

    expect(screen.getByText('방장')).toBeInTheDocument()
  })

  it('shows current player indicator', () => {
    render(<PlayerCard player={mockPlayer} isCurrentPlayer={true} />)

    const playerCard = screen.getByRole('button') || screen.getByText('테스트플레이어').closest('div')
    expect(playerCard).toHaveClass('ring-2', 'ring-primary')
  })

  it('shows role when showRole is true', () => {
    render(<PlayerCard player={mockLiarPlayer} showRole={true} />)

    expect(screen.getByText('라이어')).toBeInTheDocument()
  })

  it('calls onVote when clicked and voting is enabled', () => {
    render(
      <PlayerCard
        player={mockPlayer}
        canVote={true}
        onVote={mockOnVote}
      />
    )

    const playerCard = screen.getByRole('button') || screen.getByText('테스트플레이어').closest('div')
    fireEvent.click(playerCard!)

    expect(mockOnVote).toHaveBeenCalledWith(1)
  })

  it('does not call onVote for current player', () => {
    render(
      <PlayerCard
        player={mockPlayer}
        isCurrentPlayer={true}
        canVote={true}
        onVote={mockOnVote}
      />
    )

    const playerCard = screen.getByRole('button') || screen.getByText('테스트플레이어').closest('div')
    fireEvent.click(playerCard!)

    expect(mockOnVote).not.toHaveBeenCalled()
  })

  it('shows vote count when player has received votes', () => {
    const votedPlayer = { ...mockPlayer, votesReceived: 3 }
    render(<PlayerCard player={votedPlayer} />)

    expect(screen.getByText('3표')).toBeInTheDocument()
  })

  it('shows voting completion status', () => {
    const votedPlayer = { ...mockPlayer, hasVoted: true }
    render(<PlayerCard player={votedPlayer} />)

    expect(screen.getByText('✓ 투표완료')).toBeInTheDocument()
  })

  it('applies eliminated styling when player is not alive', () => {
    const eliminatedPlayer = { ...mockPlayer, isAlive: false }
    render(<PlayerCard player={eliminatedPlayer} />)

    const playerCard = screen.getByText('테스트플레이어').closest('div')
    expect(playerCard).toHaveClass('opacity-50', 'grayscale')
  })

  it('shows selection state when isSelected is true', () => {
    render(<PlayerCard player={mockPlayer} isSelected={true} />)

    const playerCard = screen.getByText('테스트플레이어').closest('div')
    expect(playerCard).toHaveClass('ring-2', 'ring-blue-500')
  })
})
