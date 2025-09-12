import * as React from 'react'
import {cn} from '@/lib/utils'

export interface FormFieldProps { name: string; label?: string; helperText?: string; error?: string; children: React.ReactNode; className?: string }
export function FormField({name,label,helperText,error,children,className}: FormFieldProps) {
  return (
    <div className={cn('space-y-1', className)} data-field={name}>
      {label && <label htmlFor={name} className='block text-xs font-medium text-gray-600'>{label}</label>}
      {children}
      {error ? <p className='text-[11px] text-red-600'>{error}</p> : helperText && <p className='text-[11px] text-gray-500'>{helperText}</p>}
    </div>
  )
}
void FormField
