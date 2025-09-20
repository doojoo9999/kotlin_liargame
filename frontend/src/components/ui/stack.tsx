import * as React from 'react'
import {cn} from '@/lib/utils'

export interface StackProps extends React.HTMLAttributes<HTMLDivElement>{ direction?: 'row'|'col'; gap?: string }
export const Stack = React.forwardRef<HTMLDivElement, StackProps>(({direction='col',gap='0.75rem',className,style,...rest},ref)=>(
  <div ref={ref} className={cn('flex', direction==='col'?'flex-col':'flex-row', className)} style={{gap,...style}} {...rest} />
))
Stack.displayName='Stack'
void Stack

