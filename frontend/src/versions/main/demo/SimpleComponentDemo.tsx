import * as React from "react"
import {AnimatePresence, motion} from 'framer-motion'
import {Button} from '../components/ui/button'
import {Card, CardContent, CardHeader, CardTitle} from '../components/ui/card'
import {Avatar, AvatarFallback} from '../components/ui/avatar'
import {Badge} from '../components/ui/badge'
import {Progress} from '../components/ui/progress'
import {Input} from '../components/ui/input'
import {Separator} from '../components/ui/separator'
import {Clock, Crown, MessageSquare, Send, Shield, Star, Target, Timer, Trophy, Users, Zap} from 'lucide-react'

interface GameMessage {
  id: number
  player: string
  message: string
  timestamp: string
  isOwn?: boolean
}

interface GamePlayer {
  id: number
  name: string
  role: 'CITIZEN' | 'LIAR' | 'UNKNOWN'
  isHost: boolean
  isAlive: boolean
  votesReceived: number
  score: number
}
          {/* 기본 버튼 테스트 */}
          <div className="bg-white p-6 rounded-lg shadow">
  const [timeRemaining, setTimeRemaining] = React.useState(150)
  const [message, setMessage] = React.useState('')
  const [gamePhase, setGamePhase] = React.useState<'WAITING' | 'DISCUSSING' | 'VOTING' | 'REVEALING'>('VOTING')

  const [messages] = React.useState<GameMessage[]>([
    { id: 1, player: '플레이어1', message: '게임 시작하죠!', timestamp: '방금', isOwn: false },
    { id: 2, player: '플레이어2', message: '네, 준비됐습니다 🎮', timestamp: '30초 전', isOwn: false },
    { id: 3, player: '나', message: '화이팅!', timestamp: '10초 전', isOwn: true }
  ])
              <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
  const [players] = React.useState<GamePlayer[]>([
    { id: 1, name: '플레이어1', role: 'CITIZEN', isHost: true, isAlive: true, votesReceived: 2, score: 1250 },
    { id: 2, name: '플레이어2', role: 'UNKNOWN', isHost: false, isAlive: true, votesReceived: 0, score: 980 },
    { id: 3, name: '플레이어3', role: 'UNKNOWN', isHost: false, isAlive: true, votesReceived: 3, score: 1100 },
    { id: 4, name: '플레이어4', role: 'UNKNOWN', isHost: false, isAlive: false, votesReceived: 1, score: 750 }
  ])

  // 타이머 시뮬레이션
                기본 버튼
              </button>
      setTimeRemaining(prev => prev > 0 ? prev - 1 : 150)
    }, 1000)
    return () => clearInterval(timer)
  }, [])
          </div>

    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleSendMessage = () => {
    if (message.trim()) {
      setMessage('')
      // 여기에 실제 메시지 전송 로직이 들어갈 예정
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.1,
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  }
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 md:p-8">
      <motion.div
        className="max-w-7xl mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* 헤더 */}
        <motion.div variants={itemVariants} className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
            🎮 라이어 게임 데모
                </div>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            shadcn/ui와 Framer Motion으로 구현된 프로페셔널 게임 인터페이스
          </div>
        </motion.div>

        {/* 메인 게임 영역 */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
          {/* 좌측: 게임 상태 + 플레이어 목록 */}
          <div className="xl:col-span-2 space-y-6">
            {/* 게임 상태 카드 */}
            <motion.div variants={itemVariants}>
              <Card className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10" />
                <CardHeader className="relative">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600">
                        <Target className="h-5 w-5 text-white" />
                      </div>
                      게임 진행 상황
                    </CardTitle>
                    <Badge className="bg-gradient-to-r from-emerald-500 to-green-600 text-white">
                      <div className="w-2 h-2 bg-emerald-300 rounded-full mr-2 animate-pulse" />
                      {gamePhase === 'VOTING' ? '투표 중' : '진행 중'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="relative space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-slate-900 mb-1">
                        {formatTime(timeRemaining)}
                      </div>
                      <div className="text-sm text-slate-600 flex items-center justify-center gap-1">
                        <Timer className="h-4 w-4" />
                        남은 시간
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-slate-900 mb-1">4/8</div>
                      <div className="text-sm text-slate-600 flex items-center justify-center gap-1">
                        <Users className="h-4 w-4" />
                        참여자
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-slate-900 mb-1">2/3</div>
                      <div className="text-sm text-slate-600 flex items-center justify-center gap-1">
                        <Trophy className="h-4 w-4" />
                        라운드
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>게임 진행률</span>
                      <span>{Math.round(((150 - timeRemaining) / 150) * 100)}%</span>
                    </div>
                    <Progress
                      value={((150 - timeRemaining) / 150) * 100}
                      className="h-3"
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
              <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            {/* 플레이어 목록 */}
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-500" />
                    플레이어 목록
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <AnimatePresence>
                      {players.map((player, index) => (
                        <motion.div
                          key={player.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ delay: index * 0.1 }}
                          className={`relative p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer hover:shadow-lg ${
                            player.isHost 
                              ? 'border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50' 
                              : player.isAlive 
                                ? 'border-slate-200 bg-white hover:border-blue-200' 
                                : 'border-red-200 bg-red-50 opacity-60'
                          }`}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {player.isHost && (
                            <div className="absolute -top-2 -right-2">
                              <Badge className="bg-amber-500 text-white shadow-lg">
                                <Crown className="h-3 w-3 mr-1" />
                                HOST
                              </Badge>
                            </div>
                          )}

                          {!player.isAlive && (
                            <div className="absolute inset-0 flex items-center justify-center bg-red-500/10 rounded-xl z-10">
                              <Badge variant="destructive" className="text-sm font-semibold">
                                탈락
                              </Badge>
                            </div>
                          )}

                          <div className="flex items-center space-x-3">
                            <Avatar className="h-12 w-12 ring-2 ring-white shadow-md">
                              <AvatarFallback className={`font-bold text-white ${
                                player.isHost 
                                  ? 'bg-gradient-to-br from-amber-400 to-orange-500'
                                  : player.role === 'CITIZEN'
                                    ? 'bg-gradient-to-br from-blue-400 to-blue-600'
                                    : player.role === 'LIAR'
                                      ? 'bg-gradient-to-br from-red-400 to-red-600'
                                      : 'bg-gradient-to-br from-gray-400 to-gray-600'
                              }`}>
                                {player.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>

                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-slate-900 truncate">{player.name}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                {player.role !== 'UNKNOWN' && (
                                  <Badge
                                    variant="outline"
                                    className={`text-xs ${
                                      player.role === 'CITIZEN' 
                                        ? 'bg-blue-50 text-blue-700 border-blue-200' 
                                        : 'bg-red-50 text-red-700 border-red-200'
                                    }`}
                                  >
                                    {player.role === 'CITIZEN' ? (
                                      <Shield className="h-3 w-3 mr-1" />
                                    ) : (
                                      <Zap className="h-3 w-3 mr-1" />
                                    )}
                                    {player.role === 'CITIZEN' ? '시민' : '라이어'}
                                  </Badge>
                                )}
                                <Badge variant="secondary" className="text-xs">
                                  <Star className="h-3 w-3 mr-1" />
                                  {player.score}점
                                </Badge>
                              </div>

                              {player.votesReceived > 0 && (
                                <div className="mt-2 space-y-1">
                                  <div className="flex justify-between text-xs text-slate-600">
                                    <span>받은 투표</span>
                                    <span>{player.votesReceived}/5</span>
                                  </div>
                                  <Progress
                                    value={(player.votesReceived / 5) * 100}
                                    className="h-1.5"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>

                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* 우측: 채팅 */}
          <motion.div variants={itemVariants}>
            <Card className="h-full flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-indigo-500" />
                  실시간 채팅
                  <Badge variant="secondary" className="ml-auto">
                    {messages.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col space-y-4">
                <div className="flex-1 border rounded-lg p-4 bg-slate-50 space-y-3 overflow-y-auto max-h-80">
                  <AnimatePresence>
                    {messages.map((msg, index) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, x: msg.isOwn ? 20 : -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ delay: index * 0.1 }}
                        className={`flex items-start space-x-2 ${msg.isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}
                      >
                        <Avatar className="h-6 w-6 flex-shrink-0">
                          <AvatarFallback className={`text-white text-xs ${
                            msg.isOwn 
                              ? 'bg-green-500' 
                              : msg.player === '플레이어1' 
                                ? 'bg-blue-500' 
                                : 'bg-purple-500'
                          }`}>
                            {msg.player.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`flex-1 ${msg.isOwn ? 'text-right' : ''}`}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-xs text-slate-700">{msg.player}</span>
                            <span className="text-xs text-slate-500">{msg.timestamp}</span>
                          </div>
                          <div className={`inline-block max-w-xs px-3 py-2 rounded-lg text-sm shadow-sm ${
                            msg.isOwn 
                              ? 'bg-blue-500 text-white rounded-br-sm' 
                              : 'bg-white text-slate-900 rounded-bl-sm'
                          }`}>
                            {msg.message}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>


                <div className="flex space-x-2">
                  <Input
                    type="text"
                    placeholder="메시지를 입력하세요..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleSendMessage()
                      }
                    }}
                    className="flex-1"
                  />
                  <Button
                    size="icon"
                    onClick={handleSendMessage}
                    className="bg-indigo-500 hover:bg-indigo-600 shadow-lg"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>


        {/* 하단: 게임 액션 버튼들 */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="flex flex-wrap gap-3">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <Target className="mr-2 h-5 w-5" />
                    투표하기
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="hover:bg-slate-50 transition-all duration-300"
                  >
                    <MessageSquare className="mr-2 h-5 w-5" />
                    토론 참여
                  </Button>
                  <Button
                    variant="secondary"
                    size="lg"
                    className="transition-all duration-300"
                  >
                    <Clock className="mr-2 h-5 w-5" />
                    시간 연장 요청
                  </Button>
                </div>

                <Separator orientation="vertical" className="h-8 hidden sm:block" />

                <div className="text-center">
                  <Badge className="bg-gradient-to-r from-emerald-500 to-green-600 text-white text-sm px-4 py-2">
                    <Trophy className="h-4 w-4 mr-2" />
                    라이어를 찾아라!
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* 푸터 */}
        <motion.div variants={itemVariants} className="mt-8 text-center">
