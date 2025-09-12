import * as React from 'react'
import {FormField} from './FormField'

export interface DefenseTextAreaProps { value: string; onChange: (v:string)=>void; maxLength: number; minLength: number; placeholder?: string; rows?: number }

export const DefenseTextArea: React.FC<DefenseTextAreaProps> = ({value,onChange,maxLength,minLength,placeholder='변론을 입력',rows=5}) => {
  const [error,setError] = React.useState<string | undefined>()
  React.useEffect(()=> {
    if(value.length < minLength) setError(`최소 ${minLength}자`)
    else if(value.length > maxLength) setError(`최대 ${maxLength}자 초과`)
    else setError(undefined)
  },[value,minLength,maxLength])
  return (
    <FormField name='defense' label='변론' error={error} helperText={`${value.length}/${maxLength}`}>
      <textarea value={value} onChange={e=>onChange(e.target.value)} rows={rows} maxLength={maxLength} className='w-full rounded border px-3 py-2 text-sm resize-y' placeholder={placeholder} aria-invalid={!!error} />
    </FormField>
  )
}
void DefenseTextArea

