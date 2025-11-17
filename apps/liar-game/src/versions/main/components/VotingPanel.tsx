import {useMemo, useState, type ChangeEvent} from 'react'
import {AnimatePresence, motion} from 'framer-motion'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Progress} from '@/components/ui/progress'
import {VotingPlayerCard} from './PlayerCard'
import {AlertCircle, Clock, LayoutGrid, List, Target, Users} from 'lucide-react'
import {cn} from '@/lib/utils'
import {Input} from '@/components/ui/input'

interface Player {
  id: string
  nickname: string
  isHost: boolean
  isReady: boolean
  isOnline: boolean
  isCurrentUser?: boolean
  hasVoted?: boolean
}

interface VotingPanelProps {
  players: Player[]
  selectedPlayerId?: string
  onVote: (playerId: string) => void
  onConfirm: () => void
  timeRemaining?: number
  totalTime?: number
  isLoading?: boolean
  hasVoted?: boolean
  votingResults?: Record<string, number>
  showResults?: boolean
  className?: string
}

export function VotingPanel({
  players,
  selectedPlayerId,
  onVote,
  onConfirm,
  timeRemaining,
  totalTime = 60,
  isLoading = false,
  hasVoted = false,
  votingResults,
  showResults = false,
  className
}: VotingPanelProps) {
  const [isConfirming, setIsConfirming] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchTerm, setSearchTerm] = useState('')
  const normalizedQuery = searchTerm.trim().toLowerCase()

  const filteredPlayers = useMemo(() => {
    const candidates = players.filter(player => showResults || !player.isCurrentUser)
    if (!normalizedQuery) {
      return candidates
    }
    return candidates.filter(player => player.nickname.toLowerCase().includes(normalizedQuery))
  }, [players, normalizedQuery, showResults])

  const orderedPlayers = useMemo(() => {
    return [...filteredPlayers].sort((a, b) => {
      const aValue = a.hasVoted ? 1 : 0
      const bValue = b.hasVoted ? 1 : 0
      return aValue - bValue
    })
  }, [filteredPlayers])
  
  // Calculate voting progress
  const votedCount = players.filter(p => p.hasVoted).length
  const totalPlayers = players.length
  const progressPercentage = (votedCount / totalPlayers) * 100

  // Time progress
  const timeProgressPercentage = timeRemaining && totalTime 
    ? (timeRemaining / totalTime) * 100 
    : 100

  const handleConfirmVote = async () => {
    if (!selectedPlayerId) return
    
    setIsConfirming(true)
    try {
      await onConfirm()
    } finally {
      setIsConfirming(false)
    }
  }

  const selectedPlayer = players.find(p => p.id === selectedPlayerId)

  const handleLayoutChange = (mode: 'grid' | 'list') => setViewMode(mode)
  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => setSearchTerm(event.target.value)

  return (
    <div className={cn("space-y-6", className)}>
      {/* Voting Header */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center mx-auto">
          <Target className="h-6 w-6 text-red-600 dark:text-red-400" />
        </div>
        <h2 className="text-2xl font-bold">투표 시간</h2>
        <p className="text-muted-foreground">
          누가 라이어라고 생각하나요? 신중하게 선택하세요!
        </p>
      </div>

      {/* Timer and Progress */}
      {(timeRemaining !== undefined || !showResults) && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            {/* Time Remaining */}
            {timeRemaining !== undefined && (
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    남은 시간
                  </span>
                  <span className="font-mono">
                    {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
                  </span>
                </div>
                <Progress 
                  value={timeProgressPercentage} 
                  className={cn(
                    "h-2",
                    timeRemaining < 10 ? "bg-red-100" : "bg-muted"
                  )}
                />
              </div>
            )}

            {/* Voting Progress */}
            {!showResults && (
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    투표 완료 인원
                  </span>
                  <span>{votedCount}/{totalPlayers}</span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Voting Instructions */}
      {!hasVoted && !showResults && (
        <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-700 dark:text-blue-300">
                <p className="font-medium mb-1">투표 안내:</p>
                <ul className="space-y-1 text-xs">
                  <li>• 의심되는 플레이어를 클릭해 선택하세요</li>
                  <li>• 자신에게는 투표할 수 없습니다</li>
                  <li>• 준비되면 투표를 확인하세요</li>
                  <li>• 한 번 확인하면 변경할 수 없습니다</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Player Selection */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="text-lg">
            {showResults ? '투표 결과' : '라이어 지목'}
              </CardTitle>
              {!showResults && (
                <CardDescription>
                  라이어라고 생각하는 플레이어를 클릭하세요
                </CardDescription>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {filteredPlayers.length}/{showResults ? players.length : players.filter(p => !p.isCurrentUser).length}명 표시
              </span>
              <div className="inline-flex rounded-md border bg-muted/40 p-1">
                <Button
                  type="button"
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => handleLayoutChange('grid')}
                  aria-pressed={viewMode === 'grid'}
                >
                  <span className="sr-only">격자 보기</span>
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => handleLayoutChange('list')}
                  aria-pressed={viewMode === 'list'}
                >
                  <span className="sr-only">목록 보기</span>
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Input
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="닉네임으로 검색"
              className="h-10"
            />
            <div
              className={cn(
                'min-h-[240px]',
                viewMode === 'grid'
                  ? 'grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 auto-rows-fr max-h-[60vh] overflow-y-auto pr-2'
                  : 'flex flex-col gap-2 max-h-[60vh] overflow-y-auto pr-2'
              )}
            >
              <AnimatePresence>
                {orderedPlayers.length === 0 ? (
                  <motion.div
                    key="empty"
                    className="col-span-full flex flex-col items-center justify-center text-center text-sm text-muted-foreground py-12"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    표시할 플레이어가 없습니다.
                  </motion.div>
                ) : (
                  orderedPlayers
                    .map((player) => (
                      <motion.div
                        key={player.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                      >
                        <VotingPlayerCard
                          player={player}
                          onVote={hasVoted || showResults ? undefined : onVote}
                          selected={selectedPlayerId === player.id}
                          disabled={isLoading || hasVoted}
                          showVoteCount={showResults}
                          votes={votingResults?.[player.id] || 0}
                          size={viewMode === 'grid' ? 'compact' : 'default'}
                        />
                      </motion.div>
                    ))
                )}
              </AnimatePresence>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Player Confirmation */}
      <AnimatePresence>
        {selectedPlayer && !hasVoted && !showResults && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      선택한 플레이어
                    </p>
                    <p className="text-lg font-semibold">
                      {selectedPlayer.nickname}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      정말 이 플레이어가 라이어인가요?
                    </p>
                  </div>
                  
                  <div className="flex gap-3 justify-center">
                    <Button
                      variant="outline"
                      onClick={() => onVote('')}
                      disabled={isLoading || isConfirming}
                    >
                      다시 선택
                    </Button>
                    <Button
                      onClick={handleConfirmVote}
                      disabled={isLoading || isConfirming}
                      className="min-w-24"
                    >
                      {isConfirming ? '확인 중...' : '투표 확인'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Vote Confirmed Message */}
      {hasVoted && !showResults && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
            <CardContent className="pt-6 text-center">
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mx-auto mb-3">
                <Target className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-green-700 dark:text-green-300 mb-2">
                투표 완료!
              </h3>
              <p className="text-sm text-green-600 dark:text-green-400">
                <strong>{selectedPlayer?.nickname}</strong> 님에게 투표했습니다.
                <br />
                다른 플레이어들의 투표를 기다리는 중...
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Results Summary */}
      {showResults && votingResults && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">최종 결과</CardTitle>
              <CardDescription>
                모두의 투표 현황입니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(votingResults)
                  .sort(([,a], [,b]) => b - a)
                  .map(([playerId, votes]) => {
                    const player = players.find(p => p.id === playerId)
                    if (!player) return null
                    
                    const percentage = (votes / totalPlayers) * 100
                    
                    return (
                      <div key={playerId} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                            {player.nickname[0]}
                          </div>
                          <span className="font-medium">{player.nickname}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold">
                            {votes}표
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {percentage.toFixed(0)}%
                          </div>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
