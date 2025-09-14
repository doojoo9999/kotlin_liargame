import React from 'react'
import {useNavigate, useParams} from 'react-router-dom'
import {useGameStoreV2} from '@/stores/gameStoreV2'
import {useGameStore} from '@/stores'
import {GameFlowManagerV2} from '@/components/gameV2/GameFlowManager'
import {Button} from '@/components/ui/button'
import {Card, CardContent} from '@/components/ui/card'
import {gameService} from '@/api/gameApi'
import {useToast} from '@/hooks/useToast'
import {ArrowLeft} from 'lucide-react'

export function MainGamePageV2() {
  const { gameId } = useParams<{ gameId: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const storeGameId = useGameStoreV2(state => state.gameId)
  const initialize = useGameStoreV2(state => state.initialize)
  const { updateFromGameState } = useGameStore()
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const loadGameData = async () => {
      if (!gameId) {
        setError('게임 ID가 없습니다')
        setIsLoading(false)
        return
      }

      const gameIdNumber = parseInt(gameId)
      if (isNaN(gameIdNumber)) {
        setError('잘못된 게임 ID입니다')
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        // Load actual game state from backend
        const gameState = await gameService.getGameState(gameIdNumber)

        // Update the unified game store with real data
        updateFromGameState(gameState)

        // Initialize V2 store with real player data
        if (gameState.players && gameState.players.length > 0) {
          const players = gameState.players.map(p => ({
            id: p.userId.toString(),
            nickname: p.nickname
          }))

          // Use actual game data instead of dummy data
          initialize(
            gameId,
            players,
            gameState.currentSubject || '대기 중',
            gameState.gameTotalRounds || 3
          )
        }

        setIsLoading(false)
      } catch (error) {
        console.error('Failed to load game data:', error)
        setError(error instanceof Error ? error.message : '게임을 불러올 수 없습니다')
        setIsLoading(false)

        toast({
          title: "게임을 찾을 수 없습니다",
          description: "게임이 존재하지 않거나 종료되었습니다",
          variant: "destructive",
        })
      }
    }

    if (!storeGameId && gameId) {
      loadGameData()
    }
  }, [gameId, storeGameId, initialize, updateFromGameState, toast])

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto p-4 max-w-2xl">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <div className="text-lg font-medium">게임 데이터를 불러오는 중...</div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error state
  if (error || !gameId) {
    return (
      <div className="container mx-auto p-4 max-w-2xl">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <div className="text-lg font-medium mb-4">{error || '잘못된 접근입니다'}</div>
              <Button onClick={() => navigate('/lobby')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                로비로 이동
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <GameFlowManagerV2 />
}