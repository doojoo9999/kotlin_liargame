import * as React from "react"
import {AnimatePresence, motion} from "framer-motion"
import {useNavigate, useParams} from "react-router-dom"
import {Copy, Crown, LogOut, Play, Settings, Users} from "lucide-react"
import {useMutation, useQuery} from "@tanstack/react-query"
import {GameScreenLayout} from "@/versions/main/components/layout"
import {ChatSystem, PlayerCard} from "@/versions/main/components/game"
import {Button} from "@/versions/main/components/ui/button"
import {Card, CardContent, CardHeader, CardTitle} from "@/versions/main/components/ui/card"
import {Badge} from "@/versions/main/components/ui/badge"
import {Separator} from "@/versions/main/components/ui/separator"
import {staggerContainer, staggerItem} from "@/versions/main/animations"
import {useGame} from "@/versions/main/providers/GameProvider"
import {useNotification} from "@/versions/main/providers/NotificationProvider"
import type {ChatMessage, Player} from "@/shared/types/api.types"

interface GameRoom {
  id: number
  title: string
  hostUserId: number
  status: 'WAITING' | 'IN_PROGRESS' | 'FINISHED'
  gameParticipants: number
  gameLiarCount: number
  gameTotalRounds: number
  gameMode: 'LIARS_KNOW' | 'LIARS_DIFFERENT_WORD'
  targetPoints: number
  createdAt: string
  players: Player[]
}

