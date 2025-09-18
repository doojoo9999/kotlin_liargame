import {useCallback, useEffect, useMemo, useState} from 'react'
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
import {ScrollArea} from '@/components/ui/scroll-area'
import {Check, Lock, Play, Plus, RefreshCw, Settings, Unlock, Users} from 'lucide-react'
import {useToast} from '@/hooks/useToast'
import {useAuthStore} from '@/stores/authStore'
import {useModalRegistration} from '@/contexts/ModalContext'
import {type Subject, subjectApi} from '@/api/subjectApi'
import {gameService} from '@/api/gameApi'
import type {CreateGameRequest, GameMode} from '@/types/backendTypes'
import type {GameRoomInfo} from '@/types/api'

const GAME_MODES: GameMode[] = ['LIARS_KNOW', 'LIARS_DIFFERENT_WORD']
const PARTICIPANT_OPTIONS = [4, 5, 6, 7, 8]
const LIAR_COUNT_OPTIONS = [1, 2]
const ROUND_OPTIONS = [1, 3, 5]
const TARGET_POINT_OPTIONS = [10, 20, 30]

const normalizeRoomStatus = (value: unknown): 'WAITING' | 'IN_PROGRESS' | 'ENDED' => {
  if (typeof value !== 'string') {
    return 'WAITING'
  }
  const normalized = value.toUpperCase()
  if (normalized === 'IN_PROGRESS') return 'IN_PROGRESS'
  if (normalized === 'ENDED') return 'ENDED'
  return 'WAITING'
}

const statusLabel: Record<'WAITING' | 'IN_PROGRESS' | 'ENDED', string> = {
  WAITING: '대기 중',
  IN_PROGRESS: '게임 진행 중',
  ENDED: '종료됨'
}

const getStatusBadge = (status: 'WAITING' | 'IN_PROGRESS' | 'ENDED') => {
  const variant = status === 'IN_PROGRESS' ? 'secondary' : status === 'ENDED' ? 'outline' : 'default'
  return <Badge variant={variant}>{statusLabel[status]}</Badge>
}

type CreateGameFormState = {
  gameName: string
  gameMode: GameMode
  gameParticipants: number
  gameLiarCount: number
  gameTotalRounds: number
  targetPoints: number
  isPrivate: boolean
  password: string
  useRandomSubjects: boolean
  selectedSubjectIds: number[]
  randomSubjectCount: number
}

const createDefaultFormState = (nickname?: string | null, subjects: Subject[] = []): CreateGameFormState => ({
  gameName: nickname ? `${nickname} 님의 방` : '',
  gameMode: 'LIARS_KNOW',
  gameParticipants: 6,
  gameLiarCount: 1,
  gameTotalRounds: 3,
  targetPoints: 10,
  isPrivate: false,
  password: '',
  useRandomSubjects: false,
  selectedSubjectIds: subjects.map(subject => subject.id),
  randomSubjectCount: 10,
})

