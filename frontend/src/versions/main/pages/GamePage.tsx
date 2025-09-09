import React from 'react'
import {useNavigate, useParams} from 'react-router-dom'
import {useGameStore} from '@/store/gameStore'
import {GameFlowManager} from '@/components/game/GameFlowManager'
import {Card, CardContent} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {ArrowLeft} from 'lucide-react'

export function MainGamePage() {
  const { roomId } = useParams<{ roomId: string }>()
  const navigate = useNavigate()
  const { gameNumber, resetGame } = useGameStore()

  // 게임 번호가 없으면 로비로 이동
  React.useEffect(() => {
    if (!gameNumber && roomId) {
      // roomId를 통해 게임 상태를 복원하거나 로비로 이동
      navigate('/lobby')
    }
  }, [gameNumber, roomId, navigate])

  const handleReturnToLobby = () => {
    resetGame()
    navigate('/lobby')
  }

  const handleNextRound = () => {
    // 다음 라운드 로직은 백엔드에서 처리되므로 여기서는 별도 작업 불필요
    console.log('Next round requested')
  }

  if (!gameNumber) {
    return (
      <div className="container mx-auto p-4 max-w-2xl">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <div className="text-lg font-medium mb-4">게임을 찾을 수 없습니다</div>
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