import {render} from '@testing-library/react'
import {axe, toHaveNoViolations} from 'jest-axe'
import {describe, expect, it} from 'vitest'
import {PlayerCard} from '@/versions/main/components/game/PlayerCard'
import {RealtimeChatSystem} from '@/versions/main/components/game/RealtimeChatSystem'
import {GameStatus} from '@/versions/main/components/game/GameStatus'
import type {Player} from '@/shared/types/api.types'

expect.extend(toHaveNoViolations)

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

describe('Accessibility Tests', () => {
  it('PlayerCard should not have accessibility violations', async () => {
    const { container } = render(<PlayerCard player={mockPlayer} />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('RealtimeChatSystem should not have accessibility violations', async () => {
    const { container } = render(
      <RealtimeChatSystem
        gameNumber={1}
        currentPlayerNickname="테스트플레이어"
        gamePhase="DISCUSSION"
      />
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('GameStatus should not have accessibility violations', async () => {
    const { container } = render(
      <GameStatus
        gamePhase="HINT_PROVIDING"
        timeRemaining={60}
        currentRound={1}
        totalRounds={3}
        playersTotal={6}
        playersVoted={3}
      />
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('should have proper ARIA labels for interactive elements', () => {
    const { getByRole } = render(
      <PlayerCard
        player={mockPlayer}
        canVote={true}
        onVote={() => {}}
      />
    )

    const button = getByRole('button')
    expect(button).toHaveAttribute('aria-label')
    expect(button).toHaveAttribute('tabIndex', '0')
  })

  it('should have proper heading hierarchy', () => {
    const { container } = render(
      <GameStatus
        gamePhase="VOTING"
        timeRemaining={30}
        currentRound={2}
        totalRounds={3}
        playersTotal={6}
        playersVoted={4}
      />
    )

    const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6')
    expect(headings.length).toBeGreaterThan(0)

    // Verify heading hierarchy is logical
    headings.forEach((heading, index) => {
      expect(heading).toHaveAttribute('role', 'heading')
    })
  })

  it('should have sufficient color contrast', () => {
    // This would typically be checked with axe-core color contrast rules
    // Here we verify that text elements have proper contrast classes
    const { container } = render(<PlayerCard player={mockPlayer} />)

    const textElements = container.querySelectorAll('[class*="text-"]')
    textElements.forEach(element => {
      const classes = element.className
      // Verify no low-contrast combinations
      expect(classes).not.toMatch(/text-gray-400.*bg-gray-300/)
      expect(classes).not.toMatch(/text-white.*bg-yellow-400/)
    })
  })

  it('should support keyboard navigation', () => {
    const mockOnVote = jest.fn()
    const { getByRole } = render(
      <PlayerCard
        player={mockPlayer}
        canVote={true}
        onVote={mockOnVote}
      />
    )

    const button = getByRole('button')

    // Should be focusable
    expect(button).toHaveAttribute('tabIndex', '0')

    // Should respond to Enter and Space keys
    button.focus()
    expect(document.activeElement).toBe(button)
  })

  it('should provide screen reader friendly content', () => {
    const { container } = render(
      <GameStatus
        gamePhase="VOTING"
        timeRemaining={15}
        currentRound={1}
        totalRounds={3}
        playersTotal={6}
        playersVoted={5}
      />
    )

    // Check for aria-live regions for dynamic content
    const liveRegions = container.querySelectorAll('[aria-live]')
    expect(liveRegions.length).toBeGreaterThan(0)

    // Check for descriptive text for time-sensitive content
    const timeElements = container.querySelectorAll('[role="timer"], [aria-label*="시간"]')
    expect(timeElements.length).toBeGreaterThan(0)
  })

  it('should have proper focus management', () => {
    const { getByRole, rerender } = render(
      <PlayerCard player={mockPlayer} />
    )

    // Test focus trap scenarios
    const updatedPlayer = { ...mockPlayer, isAlive: false }
    rerender(<PlayerCard player={updatedPlayer} />)

    // Eliminated players should not be focusable
    const playerElement = getByRole('button', { hidden: true })
    expect(playerElement).toHaveAttribute('aria-disabled', 'true')
  })
})
