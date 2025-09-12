import React from 'react'
import {Input} from '@/components/ui/input'
import {Button} from '@/components/ui/button'
import {useGameStoreV2} from '@/stores/gameStoreV2'

export function GuessPhase() {
  const { gameData, submitGuess } = useGameStoreV2(s => ({ gameData: s.gameData, submitGuess: s.submitGuess }))
  const [text, setText] = React.useState('')
  const disabled = !!gameData.guessAttempt
  const onSubmit = (e: React.FormEvent) => { e.preventDefault(); if(!text.trim()||disabled) return; submitGuess(text.trim()); setText('') }
  return (
    <div className="space-y-3" aria-label="정답 추측">
      <form onSubmit={onSubmit} className="space-y-2">
        <Input value={text} onChange={(e)=> setText(e.target.value.slice(0,40))} placeholder="정답을 추측하세요" aria-label="정답 입력" disabled={disabled} />
        <Button type="submit" className="w-full" disabled={disabled || !text.trim()}>추측 제출</Button>
      </form>
      {gameData.guessAttempt && (
        <div className={`p-3 rounded border text-sm ${gameData.guessAttempt.correct? 'border-green-300 bg-green-50':'border-red-300 bg-red-50'}`} aria-live="polite">
          <span className="font-semibold mr-2">결과:</span>
          {gameData.guessAttempt.correct? '정답입니다!' : '틀렸습니다.'} ("{gameData.guessAttempt.word}")
        </div>
      )}
    </div>
  )
}
