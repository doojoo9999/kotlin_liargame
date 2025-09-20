import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Badge} from '@/components/ui/badge'
import type {ScoreboardEntry} from '@/types/backendTypes'

interface GameplayScoreboardProps {
  entries: ScoreboardEntry[]
}

export function GameplayScoreboard({ entries }: GameplayScoreboardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">점수 현황</CardTitle>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">점수 데이터가 아직 없습니다. 라운드가 진행되면 자동으로 채워집니다.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {entries.map((entry) => (
              <li key={entry.userId} className="flex items-center justify-between rounded-md border border-border/60 p-3">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary">{entry.nickname}</Badge>
                  {!entry.isAlive && <Badge variant="destructive">탈락</Badge>}
                </div>
                <span className="text-base font-semibold text-foreground">{entry.score}점</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
