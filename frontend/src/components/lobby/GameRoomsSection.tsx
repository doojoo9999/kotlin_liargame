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
import {Check, Lock, Play, Plus, RefreshCw, Settings, Unlock, Users, X} from 'lucide-react'
import {useToast} from '@/hooks/useToast'
import {useAuthStore} from '@/stores/authStore'
import {useGameStore} from '@/stores'
import {useModalRegistration} from '@/contexts/ModalContext'
import {type Subject, subjectApi} from '@/api/subjectApi'
import type {GameMode} from '@/types/backendTypes'

export function GameRoomsSection() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false)
  const [sessionCodeInput, setSessionCodeInput] = useState('')
  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([])
  const [subjectsLoading, setSubjectsLoading] = useState(false)
  const [roomNameClicked, setRoomNameClicked] = useState(false) // Track if input was clicked
  const [newRoom, setNewRoom] = useState({
    gameName: '',
    gameMode: 'LIARS_KNOW' as GameMode,
    gameParticipants: 6,
    gameLiarCount: 1,
    gameTotalRounds: 3,
    targetPoints: 10, // Changed default from 100 to 10 points
    isPrivate: false,
    password: '',
    // Subject selection - Changed to show all topics selected by default
    useRandomSubjects: false,
    randomSubjectCount: 10,
    selectedSubjectIds: [] as number[], // Will be populated with all subjects by default
    excludedSubjectIds: [] as number[]
  })

  const navigate = useNavigate()
  const { toast } = useToast()
  const { nickname } = useAuthStore() // Get nickname from auth store

  // Register modals with the Modal Context
  useModalRegistration('create-game-modal', isCreateDialogOpen)
  useModalRegistration('join-game-modal', isJoinDialogOpen)

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
    fetchSubjects()
  }, [fetchGameList, fetchGameModes])

  // 닉네임이 변경되거나 처음 설정될 때 기본 방 이름 설정
  useEffect(() => {
    if (nickname && !roomNameClicked) {
      setNewRoom(prev => ({ ...prev, gameName: `${nickname} 님의 방` }))
    }
  }, [nickname, roomNameClicked])

  // 주제 목록 불러오기
  const fetchSubjects = async () => {
    setSubjectsLoading(true)
    try {
      const response = await subjectApi.getSubjects()
      setAvailableSubjects(response.subjects)
      // Default: select all subjects
      setNewRoom(prev => ({
        ...prev,
        selectedSubjectIds: response.subjects.map(subject => subject.id)
      }))
    } catch (error) {
      toast({
        title: "주제 목록 불러오기 실패",
        description: "주제 목록을 불러오는 중 오류가 발생했습니다",
        variant: "destructive",
      })
    } finally {
      setSubjectsLoading(false)
    }
  }

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

    // 주제 선택 검증
    if (newRoom.selectedSubjectIds.length === 0 && !newRoom.useRandomSubjects) {
      toast({
        title: "주제를 선택해주세요",
        description: "최소 하나의 주제를 선택해야 합니다",
        variant: "destructive",
      })
      return
    }

    if (newRoom.useRandomSubjects && availableSubjects.length - newRoom.excludedSubjectIds.length === 0) {
      toast({
        title: "주제를 선택해주세요",
        description: "모든 주제를 제외할 수는 없습니다",
        variant: "destructive",
      })
      return
    }

    try {
      if (!nickname) {
        toast({
          title: "로그인이 필요합니다",
          description: "게임방을 만들려면 먼저 로그인해주세요",
          variant: "destructive",
        })
        return
      }

      // Prepare game data for backend
      const gameData = {
        hostNickname: nickname,
        gameName: newRoom.gameName,
        gameMode: newRoom.gameMode as any,
        maxPlayers: newRoom.gameParticipants,
        timeLimit: 300, // Default 5 minutes
        totalRounds: newRoom.gameTotalRounds,
        isPrivate: newRoom.isPrivate,
        password: newRoom.isPrivate ? newRoom.password : undefined
      }

      // Use the new initialization service for proper backend integration
      const { gameInitializationService } = await import('@/services/gameInitializationService')

      const gameNumber = await gameInitializationService.createGameRoom(gameData)
      
      console.log('Game created successfully, gameNumber:', gameNumber)
      
      // 폼 초기화
      setNewRoom({
        gameName: nickname ? `${nickname} 님의 방` : '', // Reset with default name
        gameMode: 'LIARS_KNOW' as GameMode,
        gameParticipants: 6,
        gameLiarCount: 1,
        gameTotalRounds: 3,
        targetPoints: 10, // Reset to 10 points
        isPrivate: false,
        password: '',
        useRandomSubjects: false, // Reset to specific topic selection mode
        randomSubjectCount: 10,
        selectedSubjectIds: availableSubjects.map(subject => subject.id), // Reset with all subjects selected
        excludedSubjectIds: []
      })
      setRoomNameClicked(false) // Reset clicked state
      handleCreateDialogOpen(false)

      // 생성한 게임방으로 이동
      console.log('Navigating to game page:', `/game/${gameNumber}`)
      // Use setTimeout to ensure navigation happens after dialog closes
      navigate(`/game/${gameNumber}`)

    } catch (error) {
      console.error('Failed to create game room:', error)
      toast({
        title: "게임방 생성 실패",
        description: error instanceof Error ? error.message : "게임방을 생성하는 중 오류가 발생했습니다",
        variant: "destructive",
      })
    }
  }

  // 주제 선택/해제 관리 함수
  const toggleSubjectSelection = (subjectId: number) => {
    setNewRoom(prev => ({
      ...prev,
      selectedSubjectIds: prev.selectedSubjectIds.includes(subjectId)
        ? prev.selectedSubjectIds.filter(id => id !== subjectId)
        : [...prev.selectedSubjectIds, subjectId]
    }))
  }

  const selectAllSubjects = () => {
    setNewRoom(prev => ({ ...prev, selectedSubjectIds: availableSubjects.map(s => s.id) }))
  }

  const deselectAllSubjects = () => {
    setNewRoom(prev => ({ ...prev, selectedSubjectIds: [] }))
  }

  const handleJoinRoom = async (gameNumber: number, isPrivate: boolean = false) => {
    try {
      if (!nickname) {
        toast({
          title: "로그인이 필요합니다",
          description: "게임에 참가하려면 먼저 로그인해주세요",
          variant: "destructive",
        })
        return
      }

      let password: string | undefined

      // 비공개 방인 경우 비밀번호 입력 받기
      if (isPrivate) {
        password = prompt('비밀번호를 입력하세요:') || undefined
        if (!password) return // 사용자가 취소한 경우
      }

      // Use the new initialization service for proper backend integration
      const { gameInitializationService } = await import('@/services/gameInitializationService')

      await gameInitializationService.joinGameRoom(gameNumber, nickname, password)

      // Navigate to the game room
      navigate(`/game/${gameNumber}`)

    } catch (error) {
      console.error('Failed to join game room:', error)
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

  // Handle room name input click - clear content for immediate typing
  const handleRoomNameClick = () => {
    if (!roomNameClicked) {
      setRoomNameClicked(true)
      setNewRoom(prev => ({ ...prev, gameName: '' }))
    }
  }

  // Handle room name input change
  const handleRoomNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRoomNameClicked(true)
    setNewRoom(prev => ({ ...prev, gameName: e.target.value }))
  }

  // Handle dialog open - reset room name to default when opening
  const handleCreateDialogOpen = (open: boolean) => {
    setIsCreateDialogOpen(open)
    if (open && nickname) {
      // Always reset when opening dialog
      setNewRoom(prev => ({ ...prev, gameName: `${nickname} 님의 방` }))
      setRoomNameClicked(false)
    } else if (!open) {
      // Reset clicked state when closing dialog
      setRoomNameClicked(false)
    }
  }

  const refreshRooms = async () => {
    try {
      await fetchGameList()
      toast({
        title: "목록이 새로고침되었습니다",
        description: "최신 게임방 목록을 불러왔습니다",
      })
    } catch {
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

          <Dialog open={isCreateDialogOpen} onOpenChange={handleCreateDialogOpen}>
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
              <div className="space-y-6 max-h-[70vh] overflow-y-auto">
                {/* 기본 설정 */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="roomName">방 이름</Label>
                    <Input
                      id="roomName"
                      placeholder="게임방 이름을 입력하세요"
                      value={newRoom.gameName}
                      onClick={handleRoomNameClick}
                      onChange={handleRoomNameChange}
                    />
                  </div>

                  <div>
                    <Label htmlFor="gameParticipants">
                      최대 플레이어 수: {newRoom.gameParticipants}명
                    </Label>
                    <div className="space-y-2">
                      <input
                        type="range"
                        id="gameParticipants"
                        min="3"
                        max="15"
                        value={newRoom.gameParticipants}
                        onChange={(e) => setNewRoom(prev => ({ ...prev, gameParticipants: parseInt(e.target.value) }))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>3명</span>
                        <span>9명</span>
                        <span>15명</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      최소 3명부터 게임을 시작할 수 있습니다
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="gameLiarCount">라이어 수</Label>
                    <Select
                      value={newRoom.gameLiarCount.toString()}
                      onValueChange={(value) => setNewRoom(prev => ({ ...prev, gameLiarCount: parseInt(value) }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({length: Math.floor(newRoom.gameParticipants / 3)}, (_, i) => i + 1).map(num => (
                          <SelectItem key={num} value={num.toString()}>
                            {num}명
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      참여자 수에 따라 적절한 라이어 수가 결정됩니다
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="gameTotalRounds">총 라운드 수</Label>
                    <Select
                      value={newRoom.gameTotalRounds.toString()}
                      onValueChange={(value) => setNewRoom(prev => ({ ...prev, gameTotalRounds: parseInt(value) }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5].map(num => (
                          <SelectItem key={num} value={num.toString()}>
                            {num}라운드
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="targetPoints">목표 점수</Label>
                    <Select
                      value={newRoom.targetPoints.toString()}
                      onValueChange={(value) => setNewRoom(prev => ({ ...prev, targetPoints: parseInt(value) }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[10, 20, 50, 100, 150, 200].map(num => (
                          <SelectItem key={num} value={num.toString()}>
                            {num}점
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      라이어가 맞춰야 하는 목표 점수입니다 (라이어가 정답을 맞히면 +2점)
                    </p>
                  </div>
                </div>

                {/* 게임 모드 선택 */}
                <div>
                  <Label className="flex items-center gap-2 mb-3">
                    <Settings className="h-4 w-4" />
                    게임 모드
                  </Label>
                  <div className="space-y-3">
                    <div
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        newRoom.gameMode === 'LIARS_KNOW' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setNewRoom(prev => ({ ...prev, gameMode: 'LIARS_KNOW' }))}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <input
                          type="radio"
                          checked={newRoom.gameMode === 'LIARS_KNOW'}
                          onChange={() => setNewRoom(prev => ({ ...prev, gameMode: 'LIARS_KNOW' }))}
                          className="text-blue-600"
                        />
                        <Label className="font-medium">라이어가 자신의 역할을 아는 모드</Label>
                      </div>
                      <p className="text-sm text-muted-foreground ml-6">
                        라이어가 자신이 라이어임을 알고 게임을 진행합니다. 전략적 플레이가 가능합니다.
                      </p>
                    </div>

                    <div
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        newRoom.gameMode === 'LIARS_DIFFERENT_WORD' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setNewRoom(prev => ({ ...prev, gameMode: 'LIARS_DIFFERENT_WORD' }))}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <input
                          type="radio"
                          checked={newRoom.gameMode === 'LIARS_DIFFERENT_WORD'}
                          onChange={() => setNewRoom(prev => ({ ...prev, gameMode: 'LIARS_DIFFERENT_WORD' }))}
                          className="text-blue-600"
                        />
                        <Label className="font-medium">라이어가 다른 답안을 받는 모드</Label>
                      </div>
                      <p className="text-sm text-muted-foreground ml-6">
                        라이어가 다른 주제를 받아서 자연스럽게 다른 답변을 하게 됩니다.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 주제 선택 */}
                <div>
                  <Label className="flex items-center gap-2 mb-3">
                    <Settings className="h-4 w-4" />
                    주제 선택
                  </Label>

                  <div className="p-3 border border-blue-500 bg-blue-50 rounded-lg mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Check className="h-4 w-4 text-blue-600" />
                      <Label className="font-medium">모든 주제 사용 (권장)</Label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      기본적으로 모든 주제가 선택되어 있습니다. 원하지 않는 주제는 아래에서 선택 해제할 수 있습니다.
                    </p>
                  </div>

                  {/* 주제 목록 */}
                  {subjectsLoading ? (
                    <div className="text-center py-4">
                      <div className="animate-spin inline-block w-6 h-6 border-[3px] border-current border-t-transparent text-blue-600 rounded-full" />
                      <p className="mt-2 text-sm text-muted-foreground">주제를 불러오는 중...</p>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium">
                          사용할 주제 선택 ({newRoom.selectedSubjectIds.length}/{availableSubjects.length})
                        </span>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={selectAllSubjects}
                          >
                            <Check className="h-3 w-3 mr-1" />
                            전체 선택
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={deselectAllSubjects}
                          >
                            <X className="h-3 w-3 mr-1" />
                            전체 해제
                          </Button>
                        </div>
                      </div>

                      <div className="max-h-48 overflow-y-auto border rounded-lg p-3">
                        <div className="grid grid-cols-1 gap-2">
                          {availableSubjects.map((subject) => {
                            const isSelected = newRoom.selectedSubjectIds.includes(subject.id)

                            return (
                              <div
                                key={subject.id}
                                className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${
                                  isSelected ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
                                }`}
                                onClick={() => toggleSubjectSelection(subject.id)}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleSubjectSelection(subject.id)}
                                  className="text-blue-600"
                                />
                                <div className="flex-1">
                                  <div className="font-medium text-sm">{subject.name}</div>
                                  {subject.wordCount && (
                                    <div className="text-xs text-muted-foreground">
                                      {subject.wordCount}개 단어
                                    </div>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 비공개 방 설정 */}
                <div className="space-y-4">
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
                </div>

                <div className="flex gap-2 justify-end pt-4 border-t">
                  <Button variant="outline" onClick={() => handleCreateDialogOpen(false)}>
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