export default function MainGameRoomPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const navigate = useNavigate()
  const { state, actions } = useGame()
  const { addNotification } = useNotification()

  const [chatMessages, setChatMessages] = React.useState<ChatMessage[]>([])
  const currentUserId = 1 // TODO: 실제 사용자 ID로 교체

  const { data: gameRoom, isLoading } = useQuery({
    queryKey: ['gameRoom', roomId],
    queryFn: async () => {
      // TODO: 실제 API 호출로 교체
      return mockGameRoom
    },
    refetchInterval: 2000, // 2초마다 업데이트
  })

  const startGameMutation = useMutation({
    mutationFn: async () => {
      // TODO: 게임 시작 API 호출
      await new Promise(resolve => setTimeout(resolve, 1000))
    },
    onSuccess: () => {
      addNotification({
        type: 'success',
        title: '게임 시작!',
        message: '게임이 시작되었습니다.'
      })
      navigate(`/main/game/${roomId}`)
    },
    onError: () => {
      addNotification({
        type: 'error',
        title: '게임 시작 실패',
        message: '게임을 시작할 수 없습니다.'
      })
    }
  })

  const leaveGameMutation = useMutation({
    mutationFn: async () => {
      // TODO: 게임 나가기 API 호출
      await new Promise(resolve => setTimeout(resolve, 500))
    },
    onSuccess: () => {
      navigate('/main/lobby')
    }
  })

  const isHost = gameRoom?.hostUserId === currentUserId
  const canStartGame = isHost && gameRoom?.players.length >= 4
  const currentPlayer = gameRoom?.players.find(p => p.userId === currentUserId)

  const handleStartGame = () => {
    if (canStartGame) {
      startGameMutation.mutate()
    }
  }

  const handleLeaveGame = () => {
    leaveGameMutation.mutate()
  }

  const handleSendMessage = (message: string) => {
    const newMessage: ChatMessage = {
      id: Date.now(),
      gameNumber: parseInt(roomId || '0'),
      playerNickname: currentPlayer?.nickname || '익명',
      content: message,
      timestamp: new Date().toISOString(),
      type: 'DISCUSSION'
    }
    setChatMessages(prev => [...prev, newMessage])
  }

  const handleCopyRoomId = () => {
    navigator.clipboard.writeText(roomId || '')
    addNotification({
      type: 'success',
      title: '복사 완료',
      message: '방 번호가 클립보드에 복사되었습니다.'
    })
  }

  if (isLoading) {
    return (
      <GameScreenLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>게임방 정보를 불러오는 중...</p>
          </div>
        </div>
      </GameScreenLayout>
    )
  }

  if (!gameRoom) {
    return (
      <GameScreenLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">게임방을 찾을 수 없습니다</h2>
          <Button onClick={() => navigate('/main/lobby')}>
            로비로 돌아가기
          </Button>
        </div>
      </GameScreenLayout>
    )
  }

  const sidebar = (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            게임 설정
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between">
              <span>참여자:</span>
              <span>{gameRoom.players.length}/{gameRoom.gameParticipants}</span>
            </div>
            <div className="flex justify-between">
              <span>라이어:</span>
              <span>{gameRoom.gameLiarCount}명</span>
            </div>
            <div className="flex justify-between">
              <span>라운드:</span>
              <span>{gameRoom.gameTotalRounds}</span>
            </div>
            <div className="flex justify-between">
              <span>목표점수:</span>
              <span>{gameRoom.targetPoints}점</span>
            </div>
          </div>

          <Separator />

          <div>
            <div className="text-sm font-medium mb-2">게임 모드</div>
            <Badge variant="outline" className="text-xs">
              {gameRoom.gameMode === 'LIARS_KNOW' ? '라이어 서로 알기' : '라이어 다른 단어'}
            </Badge>
          </div>

          <div>
            <div className="text-sm font-medium mb-2">방 번호</div>
            <div className="flex items-center gap-2">
              <code className="text-sm bg-muted px-2 py-1 rounded">
                {roomId}
              </code>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={handleCopyRoomId}
              >
                <Copy className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {isHost && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-yellow-500" />
              방장 메뉴
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={handleStartGame}
              disabled={!canStartGame || startGameMutation.isPending}
              variant="game-primary"
              className="w-full"
            >
              <Play className="w-4 h-4 mr-2" />
              {startGameMutation.isPending ? "시작 중..." : "게임 시작"}
            </Button>

            {!canStartGame && (
              <p className="text-xs text-muted-foreground text-center">
                최소 4명의 플레이어가 필요합니다
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          <Button
            onClick={handleLeaveGame}
            disabled={leaveGameMutation.isPending}
            variant="outline"
            className="w-full text-red-600 border-red-200 hover:bg-red-50"
          >
            <LogOut className="w-4 h-4 mr-2" />
            {leaveGameMutation.isPending ? "나가는 중..." : "게임방 나가기"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )

  const chat = (
    <ChatSystem
      messages={chatMessages}
      onSendMessage={handleSendMessage}
      gameNumber={parseInt(roomId || '0')}
      currentPhase="대기실"
      placeholder="대기실에서 자유롭게 채팅하세요..."
    />
  )

  return (
    <GameScreenLayout
      sidebar={sidebar}
      chat={chat}
      phase="게임 대기실"
      onLeave={handleLeaveGame}
    >
      <div className="space-y-6 h-full">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">{gameRoom.title}</h1>
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{gameRoom.players.length}/{gameRoom.gameParticipants} 참여</span>
            </div>
            <div className="flex items-center gap-1">
              <Crown className="w-4 h-4 text-yellow-500" />
              <span>방장: {gameRoom.players.find(p => p.isHost)?.nickname}</span>
            </div>
          </div>
        </div>

        <Card className="flex-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              참여자 목록
            </CardTitle>
          </CardHeader>
          <CardContent>
            {gameRoom.players.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>아직 참여한 플레이어가 없습니다</p>
              </div>
            ) : (
              <motion.div
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
              >
                <AnimatePresence>
                  {gameRoom.players.map((player) => (
                    <motion.div
                      key={player.id}
                      variants={staggerItem}
                      layout
                    >
                      <PlayerCard
                        player={player}
                        isCurrentPlayer={player.userId === currentUserId}
                        className="h-full"
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* 빈 슬롯 표시 */}
                {[...Array(gameRoom.gameParticipants - gameRoom.players.length)].map((_, index) => (
                  <motion.div
                    key={`empty-${index}`}
                    variants={staggerItem}
                    className="p-4 rounded-lg border-2 border-dashed border-muted-foreground/20 flex flex-col items-center justify-center text-muted-foreground"
                  >
                    <Users className="w-8 h-8 mb-2 opacity-50" />
                    <span className="text-sm">대기 중</span>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </CardContent>
        </Card>

        {gameRoom.players.length >= 4 && !isHost && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <Card className="bg-green-50 border-green-200">
              <CardContent className="py-4">
                <p className="text-green-800 font-medium">
                  게임 시작 준비가 완료되었습니다!
                </p>
                <p className="text-sm text-green-600 mt-1">
                  방장이 게임을 시작할 때까지 기다려주세요.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </GameScreenLayout>
  )
}

// 임시 목업 데이터
const mockGameRoom: GameRoom = {
  id: 1,
  title: "재미있는 라이어 게임",
  hostUserId: 1,
  status: 'WAITING',
  gameParticipants: 6,
  gameLiarCount: 1,
  gameTotalRounds: 3,
  gameMode: 'LIARS_KNOW',
  targetPoints: 10,
  createdAt: new Date().toISOString(),
  players: [
    {
      id: 1,
      userId: 1,
      nickname: "게임마스터",
      isHost: true,
      isAlive: true,
      joinedAt: new Date().toISOString(),
      votesReceived: 0,
      hasVoted: false,
      hasProvidedHint: false
    },
    {
      id: 2,
      userId: 2,
      nickname: "플레이어2",
      isHost: false,
      isAlive: true,
      joinedAt: new Date().toISOString(),
      votesReceived: 0,
      hasVoted: false,
      hasProvidedHint: false
    },
    {
      id: 3,
      userId: 3,
      nickname: "플레이어3",
      isHost: false,
      isAlive: true,
      joinedAt: new Date().toISOString(),
      votesReceived: 0,
      hasVoted: false,
      hasProvidedHint: false
    }
  ]
}
