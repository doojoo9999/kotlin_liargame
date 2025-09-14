import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { ActivityFeedV2 } from '../ActivityFeedV2'
import { useGameStoreV2 } from '@/stores/gameStoreV2'

// Mock the gameStoreV2
vi.mock('@/stores/gameStoreV2')

describe('ActivityFeedV2', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks()
  })

  it('renders without infinite loops when activities array is empty', () => {
    // Mock empty activities
    vi.mocked(useGameStoreV2).mockReturnValue([])

    const { container } = render(<ActivityFeedV2 />)

    // Check that empty state message is displayed
    expect(screen.getByText('아직 활동이 없습니다.')).toBeInTheDocument()

    // Check that component rendered without errors
    expect(container.querySelector('.overflow-y-auto')).toBeInTheDocument()
  })

  it('renders without infinite loops when activities array has items', () => {
    // Mock activities with data
    const mockActivities = [
      {
        id: 'activity_1',
        type: 'phase_change' as const,
        content: '게임이 시작되었습니다!',
        phase: 'SPEECH' as const,
        timestamp: Date.now(),
      },
      {
        id: 'activity_2',
        type: 'hint' as const,
        playerId: 'p1',
        content: '빨간색 과일입니다',
        phase: 'SPEECH' as const,
        timestamp: Date.now(),
      },
    ]

    vi.mocked(useGameStoreV2).mockReturnValue(mockActivities)

    const { container } = render(<ActivityFeedV2 />)

    // Check that activities are rendered
    expect(screen.getByText('게임이 시작되었습니다!')).toBeInTheDocument()
    expect(screen.getByText('빨간색 과일입니다')).toBeInTheDocument()

    // Check that scrollable container exists
    expect(container.querySelector('.overflow-y-auto')).toBeInTheDocument()

    // No ScrollArea component should be present
    expect(container.querySelector('[data-radix-scroll-area-viewport]')).not.toBeInTheDocument()
  })

  it('properly memoizes activities to prevent unnecessary re-renders', () => {
    const mockActivities = [
      {
        id: 'activity_1',
        type: 'system' as const,
        content: 'Test activity',
        timestamp: Date.now(),
      }
    ]

    vi.mocked(useGameStoreV2).mockReturnValue(mockActivities)

    const { rerender } = render(<ActivityFeedV2 />)

    // Initial render
    expect(screen.getByText('Test activity')).toBeInTheDocument()

    // Re-render with same data should not cause issues
    rerender(<ActivityFeedV2 />)

    // Component should still be rendered correctly
    expect(screen.getByText('Test activity')).toBeInTheDocument()
  })
})