import {useEffect, useState} from 'react'
import {useNavigate, useParams} from 'react-router-dom'
import {motion} from 'framer-motion'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {Crown, Home, Medal, RotateCcw, Share2, Star, Target, Trophy} from 'lucide-react'
import {useToast} from '@/hooks/useToast'
import {useGameStore} from '@/stores'
import {useShallow} from 'zustand/react/shallow'

interface PlayerScore {
  id: string
  nickname: string
  totalScore: number
  roundScores: number[]
  roundsWon: number
  timesLiar: number
  timesDetected: number
  timesEvaded: number
  rank: number
  isCurrentUser?: boolean
}

export function MainResultsPage() {
  const { gameId } = useParams<{ gameId: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const selectGameStore = useShallow((state: ReturnType<typeof useGameStore.getState>) => ({
    gameNumber: state.gameNumber,
    leaveGame: state.leaveGame,
    resetGame: state.resetGame,
  }))
  const { gameNumber, leaveGame, resetGame } = useGameStore(selectGameStore)

  // Game results state - will be fetched from API
  const [gameResults, setGameResults] = useState<{
    isComplete: boolean
    totalRounds: number
    winner: string
    players: PlayerScore[]
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch game results from API
  useEffect(() => {
    const fetchGameResults = async () => {
      if (!gameId) {
        toast({
          title: "Invalid game ID",
          description: "Game ID is required to view results",
          variant: "destructive",
        })
        navigate('/lobby')
        return
      }

      try {
        setIsLoading(true)
        // TODO: Replace with actual API endpoint
        const response = await fetch(`/api/game/${gameId}/results`)

        if (!response.ok) {
          throw new Error('Failed to fetch game results')
        }

        const results = await response.json()
        setGameResults(results)
      } catch (error) {
        console.error('Failed to fetch game results:', error)
        toast({
          title: "Failed to load results",
          description: "Could not load game results. Please try again.",
          variant: "destructive",
        })
        // Fallback: redirect to lobby
        navigate('/lobby')
      } finally {
        setIsLoading(false)
      }
    }

    fetchGameResults()
  }, [gameId, navigate, toast])

  const handlePlayAgain = () => {
    // 같은 게임으로 돌아가기 (새 라운드 시작)
    navigate(`/game/${gameId}`)
    toast({
      title: "새 게임을 시작합니다",
      description: "같은 방에서 새로운 게임이 시작됩니다",
    })
  }

  const handleReturnToLobby = () => {
    void (async () => {
      try {
        if (gameNumber) {
          await leaveGame()
        } else {
          resetGame()
        }
        navigate('/lobby')
        toast({
          title: "로비로 돌아갑니다",
          description: "다른 게임방을 찾거나 새로 만들 수 있습니다",
        })
      } catch (error) {
        const description = error instanceof Error ? error.message : '게임에서 나갈 수 없습니다'
        toast({
          title: "게임 나가기 실패",
          description,
          variant: 'destructive',
        })
      }
    })()
  }

  const handleShareResults = () => {
    // 결과 공유 기능
    const resultText = `라이어 게임 결과!\n🏆 우승자: ${gameResults.winner}\n📊 총 ${gameResults.totalRounds}라운드`

    if (navigator.share) {
      navigator.share({
        title: '라이어 게임 결과',
        text: resultText,
      }).catch(() => {
        // 공유 실패 시 클립보드에 복사
        navigator.clipboard.writeText(resultText)
        toast({
          title: "결과가 복사되었습니다",
          description: "클립보드에 게임 결과가 복사되었습니다",
        })
      })
    } else {
      navigator.clipboard.writeText(resultText)
      toast({
        title: "결과가 복사되었습니다",
        description: "클립보드에 게임 결과가 복사되었습니다",
      })
    }
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />
      case 3:
        return <Star className="h-5 w-5 text-amber-600" />
      default:
        return <Target className="h-5 w-5 text-muted-foreground" />
    }
  }

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">1위</Badge>
      case 2:
        return <Badge className="bg-gray-400 hover:bg-gray-500">2위</Badge>
      case 3:
        return <Badge className="bg-amber-600 hover:bg-amber-700">3위</Badge>
      default:
        return <Badge variant="outline">{rank}위</Badge>
    }
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading game results...</p>
        </div>
      </div>
    )
  }

  // Show error state if no data
  if (!gameResults) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Failed to load game results</p>
          <Button onClick={handleReturnToLobby}>
            <Home className="mr-2 h-4 w-4" />
            Return to Lobby
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto p-6 space-y-6">
        {/* 헤더 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <Trophy className="h-8 w-8 text-yellow-500" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              게임 결과
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">
            {gameResults.totalRounds}라운드 게임이 완료되었습니다!
          </p>
        </motion.div>

        {/* 우승자 카드 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="border-yellow-200 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl flex items-center justify-center gap-2">
                <Crown className="h-6 w-6 text-yellow-500" />
                🎉 우승자: {gameResults.winner} 🎉
              </CardTitle>
            </CardHeader>
          </Card>
        </motion.div>

        {/* 최종 순위 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="space-y-4"
        >
          <h2 className="text-2xl font-bold text-center">최종 순위</h2>
          <div className="space-y-3">
            {gameResults.players.map((player, index) => (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
              >
                <Card className={`${player.isCurrentUser ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {getRankIcon(player.rank)}
                        <div>
                          <h3 className="font-semibold text-lg">
                            {player.nickname}
                            {player.isCurrentUser && (
                              <Badge variant="outline" className="ml-2">나</Badge>
                            )}
                          </h3>
                          <p className="text-muted-foreground">
                            총 점수: {player.totalScore}점
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {getRankBadge(player.rank)}
                        <div className="text-sm text-muted-foreground mt-2">
                          승리: {player.roundsWon}회
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* 게임 통계 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="grid gap-4 md:grid-cols-3"
        >
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-sm font-medium">총 라운드</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-3xl font-bold">{gameResults.totalRounds}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-sm font-medium">플레이어 수</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-3xl font-bold">{gameResults.players.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-sm font-medium">최고 점수</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-3xl font-bold">
                {Math.max(...gameResults.players.map(p => p.totalScore))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* 액션 버튼 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.0 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6"
        >
          <Button
            size="lg"
            onClick={handlePlayAgain}
            className="w-full sm:w-auto"
          >
            <RotateCcw className="mr-2 h-5 w-5" />
            한판 더
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={handleReturnToLobby}
            className="w-full sm:w-auto"
          >
            <Home className="mr-2 h-5 w-5" />
            로비로 돌아가기
          </Button>

          <Button
            variant="secondary"
            size="lg"
            onClick={handleShareResults}
            className="w-full sm:w-auto"
          >
            <Share2 className="mr-2 h-5 w-5" />
            결과 공유
          </Button>
        </motion.div>
      </div>
    </div>
  )
}
