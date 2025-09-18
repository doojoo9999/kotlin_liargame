import { useEffect } from 'react'
import { useAuthStore, useNemonemoStore } from '../../stores'

export function NemonemoDashboardPage(): JSX.Element {
  const puzzles = useNemonemoStore((state) => state.puzzles)
  const isLoading = useNemonemoStore((state) => state.isLoading)
  const error = useNemonemoStore((state) => state.error)
  const fetchPuzzles = useNemonemoStore((state) => state.fetchPuzzles)
  const startSession = useNemonemoStore((state) => state.startSession)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  useEffect(() => {
    void fetchPuzzles({ page: 0, size: 12 })
  }, [fetchPuzzles])

  const handlePlayClick = (puzzleId: number) => {
    if (!isAuthenticated) {
      console.warn('Attempted to start session without authentication')
      return
    }

    void startSession(puzzleId)
  }

  return (
    <section className="nemonemo-dashboard">
      <header>
        <h1>Nemonemo Weekly Highlights</h1>
        <p>Preview the latest puzzles and resume your progress.</p>
      </header>

      {isLoading && <p>Loading puzzles…</p>}

      {error && (
        <div role="alert">
          <p>Failed to load puzzles.</p>
          <pre>{error}</pre>
        </div>
      )}

      {!isAuthenticated && !isLoading && (
        <p>Please sign in through the Liar Game account flow to start a puzzle.</p>
      )}

      <div className="puzzle-grid">
        {puzzles.map((puzzle) => (
          <article key={puzzle.id} className="puzzle-card">
            <h2>{puzzle.title}</h2>
            <p>
              {puzzle.width}×{puzzle.height} · {puzzle.difficulty}
            </p>
            <p>Est. {puzzle.estimatedMinutes} min</p>
            <button type="button" onClick={() => handlePlayClick(puzzle.id)}>
              Play
            </button>
          </article>
        ))}
      </div>
    </section>
  )
}

export default NemonemoDashboardPage
