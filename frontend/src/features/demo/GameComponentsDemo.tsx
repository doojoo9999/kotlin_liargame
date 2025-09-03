import * as React from "react"
import {motion} from "framer-motion"
import {Button} from "@/versions/main/components/ui/button"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/versions/main/components/ui/card"
import {Badge} from "@/versions/main/components/ui/badge"
import {Avatar, AvatarFallback} from "@/versions/main/components/ui/avatar"
import {Input} from "@/versions/main/components/ui/input"
import {Progress} from "@/versions/main/components/ui/progress"
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/versions/main/components/ui/tabs"
import {Clock, Crown, Play, Send, Settings, Trophy, Users, Vote} from "lucide-react"

export default function GameComponentsDemo() {
  const [timeRemaining, setTimeRemaining] = React.useState(150)
  const [progress, setProgress] = React.useState(75)

  React.useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(prev => prev > 0 ? prev - 1 : 150)
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const mockPlayers = [
    { id: "1", name: "플레이어1", role: "CITIZEN", isHost: true, isAlive: true, votes: 0 },
    { id: "2", name: "플레이어2", role: "LIAR", isHost: false, isAlive: true, votes: 2 },
    { id: "3", name: "플레이어3", role: "CITIZEN", isHost: false, isAlive: false, votes: 1 }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 p-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-800 mb-2">게임 컴포넌트 데모</h1>
          <p className="text-gray-600">라이어 게임에서 사용되는 UI 컴포넌트들</p>
        </motion.div>

        <Tabs defaultValue="buttons" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="buttons">버튼</TabsTrigger>
            <TabsTrigger value="badges">뱃지</TabsTrigger>
            <TabsTrigger value="cards">카드</TabsTrigger>
            <TabsTrigger value="timer">타이머</TabsTrigger>
            <TabsTrigger value="players">플레이어</TabsTrigger>
            <TabsTrigger value="game">게임 UI</TabsTrigger>
          </TabsList>

          {/* 버튼 데모 */}
          <TabsContent value="buttons">
            <Card>
              <CardHeader>
                <CardTitle>게임 버튼 컴포넌트</CardTitle>
                <CardDescription>다양한 게임 상황에 맞는 버튼 스타일들</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">기본 버튼</h4>
                    <Button variant="default">기본</Button>
                    <Button variant="secondary">보조</Button>
                    <Button variant="outline">외곽선</Button>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">게임 버튼</h4>
                    <Button variant="game-primary">게임 시작</Button>
                    <Button variant="game-success">준비 완료</Button>
                    <Button variant="game-warning">대기 중</Button>
                    <Button variant="game-danger">투표하기</Button>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">아이콘 버튼</h4>
                    <Button size="icon"><Settings className="w-4 h-4" /></Button>
                    <Button size="icon" variant="game-primary"><Play className="w-4 h-4" /></Button>
                    <Button size="icon" variant="game-danger"><Vote className="w-4 h-4" /></Button>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">크기 변형</h4>
                    <Button size="sm">작은 크기</Button>
                    <Button size="default">기본 크기</Button>
                    <Button size="lg">큰 크기</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 뱃지 데모 */}
          <TabsContent value="badges">
            <Card>
              <CardHeader>
                <CardTitle>게임 뱃지 컴포넌트</CardTitle>
                <CardDescription>플레이어 상태와 역할을 표시하는 뱃지들</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-medium">역할 뱃지</h4>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="role-citizen">시민</Badge>
                      <Badge variant="role-liar">라이어</Badge>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-medium">상태 뱃지</h4>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="status-online">온라인</Badge>
                      <Badge variant="status-offline">오프라인</Badge>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-medium">게임 뱃지</h4>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="game-success">준비완료</Badge>
                      <Badge variant="game-warning">대기중</Badge>
                      <Badge variant="game-danger">위험</Badge>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-medium">기본 뱃지</h4>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="default">기본</Badge>
                      <Badge variant="secondary">보조</Badge>
                      <Badge variant="outline">외곽선</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 카드 데모 */}
          <TabsContent value="cards">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="w-5 h-5 text-yellow-500" />
                    방장 카드
                  </CardTitle>
                  <CardDescription>게임 방의 호스트 정보</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar>
                      <AvatarFallback>방</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">방장님</div>
                      <div className="text-sm text-gray-500">레벨 15</div>
                    </div>
                  </div>
                  <Button className="w-full" variant="game-primary">
                    방 참가하기
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-500" />
                    플레이어 현황
                  </CardTitle>
                  <CardDescription>현재 접속 중인 플레이어</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>온라인</span>
                      <Badge variant="status-online">1,234</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>게임 중</span>
                      <Badge variant="game-warning">456</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>대기 중</span>
                      <Badge variant="game-success">778</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-purple-500" />
                    게임 통계
                  </CardTitle>
                  <CardDescription>나의 게임 기록</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">승률</span>
                        <span className="text-sm font-medium">75%</span>
                      </div>
                      <Progress value={75} className="h-2" />
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-green-600">42</div>
                        <div className="text-xs text-gray-600">승리</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-red-600">14</div>
                        <div className="text-xs text-gray-600">패배</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 타이머 데모 */}
          <TabsContent value="timer">
            <Card>
              <CardHeader>
                <CardTitle>게임 타이머 컴포넌트</CardTitle>
                <CardDescription>게임 페이즈별 시간 관리</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="text-center space-y-4">
                    <div className="text-6xl font-bold text-blue-600 font-mono">
                      {formatTime(timeRemaining)}
                    </div>
                    <Badge variant="game-primary" className="text-lg px-4 py-2">
                      토론 시간
                    </Badge>
                    <Progress
                      value={(timeRemaining / 150) * 100}
                      className="h-4"
                    />
                    <div className="text-sm text-gray-600">
                      남은 시간: {timeRemaining}초
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-medium">타이머 상태들</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 border rounded">
                        <span>토론 페이즈</span>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-blue-500" />
                          <span className="font-mono">2:30</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded">
                        <span>투표 페이즈</span>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-red-500" />
                          <span className="font-mono">1:00</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded">
                        <span>결과 발표</span>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-purple-500" />
                          <span className="font-mono">0:10</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 플레이어 데모 */}
          <TabsContent value="players">
            <Card>
              <CardHeader>
                <CardTitle>플레이어 카드 컴포넌트</CardTitle>
                <CardDescription>게임 중 플레이어 정보 표시</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {mockPlayers.map((player) => (
                    <motion.div
                      key={player.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="border rounded-lg p-4 bg-white/50"
                    >
                      <div className="text-center space-y-3">
                        <Avatar className="mx-auto">
                          <AvatarFallback>{player.name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center justify-center gap-2">
                            <span className="font-medium">{player.name}</span>
                            {player.isHost && <Crown className="w-4 h-4 text-yellow-500" />}
                          </div>
                          <Badge
                            variant={player.role === 'LIAR' ? 'role-liar' : 'role-citizen'}
                            className="mt-1"
                          >
                            {player.role === 'LIAR' ? '라이어' : '시민'}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600">
                          투표: {player.votes}표
                        </div>
                        <Button
                          size="sm"
                          variant="game-danger"
                          className="w-full"
                          disabled={!player.isAlive}
                        >
                          <Vote className="w-3 h-3 mr-1" />
                          {player.isAlive ? '투표하기' : '사망'}
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 게임 UI 데모 */}
          <TabsContent value="game">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>게임 채팅</CardTitle>
                  <CardDescription>실시간 게임 채팅 시스템</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 mb-4 h-48 overflow-y-auto">
                    <div className="p-2 bg-gray-100 rounded text-sm text-center">
                      게임이 시작되었습니다!
                    </div>
                    <div className="p-2 bg-blue-500 text-white rounded max-w-[80%] ml-auto">
                      <div className="text-xs opacity-70">나 · 14:30</div>
                      이것은 털이 있고 네 발로 걸어요
                    </div>
                    <div className="p-2 bg-white border rounded max-w-[80%]">
                      <div className="text-xs opacity-70">플레이어2 · 14:31</div>
                      집에서 기를 수 있어요
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Input placeholder="메시지를 입력하세요..." className="flex-1" />
                    <Button size="icon">
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>주제어 표시</CardTitle>
                  <CardDescription>플레이어 역할에 따른 정보 표시</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="text-center p-6 border rounded-lg">
                      <div className="text-sm text-gray-600 mb-2">주제어</div>
                      <div className="text-3xl font-bold text-gray-800 mb-2">강아지</div>
                      <Badge variant="role-citizen">시민</Badge>
                    </div>
                    <div className="text-center p-6 border rounded-lg bg-red-50">
                      <div className="text-sm text-red-600 mb-2">당신은 라이어입니다!</div>
                      <div className="text-3xl font-bold text-red-700 mb-2">???</div>
                      <Badge variant="role-liar">라이어</Badge>
                      <div className="text-sm text-red-600 mt-2">
                        다른 플레이어들의 설명을 듣고 주제어를 추리하세요
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
