import {Fragment} from 'react'
import {motion} from 'framer-motion'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Badge} from '@/components/ui/badge'
import {Separator} from '@/components/ui/separator'
import type {Player, RoundSummaryEntry} from '@/stores/unified/types'

interface RoundSummaryPanelProps {
  summary: RoundSummaryEntry
  history: RoundSummaryEntry[]
  players: Player[]
}

const summaryVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25 } },
}

export function RoundSummaryPanel({ summary, history, players }: RoundSummaryPanelProps) {
  const resolveNickname = (playerId?: string | null) => {
    if (!playerId) return undefined
    const player = players.find((p) => p.id === playerId || String(p.userId) === playerId)
    return player?.nickname
  }

  const suspectedNickname = resolveNickname(summary.suspectedPlayerId)

  return (
    <motion.div variants={summaryVariants} initial="hidden" animate="visible">
      <Card className="border-primary/30">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <CardTitle className="text-lg">
              라운드 {summary.round} 결과 정리
            </CardTitle>
            <div className="flex flex-wrap gap-2 text-sm">
              <Badge variant="secondary">{new Date(summary.concludedAt).toLocaleTimeString()}</Badge>
              {summary.topic && <Badge variant="outline">주제: {summary.topic}</Badge>}
            </div>
          </div>
          {suspectedNickname && (
            <p className="mt-2 text-sm text-muted-foreground">
              최종 라이어 후보: <span className="font-medium text-foreground">{suspectedNickname}</span>
            </p>
          )}
        </CardHeader>
        <Separator className="mx-6" />
        <CardContent className="pt-4">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">점수 현황</h3>
              <div className="space-y-2">
                {summary.scoreboard.slice(0, 5).map((entry, index) => (
                  <div
                    key={`${entry.playerId}-${index}`}
                    className="flex items-center justify-between rounded-md border border-border/60 bg-card/50 px-3 py-2 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant={index === 0 ? 'default' : 'secondary'}>{index + 1}위</Badge>
                      <span>{entry.nickname}</span>
                    </div>
                    <div className="text-sm font-semibold text-foreground">{entry.score}점</div>
                  </div>
                ))}
                {summary.scoreboard.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    점수 데이터가 아직 없습니다. 다음 라운드를 기다려 주세요.
                  </p>
                )}
              </div>
            </div>

            {history.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-2">이전 라운드 기록</h3>
                <div className="space-y-3 text-xs text-muted-foreground">
                  {history.map((record) => (
                    <Fragment key={`${record.round}-${record.concludedAt}`}>
                      <div className="rounded-md border border-dashed border-border/70 p-3">
                        <div className="flex items-center justify-between font-medium text-foreground">
                          <span>라운드 {record.round}</span>
                          {record.topic && <span className="text-xs">주제: {record.topic}</span>}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {record.scoreboard.slice(0, 3).map((entry, index) => (
                            <Badge key={`${record.round}-${entry.playerId}-${index}`} variant="outline">
                              {entry.nickname} {entry.score}점
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </Fragment>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
