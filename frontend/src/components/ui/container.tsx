import * as React from 'react'
import {cn} from '@/lib/utils'

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> { fluid?: boolean; maxWidth?: string }
export const Container = React.forwardRef<HTMLDivElement, ContainerProps>(({fluid, maxWidth='1280px', className, ...rest}, ref) => (
  <div ref={ref} className={cn('mx-auto w-full px-4', !fluid && 'container', className)} style={!fluid ? {maxWidth} : undefined} {...rest} />
))
Container.displayName='Container'

