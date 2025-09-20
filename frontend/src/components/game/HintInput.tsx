import * as React from 'react'

export interface HintInputProps { maxLength: number; bannedWords: string[]; timeRemaining: number; onSubmit: (hint: string)=>void; onValidation?: (valid:boolean, reason?: string)=>void }

export const HintInput: React.FC<HintInputProps> = ({maxLength,bannedWords,timeRemaining,onSubmit,onValidation}) => {
  const [value,setValue] = React.useState('')
  const [error,setError] = React.useState<string | null>(null)

  const validate = (text: string) => {
    if(text.length===0) { setError('힌트를 입력하세요'); onValidation?.(false,'empty'); return false }
    if(text.length>maxLength) { setError(`최대 ${maxLength}자 초과`); onValidation?.(false,'length'); return false }
    const found = bannedWords.find(w=> text.toLowerCase().includes(w.toLowerCase()))
    if(found){ setError('금지어 포함'); onValidation?.(false,'banned'); return false }
    setError(null); onValidation?.(true); return true
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value; setValue(v); validate(v)
  }
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if(validate(value)){ onSubmit(value); setValue('') } }

  return (
    <form onSubmit={handleSubmit} className='space-y-2' aria-label='힌트 입력 폼'>
      <div className='flex gap-2'>
        <input value={value} onChange={handleChange} maxLength={maxLength} className='flex-1 rounded border px-3 py-2 text-sm' placeholder={`힌트 (최대 ${maxLength}자)`} aria-invalid={!!error} />
        <button type='submit' disabled={!!error || value.length===0} className='px-4 py-2 text-sm rounded bg-primary-600 text-white disabled:opacity-50'>전송</button>
      </div>
      <div className='flex items-center justify-between text-xs text-gray-500'>
        <span>{value.length}/{maxLength}</span>
        <span>남은시간 {timeRemaining}s</span>
      </div>
      {error && <p className='text-xs text-red-600'>{error}</p>}
    </form>
  )
}
void HintInput

