import {ArrowLeft, Gamepad2, Users} from 'lucide-react'
import {Badge} from '@/components/ui/badge'
import {Button} from '@/components/ui/button'

interface GameplayHeaderProps {
  gameNumber: number | null
  mode: string | null
  roundCurrent: number
  roundTotal: number
  onLeave: () => void
}

export function GameplayHeader({ gameNumber, mode, roundCurrent, roundTotal, onLeave }: GameplayHeaderProps) {
  return (
    <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Gamepad2 className="h-4 w-4" aria-hidden="true" />
          <span>라이어 게임 실시간 매치</span>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xl font-semibold">
          <span>게임 #{gameNumber ?? '—'}</span>
          {mode && (
            <Badge variant="secondary" className="uppercase tracking-wide">{mode}</Badge>
          )}
          <div className="flex items-center gap-2 text-sm font-normal text-muted-foreground">
            <Users className="h-4 w-4" aria-hidden="true" />
            <span>라운드 {roundCurrent} / {Math.max(roundTotal, roundCurrent || 1)}</span>
          </div>
        </div>
      </div>
      <Button variant="ghost" size="sm" onClick={onLeave} className="self-start md:self-auto">
        <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
        로비로 돌아가기
      </Button>
    </header>
  )
}
