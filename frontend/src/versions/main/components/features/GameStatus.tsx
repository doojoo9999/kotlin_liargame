import * as React from "react"
import {motion} from "framer-motion"
import {Card, CardContent, CardHeader, CardTitle} from "@/versions/main/components/ui/card"
import {Badge} from "@/versions/main/components/ui/badge"
import {Progress} from "@/versions/main/components/ui/progress"
import {Separator} from "@/versions/main/components/ui/separator"
import {Clock, Shield, Target, Trophy, Users} from "lucide-react"
import {cn} from "@/versions/main/lib/utils"

export interface GameStatusProps {
  gamePhase: 'WAITING' | 'DISCUSSING' | 'VOTING' | 'REVEALING' | 'FINISHED'
  timeRemaining: number
  totalTime: number
  round: number
  maxRounds: number
  players: Array<{
    id: string
    nickname: string
    isAlive: boolean
    hasVoted?: boolean
    role?: 'CITIZEN' | 'LIAR'
  }>
  currentSubject?: string
  winner?: 'CITIZENS' | 'LIARS' | null
  className?: string
}

export function GameStatus({
  gamePhase,
  timeRemaining,
  totalTime,
  round,
  maxRounds,
  players,
  currentSubject,
  winner,
  className
}: GameStatusProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getPhaseInfo = () => {
    switch (gamePhase) {
      case 'WAITING':
        return { text: "게임 대기 중", color: "default", icon: Clock }
      case 'DISCUSSING':
        return { text: "토론 시간", color: "game-primary", icon: Users }
      case 'VOTING':
        return { text: "투표 시간", color: "game-danger", icon: Target }
      case 'REVEALING':
        return { text: "결과 발표", color: "game-warning", icon: Trophy }
      case 'FINISHED':
        return { text: "게임 종료", color: "default", icon: Trophy }
      default:
        return { text: "알 수 없음", color: "default", icon: Clock }
    }
  }

  const phaseInfo = getPhaseInfo()
  const PhaseIcon = phaseInfo.icon

  const alivePlayers = players.filter(p => p.isAlive)
  const votedPlayers = players.filter(p => p.hasVoted)
  const citizensAlive = alivePlayers.filter(p => p.role === 'CITIZEN').length
  const liarsAlive = alivePlayers.filter(p => p.role === 'LIAR').length

  const progressValue = totalTime > 0 ? (timeRemaining / totalTime) * 100 : 0

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-purple-500" />
          게임 현황
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 현재 페이즈 */}
        <div className="text-center space-y-2">
          <Badge
            variant={phaseInfo.color as any}
            className="text-lg px-4 py-2"
          >
            <PhaseIcon className="w-4 h-4 mr-2" />
            {phaseInfo.text}
          </Badge>

          {gamePhase !== 'WAITING' && gamePhase !== 'FINISHED' && (
            <div className="space-y-2">
              <div className="text-2xl font-bold font-mono text-center">
                {formatTime(timeRemaining)}
              </div>
              <Progress
                value={progressValue}
                animated={timeRemaining <= 30}
                className="h-2"
              />
            </div>
          )}
        </div>

        <Separator />

        {/* 라운드 정보 */}
        <div className="text-center">
          <div className="text-sm text-gray-600">라운드</div>
          <div className="text-xl font-bold">
            {round} / {maxRounds}
          </div>
        </div>

        {/* 주제어 */}
        {currentSubject && gamePhase !== 'WAITING' && (
          <>
            <Separator />
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-1">주제어</div>
              <div className="text-lg font-bold text-blue-600">
                {currentSubject}
              </div>
            </div>
          </>
        )}

        <Separator />

        {/* 플레이어 현황 */}
        <div className="space-y-3">
          <div className="text-sm font-medium flex items-center gap-2">
            <Users className="w-4 h-4" />
            플레이어 현황
          </div>

          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">
                {alivePlayers.length}
              </div>
              <div className="text-xs text-gray-600">생존</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">
                {players.length - alivePlayers.length}
              </div>
              <div className="text-xs text-gray-600">사망</div>
            </div>
          </div>

          {/* 역할별 현황 (게임 진행 중) */}
          {gamePhase === 'REVEALING' && (
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-blue-600">
                  {citizensAlive}
                </div>
                <div className="text-xs text-gray-600 flex items-center justify-center gap-1">
                  <Shield className="w-3 h-3" />
                  시민
                </div>
              </div>
              <div>
                <div className="text-lg font-bold text-red-600">
                  {liarsAlive}
                </div>
                <div className="text-xs text-gray-600 flex items-center justify-center gap-1">
                  <Target className="w-3 h-3" />
                  라이어
                </div>
              </div>
            </div>
          )}

          {/* 투표 현황 */}
          {gamePhase === 'VOTING' && (
            <div className="text-center">
              <div className="text-lg font-bold text-purple-600">
                {votedPlayers.length} / {alivePlayers.length}
              </div>
              <div className="text-xs text-gray-600">투표 완료</div>
            </div>
          )}
        </div>

        {/* 승부 결과 */}
        {winner && (
          <>
            <Separator />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-2"
            >
              <Trophy className="w-8 h-8 mx-auto text-yellow-500" />
              <Badge
                variant={winner === 'CITIZENS' ? 'game-success' : 'game-danger'}
                className="text-lg px-4 py-2"
              >
                {winner === 'CITIZENS' ? '시민 승리!' : '라이어 승리!'}
              </Badge>
            </motion.div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
