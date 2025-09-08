import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Plus, Users, Play, Lock, Unlock, RefreshCw } from 'lucide-react'
import { useToast } from '@/hooks/useToast'
import { useAuthStore } from '@/stores/authStore'

interface GameRoom {
  id: string
  name: string
  host: string
  playerCount: number
  maxPlayers: number
  status: 'waiting' | 'playing' | 'finished'
  isPrivate: boolean
  sessionCode?: string
  createdAt: string
}

export function GameRoomsSection() {
  const [gameRooms, setGameRooms] = useState<GameRoom[]>([
    {
      id: '1',
      name: '재미있는 게임방',
      host: 'Player1',
      playerCount: 3,
      maxPlayers: 8,
      status: 'waiting',
      isPrivate: false,
      createdAt: new Date().toISOString()
    },
    {
      id: '2',
      name: '친구들과 함께',
      host: 'Player2',
      playerCount: 2,
      maxPlayers: 6,
      status: 'playing',
      isPrivate: true,
      sessionCode: 'ABC123',
      createdAt: new Date().toISOString()
    }
  ])

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false)
  const [sessionCodeInput, setSessionCodeInput] = useState('')
  const [newRoom, setNewRoom] = useState({
    name: '',
    maxPlayers: 6,
    isPrivate: false
  })

  const navigate = useNavigate()
  const { toast } = useToast()
  const { nickname } = useAuthStore()

  const handleCreateRoom = async () => {
    if (!newRoom.name.trim()) {
      toast({
        title: "방 이름이 필요합니다",
        description: "게임방 이름을 입력해주세요",
        variant: "destructive",
      })
      return
    }

    try {
      const gameRoom: GameRoom = {
        id: Date.now().toString(),
        name: newRoom.name.trim(),
        host: nickname || 'Unknown',
        playerCount: 1,
        maxPlayers: newRoom.maxPlayers,
        status: 'waiting',
        isPrivate: newRoom.isPrivate,
        sessionCode: newRoom.isPrivate ? generateSessionCode() : undefined,
        createdAt: new Date().toISOString()
      }

      setGameRooms(prev => [...prev, gameRoom])
      setNewRoom({ name: '', maxPlayers: 6, isPrivate: false })
      setIsCreateDialogOpen(false)

      // 생성한 게임방으로 이동
      navigate(`/game/${gameRoom.id}`)

      toast({
        title: "게임방이 생성되었습니다",
        description: `"${gameRoom.name}" 방이 생성되었습니다`,
      })
    } catch (error) {
      toast({
        title: "게임방 생성 실패",
        description: "게임방을 생성하는 중 오류가 발생했습니다",
        variant: "destructive",
      })
    }
  }

  const handleJoinRoom = async (roomId: string) => {
    try {
      // TODO: API 호출로 게임방 참여
      navigate(`/game/${roomId}`)

      toast({
        title: "게임방에 참여했습니다",
        description: "게임방에 성공적으로 참여했습니다",
      })
    } catch (error) {
      toast({
        title: "게임방 참여 실패",
        description: "게임방에 참여하는 중 오류가 발생했습니다",
        variant: "destructive",
      })
    }
  }

  const handleJoinByCode = async () => {
    if (!sessionCodeInput.trim()) {
      toast({
        title: "세션 코드가 필요합니다",
        description: "참여할 게임의 세션 코드를 입력해주세요",
        variant: "destructive",
      })
      return
    }

    try {
      // 세션 코드로 게임방 찾기
      const room = gameRooms.find(r => r.sessionCode === sessionCodeInput.trim().toUpperCase())

      if (!room) {
        toast({
          title: "게임방을 찾을 수 없습니다",
          description: "올바른 세션 코드를 입력했는지 확인해주세요",
          variant: "destructive",
        })
        return
      }

      if (room.status === 'playing') {
        toast({
          title: "게임이 진행 중입니다",
          description: "현재 게임이 진행 중인 방에는 참여할 수 없습니다",
          variant: "destructive",
        })
        return
      }

      navigate(`/game/${room.id}`)
      setSessionCodeInput('')
      setIsJoinDialogOpen(false)

      toast({
        title: "게임방에 참여했습니다",
        description: `"${room.name}" 방에 참여했습니다`,
      })
    } catch (error) {
      toast({
        title: "게임방 참여 실패",
        description: "게임방에 참여하는 중 오류가 발생했습니다",
        variant: "destructive",
      })
    }
  }

  const generateSessionCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase()
  }

  const refreshRooms = async () => {
    try {
      // TODO: API 호출로 게임방 목록 새로고침
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

  const getStatusBadge = (status: GameRoom['status']) => {
    switch (status) {
      case 'waiting':
        return <Badge variant="secondary">대기 중</Badge>
      case 'playing':
        return <Badge variant="default">게임 중</Badge>
      case 'finished':
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
          <Button variant="outline" onClick={refreshRooms}>
            <RefreshCw className="h-4 w-4 mr-2" />
            새로고침
          </Button>

          <Dialog open={isJoinDialogOpen} onOpenChange={setIsJoinDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                세션 코드로 참여
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>세션 코드로 참여</DialogTitle>
                <DialogDescription>
                  친구로부터 받은 세션 코드를 입력하세요
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="sessionCode">세션 코드</Label>
                  <Input
                    id="sessionCode"
                    placeholder="예: ABC123"
                    value={sessionCodeInput}
                    onChange={(e) => setSessionCodeInput(e.target.value.toUpperCase())}
                    className="text-center text-lg font-mono"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setIsJoinDialogOpen(false)}>
                    취소
                  </Button>
                  <Button onClick={handleJoinByCode}>
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
                    value={newRoom.name}
                    onChange={(e) => setNewRoom(prev => ({ ...prev, name: e.target.value }))}
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
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isPrivate"
                    checked={newRoom.isPrivate}
                    onChange={(e) => setNewRoom(prev => ({ ...prev, isPrivate: e.target.checked }))}
                  />
                  <Label htmlFor="isPrivate">비공개 방 (세션 코드 필요)</Label>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    취소
                  </Button>
                  <Button onClick={handleCreateRoom}>
                    생성
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 게임방 목록 */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {gameRooms.map((room) => (
          <Card key={room.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {room.isPrivate ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                    {room.name}
                  </CardTitle>
                  <CardDescription>
                    호스트: {room.host}
                  </CardDescription>
                </div>
                {getStatusBadge(room.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">플레이어</span>
                  <span className="font-medium">{room.playerCount}/{room.maxPlayers}</span>
                </div>

                {room.sessionCode && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">세션 코드</span>
                    <code className="bg-muted px-2 py-1 rounded text-xs font-mono">
                      {room.sessionCode}
                    </code>
                  </div>
                )}

                <Button
                  className="w-full"
                  onClick={() => handleJoinRoom(room.id)}
                  disabled={room.status === 'playing' || room.playerCount >= room.maxPlayers}
                >
                  {room.status === 'playing' ? (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      게임 중
                    </>
                  ) : room.playerCount >= room.maxPlayers ? (
                    '방이 가득참'
                  ) : (
                    '참여하기'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {gameRooms.length === 0 && (
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
    </div>
  )
}
