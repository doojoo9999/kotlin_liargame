import React, {useMemo} from 'react'
import type {ConnectionStatusResponse, PlayerConnectionStatus} from '@/types/realtime'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Badge} from '@/components/ui/badge'
import {Progress} from '@/components/ui/progress'
import {Plug, PlugZap, Timer} from 'lucide-react'

export interface ConnectionStatusPanelProps {
  status?: ConnectionStatusResponse
  showList?: boolean
}

function formatRemainSeconds(iso?: string) {
  if (!iso) return ''
  const end = new Date(iso).getTime()
  const remain = Math.max(0, Math.floor((end - Date.now()) / 1000))
  return `${remain}s`
}

function StatePill({ s }: { s: PlayerConnectionStatus }) {
  const color = s.connectionState === 'CONNECTED'
    ? 'bg-green-100 text-green-800'
    : s.connectionState === 'GRACE_PERIOD'
      ? 'bg-orange-100 text-orange-800'
      : 'bg-red-100 text-red-800'
  return (
    <span className={`text-xs px-2 py-0.5 rounded ${color}`}>
      {s.connectionState}
    </span>
  )
}

export const ConnectionStatusPanel: React.FC<ConnectionStatusPanelProps> = ({ status, showList = true }) => {
  const pct = useMemo(() => {
    if (!status) return 0
    if (status.totalCount === 0) return 0
    return (status.connectedCount / status.totalCount) * 100
  }, [status])

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Plug className="h-4 w-4" />
          연결 상태
          <Badge variant="secondary" className="ml-2">
            {status?.connectedCount ?? 0} / {status?.totalCount ?? 0}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Progress value={pct} />
        {showList && (
          <div className="space-y-2 text-sm">
            {(status?.playerStatuses ?? []).map((p) => (
              <div key={p.playerId} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PlugZap className="h-4 w-4 opacity-70" />
                  <span>{p.nickname}</span>
                </div>
                <div className="flex items-center gap-2">
                  {p.connectionState === 'GRACE_PERIOD' && (
                    <div className="flex items-center gap-1 text-xs text-orange-700">
                      <Timer className="h-3 w-3" />
                      {formatRemainSeconds(p.gracePeriodEndsAt)}
                    </div>
                  )}
                  <StatePill s={p} />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