export function GameRoomsSection() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { nickname } = useAuthStore()
  const [rooms, setRooms] = useState<GameRoomInfo[]>([])
  const [roomsLoading, setRoomsLoading] = useState(true)
  const [roomsError, setRoomsError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false)
  const [sessionCodeInput, setSessionCodeInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [subjectsLoading, setSubjectsLoading] = useState(false)
  const [formState, setFormState] = useState<CreateGameFormState>(() => createDefaultFormState(nickname))

  useModalRegistration('create-game-modal', isCreateDialogOpen)
  useModalRegistration('join-game-modal', isJoinDialogOpen)

  const loadRooms = useCallback(async () => {
    setRoomsLoading(true)
    setRoomsError(null)
    try {
      const response = await gameService.getGameList(0, 24)
      const list = response.gameRooms ?? response.games ?? response.data ?? []
      setRooms(list)
    } catch (error) {
      const message = error instanceof Error ? error.message : '게임방 목록을 가져오지 못했습니다'
      setRoomsError(message)
    } finally {
      setRoomsLoading(false)
    }
  }, [])

  const refreshRooms = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await loadRooms()
    } finally {
      setIsRefreshing(false)
    }
  }, [loadRooms])

  const loadSubjects = useCallback(async () => {
    setSubjectsLoading(true)
    try {
      const response = await subjectApi.getSubjects()
      setSubjects(response.subjects)
      setFormState(prev => ({
        ...prev,
        selectedSubjectIds: prev.useRandomSubjects ? prev.selectedSubjectIds : response.subjects.map(subject => subject.id)
      }))
    } catch (error) {
      console.error('Failed to load subjects', error)
      toast({
        title: '주제를 불러오지 못했습니다',
        description: error instanceof Error ? error.message : '주제 목록 로드 중 오류가 발생했습니다',
        variant: 'destructive'
      })
    } finally {
      setSubjectsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadRooms()
    loadSubjects()
  }, [loadRooms, loadSubjects])

  useEffect(() => {
    const interval = setInterval(() => {
      if (document.hasFocus() && !isCreateDialogOpen && !isJoinDialogOpen) {
        loadRooms()
      }
    }, 30000)
    return () => clearInterval(interval)
  }, [loadRooms, isCreateDialogOpen, isJoinDialogOpen])

  useEffect(() => {
    setFormState(prev => ({
      ...prev,
      gameName: nickname ? `${nickname} 님의 방` : prev.gameName
    }))
  }, [nickname])

  const handleCreateDialogChange = (open: boolean) => {
    setIsCreateDialogOpen(open)
    if (open) {
      setFormState(createDefaultFormState(nickname, subjects))
    }
  }

  const handleToggleSubject = (subjectId: number) => {
    setFormState(prev => {
      const selected = prev.selectedSubjectIds.includes(subjectId)
      return {
        ...prev,
        selectedSubjectIds: selected
          ? prev.selectedSubjectIds.filter(id => id !== subjectId)
          : [...prev.selectedSubjectIds, subjectId]
      }
    })
  }

  const handleSelectAllSubjects = () => {
    setFormState(prev => ({
      ...prev,
      selectedSubjectIds: subjects.map(subject => subject.id)
    }))
  }

  const handleClearSubjects = () => {
    setFormState(prev => ({
      ...prev,
      selectedSubjectIds: []
    }))
  }

  const handleCreateRoom = async () => {
    if (!formState.gameName.trim()) {
      toast({
        title: '방 이름이 필요합니다',
        description: '게임방 이름을 입력해주세요',
        variant: 'destructive'
      })
      return
    }

    if (formState.isPrivate && !formState.password.trim()) {
      toast({
        title: '비밀번호가 필요합니다',
        description: '비공개 방은 비밀번호를 설정해야 합니다',
        variant: 'destructive'
      })
      return
    }

    if (!formState.useRandomSubjects && formState.selectedSubjectIds.length === 0) {
      toast({
        title: '주제를 선택해주세요',
        description: '최소 하나의 주제를 선택해야 합니다',
        variant: 'destructive'
      })
      return
    }

    if (!nickname) {
      toast({
        title: '로그인이 필요합니다',
        description: '게임방을 만들려면 먼저 로그인해주세요',
        variant: 'destructive'
      })
      return
    }

    const payload: CreateGameRequest = {
      nickname,
      gameName: formState.gameName,
      gamePassword: formState.isPrivate ? formState.password.trim() || undefined : undefined,
      gameParticipants: formState.gameParticipants,
      gameLiarCount: formState.gameLiarCount,
      gameTotalRounds: formState.gameTotalRounds,
      gameMode: formState.gameMode,
      subjectIds: formState.useRandomSubjects ? undefined : formState.selectedSubjectIds,
      useRandomSubjects: formState.useRandomSubjects,
      randomSubjectCount: formState.useRandomSubjects ? formState.randomSubjectCount : undefined,
      targetPoints: formState.targetPoints,
    }

    setIsSubmitting(true)
    try {
      const gameNumber = await gameService.createGame(payload)
      toast.success('게임방을 생성했습니다!')
      setFormState(createDefaultFormState(nickname, subjects))
      setIsCreateDialogOpen(false)
      await loadRooms()
      navigate(`/game/${gameNumber}`)
    } catch (error) {
      console.error('Failed to create game room', error)
      toast({
        title: '게임방 생성 실패',
        description: error instanceof Error ? error.message : '게임방을 생성하는 중 오류가 발생했습니다',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleJoinRoom = async (gameNumber: number, isPrivate: boolean) => {
    if (!nickname) {
      toast({
        title: '로그인이 필요합니다',
        description: '게임에 참가하려면 먼저 로그인해주세요',
        variant: 'destructive'
      })
      return
    }

    let password: string | undefined
    if (isPrivate) {
      password = prompt('비밀번호를 입력하세요:')?.trim() || undefined
      if (!password) {
        return
      }
    }

    setIsSubmitting(true)
    try {
      await gameService.joinGame({
        gameNumber,
        nickname,
        gamePassword: password,
      })
      toast.success('게임방에 참가했습니다!')
      setIsJoinDialogOpen(false)
      navigate(`/game/${gameNumber}`)
    } catch (error) {
      console.error('Failed to join game room', error)
      toast({
        title: '게임방 참여 실패',
        description: error instanceof Error ? error.message : '게임방에 참여하는 중 오류가 발생했습니다',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleJoinByCode = async () => {
    if (!sessionCodeInput.trim()) {
      toast({
        title: '게임 번호가 필요합니다',
        description: '참여할 게임의 번호를 입력해주세요',
        variant: 'destructive'
      })
      return
    }

    const parsed = Number(sessionCodeInput.trim())
    if (Number.isNaN(parsed)) {
      toast({
        title: '올바른 게임 번호를 입력하세요',
        description: '게임 번호는 숫자여야 합니다',
        variant: 'destructive'
      })
      return
    }

    await handleJoinRoom(parsed, false)
    setSessionCodeInput('')
  }

  const availableSubjectTags = useMemo(() => subjects.map(subject => ({
    id: subject.id,
    label: subject.name
  })), [subjects])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <Users className="h-5 w-5" />
              게임방 목록
            </CardTitle>
            <CardDescription>
              새로운 게임을 생성하거나 대기 중인 게임방에 참여하세요
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={refreshRooms} disabled={roomsLoading || isRefreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              새로고침
            </Button>
            <Dialog open={isJoinDialogOpen} onOpenChange={setIsJoinDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="secondary">코드로 참여</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>게임 번호로 참여하기</DialogTitle>
                  <DialogDescription>지인에게 받은 게임 번호를 입력하세요</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="game-code">게임 번호</Label>
                    <Input
                      id="game-code"
                      placeholder="예: 1024"
                      value={sessionCodeInput}
                      onChange={(event) => setSessionCodeInput(event.target.value)}
                    />
                  </div>
                  <Button onClick={handleJoinByCode} disabled={isSubmitting} className="w-full">
                    참여하기
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={isCreateDialogOpen} onOpenChange={handleCreateDialogChange}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  게임방 만들기
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-hidden">
                <DialogHeader>
                  <DialogTitle>새 게임방 생성</DialogTitle>
                  <DialogDescription>
                    게임 규칙과 주제를 설정하고 새로운 게임을 시작하세요
                  </DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-[70vh] pr-4">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="room-name">게임방 이름</Label>
                      <Input
                        id="room-name"
                        value={formState.gameName}
                        onChange={(event) => setFormState(prev => ({ ...prev, gameName: event.target.value }))}
                        placeholder="친구들과 함께하는 라이어 게임"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>게임 모드</Label>
                        <Select
                          value={formState.gameMode}
                          onValueChange={(value: GameMode) => setFormState(prev => ({ ...prev, gameMode: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="게임 모드 선택" />
                          </SelectTrigger>
                          <SelectContent>
                            {GAME_MODES.map(mode => (
                              <SelectItem key={mode} value={mode}>
                                {mode.replace(/_/g, ' ')}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>최대 인원</Label>
                        <Select
                          value={String(formState.gameParticipants)}
                          onValueChange={(value) => setFormState(prev => ({ ...prev, gameParticipants: Number(value) }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="인원" />
                          </SelectTrigger>
                          <SelectContent>
                            {PARTICIPANT_OPTIONS.map(option => (
                              <SelectItem key={option} value={String(option)}>
                                {option}명
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>라이어 수</Label>
                        <Select
                          value={String(formState.gameLiarCount)}
                          onValueChange={(value) => setFormState(prev => ({ ...prev, gameLiarCount: Number(value) }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="라이어 수" />
                          </SelectTrigger>
                          <SelectContent>
                            {LIAR_COUNT_OPTIONS.map(option => (
                              <SelectItem key={option} value={String(option)}>
                                {option}명
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>라운드 수</Label>
                        <Select
                          value={String(formState.gameTotalRounds)}
                          onValueChange={(value) => setFormState(prev => ({ ...prev, gameTotalRounds: Number(value) }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="라운드" />
                          </SelectTrigger>
                          <SelectContent>
                            {ROUND_OPTIONS.map(option => (
                              <SelectItem key={option} value={String(option)}>
                                {option}라운드
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>목표 점수</Label>
                        <Select
                          value={String(formState.targetPoints)}
                          onValueChange={(value) => setFormState(prev => ({ ...prev, targetPoints: Number(value) }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="점수" />
                          </SelectTrigger>
                          <SelectContent>
                            {TARGET_POINT_OPTIONS.map(option => (
                              <SelectItem key={option} value={String(option)}>
                                {option}점
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="private-room">비공개 방</Label>
                          <input
                            id="private-room"
                            type="checkbox"
                            className="h-4 w-4"
                            checked={formState.isPrivate}
                            onChange={(event) => setFormState(prev => ({ ...prev, isPrivate: event.target.checked }))}
                          />
                        </div>
                        {formState.isPrivate && (
                          <Input
                            type="password"
                            placeholder="비밀번호"
                            value={formState.password}
                            onChange={(event) => setFormState(prev => ({ ...prev, password: event.target.value }))}
                          />
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="flex items-center gap-2" htmlFor="random-subjects-toggle">
                          <Settings className="h-4 w-4" /> 주제 설정
                        </Label>
                        <input
                          id="random-subjects-toggle"
                          type="checkbox"
                          className="h-4 w-4"
                          checked={formState.useRandomSubjects}
                          onChange={(event) => setFormState(prev => ({ ...prev, useRandomSubjects: event.target.checked }))}
                        />
                      </div>

                      {subjectsLoading ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <RefreshCw className="h-4 w-4 animate-spin" /> 주제를 불러오는 중...
                        </div>
                      ) : formState.useRandomSubjects ? (
                        <div className="space-y-2">
                          <Label htmlFor="random-count">랜덤 주제 수</Label>
                          <Input
                            id="random-count"
                            type="number"
                            min={1}
                            max={subjects.length || 10}
                            value={formState.randomSubjectCount}
                            onChange={(event) => setFormState(prev => ({ ...prev, randomSubjectCount: Number(event.target.value) }))}
                          />
                          <p className="text-xs text-muted-foreground">
                            선택된 수 만큼 주제가 라운드마다 무작위로 선택됩니다.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex flex-wrap gap-2">
                            <Button type="button" variant="outline" size="sm" onClick={handleSelectAllSubjects}>
                              전체 선택
                            </Button>
                            <Button type="button" variant="outline" size="sm" onClick={handleClearSubjects}>
                              전체 해제
                            </Button>
                          </div>
                          <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                            {availableSubjectTags.map(subject => {
                              const selected = formState.selectedSubjectIds.includes(subject.id)
                              return (
                                <Badge
                                  key={subject.id}
                                  variant={selected ? 'default' : 'outline'}
                                  className="cursor-pointer"
                                  onClick={() => handleToggleSubject(subject.id)}
                                >
                                  {subject.label}
                                  {selected && <Check className="h-3 w-3 ml-1" />}
                                </Badge>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                        취소
                      </Button>
                      <Button type="button" onClick={handleCreateRoom} disabled={isSubmitting}>
                        생성하기
                      </Button>
                    </div>
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent>
          {roomsLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <RefreshCw className="h-8 w-8 animate-spin mb-4" />
              게임방 정보를 불러오는 중입니다...
            </div>
          ) : roomsError ? (
            <div className="flex flex-col items-center justify-center py-12 text-destructive gap-4">
              {roomsError}
              <Button variant="outline" onClick={refreshRooms}>다시 시도</Button>
            </div>
          ) : rooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
              <Users className="h-10 w-10 text-muted-foreground" />
              <div>
                <p className="font-medium">현재 대기 중인 게임방이 없습니다.</p>
                <p className="text-sm text-muted-foreground">새로운 게임을 생성하고 친구들을 초대해보세요!</p>
              </div>
              <Button onClick={() => handleCreateDialogChange(true)}>
                <Plus className="h-4 w-4 mr-2" /> 첫 게임방 만들기
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
              {rooms.map(room => {
                const status = normalizeRoomStatus(room.state ?? room.gameState)
                const isPrivate = Boolean(room.hasPassword)
                return (
                  <Card key={room.gameNumber} className="flex flex-col">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            {isPrivate ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                            {room.title}
                          </CardTitle>
                          <CardDescription>호스트: {room.host}</CardDescription>
                        </div>
                        {getStatusBadge(status)}
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col gap-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">플레이어</span>
                        <span className="font-medium">{room.currentPlayers}/{room.maxPlayers}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">게임 번호</span>
                        <code className="bg-muted px-2 py-1 rounded text-xs font-mono">{room.gameNumber}</code>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">게임 모드</span>
                        <span className="text-xs">{room.gameMode}</span>
                      </div>
                      <div className="mt-auto">
                        <Button
                          className="w-full"
                          onClick={() => handleJoinRoom(room.gameNumber, isPrivate)}
                          disabled={status === 'IN_PROGRESS' || room.currentPlayers >= room.maxPlayers || isSubmitting}
                        >
                          {status === 'IN_PROGRESS' ? (
                            <>
                              <Play className="h-4 w-4 mr-2" /> 게임 진행 중
                            </>
                          ) : room.currentPlayers >= room.maxPlayers ? (
                            '인원이 가득 찼습니다'
                          ) : (
                            '참여하기'
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
