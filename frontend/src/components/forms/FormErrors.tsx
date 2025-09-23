import * as React from 'react'

export interface FormErrorsProps { errors: Record<string,string>; order?: string[]; className?: string }
export const FormErrors: React.FC<FormErrorsProps> = ({errors,order,className}) => {
  const keys = order?.length ? order.filter(k=>errors[k]) : Object.keys(errors).filter(k=>errors[k])
  if(keys.length===0) return null
  return (
    <ul className={className} aria-live='polite'>
      {keys.map(k=> <li key={k} className='text-xs text-red-600'>{errors[k]}</li>)}
    </ul>
  )
}
void FormErrors

