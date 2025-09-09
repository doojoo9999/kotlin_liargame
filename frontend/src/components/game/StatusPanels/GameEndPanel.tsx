import React, {useEffect, useState} from 'react'
import type {GameEndResponse, GameStatistics, PlayerResultInfo} from '@/types/realtime'
import {gameApi} from '@/api/gameApi'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Badge} from '@/components/ui/badge'
import {Button} from '@/components/ui/button'
import {AlertCircle, BarChart3, Crown, Trophy, Users} from 'lucide-react'
import {Alert, AlertDescription} from '@/components/ui/alert'

export interface GameEndPanelProps {
  gameNumber: number
  gameResult?: GameEndResponse
  onPlayAgain?: () => void
  onLeaveGame?: () => void
}

export const GameEndPanel: React.FC<GameEndPanelProps> = ({
  gameNumber,
  gameResult,
  onPlayAgain,
  onLeaveGame,
}) => {
  const [result, setResult] = useState<GameEndResponse | null>(gameResult || null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (gameNumber && !gameResult) {
      loadGameResult()
    }
  }, [gameNumber, gameResult])

  const loadGameResult = async () => {
    if (loading) return
    
    setLoading(true)
    try {
      const data = await gameApi.getRoundResults(gameNumber.toString())
      setResult(data)
      setError(null)
    } catch (err) {
      console.error('Failed to load game result:', err)
      setError('게임 결과를 불러올 수 없습니다.')
    } finally {
      setLoading(false)
    }
  }

  if (!result) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>게임 결과</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {loading && <div className="text-center">결과를 불러오는 중...</div>}
        </CardContent>
      </Card>
    )
  }

  const getWinnerBadgeColor = (winner: string) => {
    switch (winner) {
      case 'LIARS': return 'bg-red-100 text-red-800'
      case 'CITIZENS': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const renderPlayerList = (players: PlayerResultInfo[], title: string, icon: React.ReactNode) => (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium">
        {icon}
        <span>{title}</span>
        <Badge variant="outline">{players.length}명</Badge>
      </div>
      <div className="space-y-1">
        {players.map((player) => (
          <div key={player.userId} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded">
            <span>{player.nickname}</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600">{player.points}점</span>
              {!player.isAlive && <Badge variant="destructive" className="text-xs">제거됨</Badge>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderStatistics = (stats: GameStatistics) => (
    <div className="grid grid-cols-2 gap-4 text-sm">
      <div className="space-y-1">
        <div className="flex items-center gap-1 text-gray-600">
          <BarChart3 className="h-3 w-3" />
          <span>라운드</span>
        </div>
        <div>{stats.completedRounds} / {stats.totalRounds}</div>
      </div>
      <div className="space-y-1">
        <div className="flex items-center gap-1 text-gray-600">
          <Users className="h-3 w-3" />
          <span>총 투표</span>
        </div>
        <div>{stats.totalVotes}회</div>
      </div>
    </div>
  )

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Trophy className="h-5 w-5" />
          게임 결과
        </CardTitle>
        <div className="space-y-2">
          <Badge className={`px-4 py-2 text-base ${getWinnerBadgeColor(result.winner)}`}>
            {result.winner === 'LIARS' ? '라이어 승리!' : 
             result.winner === 'CITIZENS' ? '시민 승리!' : 
             '무승부'}
          </Badge>
          {result.citizenSubject && (
            <div className="text-sm text-gray-600">
              시민 주제: <strong>{result.citizenSubject}</strong>
            </div>
          )}
          {result.liarSubject && (
            <div className="text-sm text-gray-600">
              라이어 주제: <strong>{result.liarSubject}</strong>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* 플레이어 결과 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderPlayerList(
            result.citizens, 
            '시민팀', 
            <Crown className="h-4 w-4 text-blue-500" />
          )}
          {renderPlayerList(
            result.liars, 
            '라이어팀', 
            <Crown className="h-4 w-4 text-red-500" />
          )}
        </div>

        {/* 게임 통계 */}
        <div className="border-t pt-4">
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            게임 통계
          </h3>
          {renderStatistics(result.gameStatistics)}
        </div>

        {/* 액션 버튼 */}
        <div className="flex gap-2 pt-4 border-t">
          {onPlayAgain && (
            <Button onClick={onPlayAgain} className="flex-1">
              다시 플레이
            </Button>
          )}
          {onLeaveGame && (
            <Button onClick={onLeaveGame} variant="outline" className="flex-1">
              게임 나가기
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}