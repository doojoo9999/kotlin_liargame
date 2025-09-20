import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Badge} from '@/components/ui/badge'
import {Separator} from '@/components/ui/separator'
import {Info, Keyboard, ShieldAlert} from 'lucide-react'

const quickShortcuts = [
  { key: 'Enter', description: '텍스트 입력 후 빠르게 제출' },
  { key: 'Shift + Enter', description: '입력창에서 줄바꿈' },
  { key: 'Tab', description: '투표 후보 사이를 이동' }
]

export function GameHelpPanel() {
  return (
    <Card aria-labelledby="gameplay-help-heading">
      <CardHeader>
        <CardTitle id="gameplay-help-heading" className="flex items-center gap-2 text-base font-semibold">
          <Info className="h-4 w-4" aria-hidden="true" />
          도움말 & 규칙
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-muted-foreground">
        <section aria-labelledby="gameplay-rules-heading">
          <h3 id="gameplay-rules-heading" className="mb-2 text-sm font-semibold text-foreground">기본 규칙</h3>
          <ul className="space-y-1 list-disc pl-5">
            <li>주제는 모두에게 공개되지만 라이어는 비밀 단어를 볼 수 없습니다.</li>
            <li>각 라운드의 타이머가 종료되면 입력이 자동으로 마감됩니다.</li>
            <li>부적절한 표현은 신고 대상이며 운영자 검토 후 제재될 수 있습니다.</li>
          </ul>
        </section>

        <Separator />

        <section aria-labelledby="gameplay-shortcuts-heading" className="space-y-2">
          <div className="flex items-center gap-2">
            <Keyboard className="h-4 w-4" aria-hidden="true" />
            <h3 id="gameplay-shortcuts-heading" className="text-sm font-semibold text-foreground">빠른 조작</h3>
          </div>
          <ul className="space-y-1">
            {quickShortcuts.map((shortcut) => (
              <li key={shortcut.key} className="flex items-center justify-between gap-4 rounded-md border border-border/60 bg-muted/40 px-3 py-2">
                <Badge variant="secondary" className="font-mono text-xs uppercase tracking-wide">
                  {shortcut.key}
                </Badge>
                <span className="text-xs text-muted-foreground">{shortcut.description}</span>
              </li>
            ))}
          </ul>
        </section>

        <Separator />

        <section aria-labelledby="gameplay-safety-heading" className="space-y-2">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4" aria-hidden="true" />
            <h3 id="gameplay-safety-heading" className="text-sm font-semibold text-foreground">안전 안내</h3>
          </div>
          <p>
            네트워크가 불안정하면 화면 상단의 연결 상태 인디케이터에서 재연결을 시도할 수 있습니다.
            문제를 발견하면 채팅 신고 버튼을 사용하거나 운영자에게 알려주세요.
          </p>
        </section>
      </CardContent>
    </Card>
  )
}
