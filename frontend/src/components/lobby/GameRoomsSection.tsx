import {useEffect, useState} from 'react'
import {useNavigate} from 'react-router-dom'
import {Button} from '@/components/ui/button'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Badge} from '@/components/ui/badge'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog'
import {Lock, Play, Plus, RefreshCw, Unlock, Users} from 'lucide-react'
import {useToast} from '@/hooks/useToast'
import {useAuthStore} from '@/stores/authStore'
import useGameStore from '@/stores/gameStore'
import type {CreateGameRequest, JoinGameRequest} from '@/types/game'

export function GameRoomsSection() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false)
  const [sessionCodeInput, setSessionCodeInput] = useState('')
  const [newRoom, setNewRoom] = useState({
    gameName: '',
    gameMode: 'CLASSIC',
    maxPlayers: 6,
    isPrivate: false,
    password: ''
  })

  const navigate = useNavigate()
  const { toast } = useToast()
  const { nickname } = useAuthStore()

  // GameStore에서 상태와 액션들 가져오기
  const {
    gameList,
    gameListLoading,
    gameListError,
    availableGameModes,
    isLoading,
    fetchGameList,
    createGame,
    joinGame,
    fetchGameModes
  } = useGameStore()

  // 컴포넌트 마운트 시 게임 목록과 게임 모드 불러오기
  useEffect(() => {
    fetchGameList()
    fetchGameModes()
  }, [fetchGameList, fetchGameModes])

  const handleCreateRoom = async () => {
    if (!newRoom.gameName.trim()) {
      toast({
        title: "방 이름이 필요합니다",
        description: "게임방 이름을 입력해주세요",
        variant: "destructive",
      })
      return
    }

    if (newRoom.isPrivate && !newRoom.password.trim()) {
      toast({
        title: "비밀번호가 필요합니다",
        description: "비공개 방은 비밀번호를 설정해야 합니다",
        variant: "destructive",
      })
      return
    }

    try {
      const gameData: CreateGameRequest = {
        gameName: newRoom.gameName.trim(),
        gameMode: newRoom.gameMode,
        maxPlayers: newRoom.maxPlayers,
        isPrivate: newRoom.isPrivate,
        password: newRoom.isPrivate ? newRoom.password : undefined
      }

      const gameState = await createGame(gameData)

      setNewRoom({
        gameName: '',
        gameMode: 'CLASSIC',
        maxPlayers: 6,
        isPrivate: false,
        password: ''
      })
      setIsCreateDialogOpen(false)

      // 생성한 게임방으로 이동
      navigate(`/game/${gameState.gameNumber}`)

      toast({
        title: "게임방이 생성되었습니다",
        description: `"${gameState.gameName}" 방이 생성되었습니다`,
      })
    } catch (error) {
      toast({
        title: "게임방 생성 실패",
        description: error instanceof Error ? error.message : "게임방을 생성하는 중 오류가 발생했습니다",
        variant: "destructive",
      })
    }
  }

  const handleJoinRoom = async (gameNumber: number, isPrivate: boolean = false) => {
    try {
      let password: string | undefined

      // 비공개 방인 경우 비밀번호 입력 받기
      if (isPrivate) {
        password = prompt('비밀번호를 입력하세요:')
        if (!password) return // 사용자가 취소한 경우
      }

      const joinData: JoinGameRequest = {
        gameNumber,
        password
      }

      const gameState = await joinGame(joinData)

      navigate(`/game/${gameNumber}`)

      toast({
        title: "게임방에 참여했습니다",
        description: `"${gameState.gameName}" 방에 참여했습니다`,
      })
    } catch (error) {
      toast({
        title: "게임방 참여 실패",
        description: error instanceof Error ? error.message : "게임방에 참여하는 중 오류가 발생했습니다",
        variant: "destructive",
      })
    }
  }

  const handleJoinByCode = async () => {
    if (!sessionCodeInput.trim()) {
      toast({
        title: "게임 번호가 필요합니다",
        description: "참여할 게임의 번호를 입력해주세요",
        variant: "destructive",
      })
      return
    }

    try {
      const gameNumber = parseInt(sessionCodeInput.trim())

      if (isNaN(gameNumber)) {
        toast({
          title: "올바른 게임 번호를 입력하세요",
          description: "게임 번호는 숫자여야 합니다",
          variant: "destructive",
        })
        return
      }

      await handleJoinRoom(gameNumber)
      setSessionCodeInput('')
      setIsJoinDialogOpen(false)
    } catch (error) {
      toast({
        title: "게임방 참여 실패",
        description: error instanceof Error ? error.message : "게임방에 참여하는 중 오류가 발생했습니다",
        variant: "destructive",
      })
    }
  }

  const refreshRooms = async () => {
    try {
      await fetchGameList()
      toast({
        title: "목록이 새로고침되었습니다",
        description: "최신 게임방 목록을 불러왔습니다",
      })
    } catch (error) {
      toast({
        title: "새로고침 실패",
        description: "목록을 새로고침하는 중 오류가 발생했습니다",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: 'WAITING' | 'IN_PROGRESS' | 'ENDED') => {
    switch (status) {
      case 'WAITING':
        return <Badge variant="secondary">대기 중</Badge>
      case 'IN_PROGRESS':
        return <Badge variant="default">게임 중</Badge>
      case 'ENDED':
        return <Badge variant="outline">종료됨</Badge>
      default:
        return <Badge variant="outline">알 수 없음</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            게임룸
          </h2>
          <p className="text-muted-foreground">게임방을 만들거나 참여하세요</p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={refreshRooms} disabled={gameListLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${gameListLoading ? 'animate-spin' : ''}`} />
            새로고침
          </Button>

          <Dialog open={isJoinDialogOpen} onOpenChange={setIsJoinDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                게임 번호로 참여
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>게임 번호로 참여</DialogTitle>
                <DialogDescription>
                  참여할 게임의 번호를 입력하세요
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="sessionCode">게임 번호</Label>
                  <Input
                    id="sessionCode"
                    placeholder="예: 12345"
                    value={sessionCodeInput}
                    onChange={(e) => setSessionCodeInput(e.target.value)}
                    className="text-center text-lg font-mono"
                    type="number"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setIsJoinDialogOpen(false)}>
                    취소
                  </Button>
                  <Button onClick={handleJoinByCode} disabled={isLoading}>
                    참여
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                새 게임방 만들기
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>새 게임방 만들기</DialogTitle>
                <DialogDescription>
                  새로운 게임방을 생성하세요
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="roomName">방 이름</Label>
                  <Input
                    id="roomName"
                    placeholder="게임방 이름을 입력하세요"
                    value={newRoom.gameName}
                    onChange={(e) => setNewRoom(prev => ({ ...prev, gameName: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="maxPlayers">최대 플레이어 수</Label>
                  <Select
                    value={newRoom.maxPlayers.toString()}
                    onValueChange={(value) => setNewRoom(prev => ({ ...prev, maxPlayers: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[4, 5, 6, 7, 8].map(num => (
                        <SelectItem key={num} value={num.toString()}>
                          {num}명
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="gameMode">게임 모드</Label>
                  <Select
                    value={newRoom.gameMode}
                    onValueChange={(value) => setNewRoom(prev => ({ ...prev, gameMode: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableGameModes.length > 0 ? (
                        availableGameModes.map(mode => (
                          <SelectItem key={mode.name} value={mode.name}>
                            {mode.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="CLASSIC">클래식</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isPrivate"
                    checked={newRoom.isPrivate}
                    onChange={(e) => setNewRoom(prev => ({ ...prev, isPrivate: e.target.checked }))}
                  />
                  <Label htmlFor="isPrivate">비공개 방 (비밀번호 필요)</Label>
                </div>
                {newRoom.isPrivate && (
                  <div>
                    <Label htmlFor="password">비밀번호</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="비밀번호를 입력하세요"
                      value={newRoom.password}
                      onChange={(e) => setNewRoom(prev => ({ ...prev, password: e.target.value }))}
                    />
                  </div>
                )}
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    취소
                  </Button>
                  <Button onClick={handleCreateRoom} disabled={isLoading}>
                    생성
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 로딩 및 에러 상태 */}
      {gameListLoading && (
        <div className="text-center py-8">
          <div className="animate-spin inline-block w-6 h-6 border-[3px] border-current border-t-transparent text-blue-600 rounded-full" />
          <p className="mt-2 text-muted-foreground">게임방 목록을 불러오는 중...</p>
        </div>
      )}

      {gameListError && (
        <div className="text-center py-8 text-red-600">
          <p>게임방 목록을 불러오는 중 오류가 발생했습니다: {gameListError}</p>
          <Button variant="outline" onClick={() => fetchGameList()} className="mt-2">
            다시 시도
          </Button>
        </div>
      )}

      {/* 게임방 목록 */}
      {!gameListLoading && !gameListError && (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {gameList.map((room) => (
            <Card key={room.gameNumber} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {room.isPrivate ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                      {room.gameName}
                    </CardTitle>
                    <CardDescription>
                      호스트: {room.gameOwner}
                    </CardDescription>
                  </div>
                  {getStatusBadge(room.gameState)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">플레이어</span>
                    <span className="font-medium">{room.gameParticipants}/{room.gameMaxPlayers}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">게임 번호</span>
                    <code className="bg-muted px-2 py-1 rounded text-xs font-mono">
                      {room.gameNumber}
                    </code>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">게임 모드</span>
                    <span className="text-xs">{room.gameMode}</span>
                  </div>

                  <Button
                    className="w-full"
                    onClick={() => handleJoinRoom(room.gameNumber, room.isPrivate)}
                    disabled={room.gameState === 'IN_PROGRESS' || room.gameParticipants >= room.gameMaxPlayers || isLoading}
                  >
                    {room.gameState === 'IN_PROGRESS' ? (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        게임 중
                      </>
                    ) : room.gameParticipants >= room.gameMaxPlayers ? (
                      '방이 가득참'
                    ) : (
                      '참여하기'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {gameList.length === 0 && (
            <Card className="col-span-full">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">활성 게임방이 없습니다</h3>
                <p className="text-muted-foreground text-center mb-4">
                  새로운 게임방을 만들어 게임을 시작해보세요
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  첫 게임방 만들기
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
