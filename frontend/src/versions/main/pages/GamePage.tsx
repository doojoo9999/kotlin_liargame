import React from 'react'
import {useNavigate, useParams} from 'react-router-dom'
import {useGameplayStore, useGameStore} from '@/stores'
import {GameFlowManager} from '@/components/game/GameFlowManager'
import {Card, CardContent} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {ArrowLeft} from 'lucide-react'
import {gameService} from '@/api/gameApi'
import {useToast} from '@/hooks/useToast'

export function MainGamePage() {
  const { gameId } = useParams<{ gameId: string }>()
  const navigate = useNavigate()
  const { gameNumber, setGameNumber, resetGame, updateFromGameState } = useGameStore()
  const { hydrateFromSnapshot } = useGameplayStore((state) => state.actions)
  const { toast } = useToast()
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  // 게임 상태 초기화 및 복원
  React.useEffect(() => {
    const initializeGame = async () => {
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

        // Store에 게임 번호가 없거나 다른 게임인 경우
        if (!gameNumber || gameNumber !== gameIdNumber) {
          // 게임 상태를 서버에서 가져와서 복원
          const gameState = await gameService.getGameState(gameIdNumber)

          // Store 업데이트
          setGameNumber(gameIdNumber)
          updateFromGameState(gameState)
          hydrateFromSnapshot(gameState)

          console.log('Game state restored:', gameState)
        }

        setIsLoading(false)
      } catch (error) {
        console.error('Failed to initialize game:', error)
        setError(error instanceof Error ? error.message : '게임을 불러올 수 없습니다')
        setIsLoading(false)

        // 게임을 찾을 수 없는 경우 토스트 메시지 표시
        toast({
          title: "게임을 찾을 수 없습니다",
          description: "게임이 존재하지 않거나 종료되었습니다",
          variant: "destructive",
        })
      }
    }

    initializeGame()
  }, [gameId, gameNumber, setGameNumber, updateFromGameState, hydrateFromSnapshot, toast])

  const handleReturnToLobby = () => {
    resetGame()
    navigate('/lobby')
  }

  const handleNextRound = () => {
    // 다음 라운드 로직은 백엔드에서 처리되므로 여기서는 별도 작업 불필요
    console.log('Next round requested')
  }

  // 로딩 중 표시
  if (isLoading) {
    return (
      <div className="container mx-auto p-4 max-w-2xl">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <div className="text-lg font-medium">게임을 불러오는 중...</div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 에러 또는 게임을 찾을 수 없는 경우
  if (error || !gameNumber) {
    return (
      <div className="container mx-auto p-4 max-w-2xl">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <div className="text-lg font-medium mb-4">{error || '게임을 찾을 수 없습니다'}</div>
              <Button onClick={() => navigate('/lobby')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                로비로 돌아가기
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 헤더 */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReturnToLobby}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                나가기
              </Button>
              <div>
                <div className="font-semibold">라이어 게임</div>
                <div className="text-sm text-muted-foreground">
                  게임 #{gameNumber}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 게임 플로우 매니저 */}
      <GameFlowManager
        onReturnToLobby={handleReturnToLobby}
        onNextRound={handleNextRound}
      />
    </div>
  )
}