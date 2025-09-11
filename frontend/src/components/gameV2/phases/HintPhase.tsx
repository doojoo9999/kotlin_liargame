import React from 'react'
import {Input} from '@/components/ui/input'
import {Button} from '@/components/ui/button'

export function HintPhase({ onSubmit }: { onSubmit: (text: string) => void }) {
  const [text, setText] = React.useState('')
  return (
    <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (text.trim()) onSubmit(text.trim()); setText('') }}>
      <Input value={text} onChange={(e) => setText(e.target.value.slice(0, 20))} placeholder="힌트(최대 20자)" aria-label="힌트 입력" />
      <Button type="submit" className="w-full">힌트 제출</Button>
    </form>
  )
}

