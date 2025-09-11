import * as React from 'react'
import {FormField} from './FormField'

export interface HintFormFieldProps { value: string; onChange: (v:string)=>void; maxLength: number; bannedWords: string[]; placeholder?: string; timeRemaining: number; autoFocus?: boolean }

export const HintFormField: React.FC<HintFormFieldProps> = ({value,onChange,maxLength,bannedWords,placeholder='힌트 입력',timeRemaining,autoFocus}) => {
  const [error,setError] = React.useState<string | undefined>()
  const validate = (val: string) => {
    if(val.length===0) return '필수 입력'
    if(val.length>maxLength) return `최대 ${maxLength}자`
    const bad = bannedWords.find(w=> val.toLowerCase().includes(w.toLowerCase()))
    if(bad) return '금지어 포함'
    return undefined
  }
  React.useEffect(()=> { setError(validate(value)) },[value,maxLength,bannedWords])
  return (
    <FormField name='hint' label='힌트' error={error} helperText={`남은시간 ${timeRemaining}s`}>
      <input autoFocus={autoFocus} value={value} onChange={e=>onChange(e.target.value)} maxLength={maxLength} placeholder={placeholder} aria-invalid={!!error} className='w-full rounded border px-3 py-2 text-sm'/>
    </FormField>
  )
}
void HintFormField

