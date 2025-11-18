import React from 'react'
import {useNavigate, useParams} from 'react-router-dom'
import {useGameplayStore, useGameStore} from '@/stores'
import {useShallow} from 'zustand/react/shallow'
import {GameFlowManager} from '@/components/game/GameFlowManager'
import {Card, CardContent} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {ArrowLeft} from 'lucide-react'
import {gameService} from '@/api/gameApi'
import {ApiError} from '@/api/client'
import {useToast} from '@/hooks/useToast'

export function MainGamePage() {
  const { gameId } = useParams<{ gameId: string }>()
  const navigate = useNavigate()
  const selectGamePageState = useShallow((state: ReturnType<typeof useGameStore.getState>) => ({
    gameNumber: state.gameNumber,
    setGameNumber: state.setGameNumber,
    resetGame: state.resetGame,
    updateFromGameState: state.updateFromGameState,
    leaveGame: state.leaveGame,
  }));

  const { gameNumber, setGameNumber, resetGame, updateFromGameState, leaveGame } = useGameStore(selectGamePageState)
  const { hydrateFromSnapshot } = useGameplayStore((state) => state.actions)
  const { toast } = useToast()
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const handleReturnToLobby = React.useCallback((options?: { skipServer?: boolean }) => {
    const shouldSkipServer = options?.skipServer ?? false
    const currentState = useGameStore.getState()
    const activeGameNumber = currentState.gameNumber ?? gameNumber

    if (!shouldSkipServer && activeGameNumber) {
      void leaveGame().catch((leaveError) => {
        console.error('Failed to leave game in background:', leaveError)
        const description = leaveError instanceof Error ? leaveError.message : '게임에서 나갈 수 없습니다'
        toast({
          title: '게임 나가기 실패',
          description,
          variant: 'destructive',
        })
      })
    }

    resetGame()
    navigate('/lobby', { replace: true })
  }, [gameNumber, leaveGame, navigate, resetGame, toast])

  const handleGameAccessError = React.useCallback((cause: unknown) => {
    let shouldRedirect = false
    let title = '게임을 불러올 수 없습니다'
    let description = '게임 상태를 불러오는 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.'

    if (cause instanceof ApiError) {
      const payload = cause.data ?? null
      const userFriendly = payload && typeof payload['userFriendlyMessage'] === 'string'
        ? String(payload['userFriendlyMessage'])
        : undefined
      const errorCode = payload && typeof payload['errorCode'] === 'string'
        ? String(payload['errorCode'])
        : undefined

      if (cause.status === 404) {
        title = '게임을 찾을 수 없습니다'
        description = userFriendly ?? '게임방이 삭제되었거나 존재하지 않습니다.'
        shouldRedirect = true
      } else if (cause.status === 403) {
        title = '게임에 참여할 수 없습니다'
        if (errorCode === 'PLAYER_NOT_IN_GAME') {
          description = userFriendly ?? '참여 중인 플레이어만 접근할 수 있는 방입니다. 초대나 비밀번호가 필요한 방일 수 있습니다.'
        } else {
          description = userFriendly ?? '이 게임에 접근할 권한이 없습니다.'
        }
        shouldRedirect = true
      } else if (cause.status === 409) {
        title = '게임에 입장할 수 없습니다'
        description = userFriendly ?? '게임이 이미 진행 중이거나 입장 조건을 충족하지 않습니다.'
        shouldRedirect = true
      } else {
        description = userFriendly ?? cause.message
      }
    } else if (cause instanceof Error) {
      description = cause.message
    }

    toast({
      title,
      description,
      variant: 'destructive',
    })

    if (shouldRedirect) {
      handleReturnToLobby({ skipServer: true })
    }

    return { shouldRedirect, message: description }
  }, [toast, handleReturnToLobby])

  // 게임 상태 초기화 및 복원
  React.useEffect(() => {
    const initializeGame = async () => {
      if (!gameId) {
        setIsLoading(false)
        toast({
          title: '잘못된 접근입니다',
          description: '게임 ID가 제공되지 않았습니다.',
          variant: 'destructive',
        })
        handleReturnToLobby({ skipServer: true })
        return
      }

      const gameIdNumber = Number.parseInt(gameId, 10)
      if (Number.isNaN(gameIdNumber)) {
        setIsLoading(false)
        toast({
          title: '잘못된 게임 ID입니다',
          description: '숫자로 된 올바른 게임 번호를 입력해주세요.',
          variant: 'destructive',
        })
        handleReturnToLobby({ skipServer: true })
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
        const result = handleGameAccessError(error)
        if (!result.shouldRedirect) {
          setError(result.message)
        } else {
          setError(null)
        }
        setIsLoading(false)
      }
    }

    initializeGame()
  }, [gameId, gameNumber, handleGameAccessError, handleReturnToLobby, hydrateFromSnapshot, setGameNumber, toast, updateFromGameState])

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
              <Button onClick={() => handleReturnToLobby()}>
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
    <GameFlowManager
      onReturnToLobby={handleReturnToLobby}
      onNextRound={handleNextRound}
    />
  )
}
