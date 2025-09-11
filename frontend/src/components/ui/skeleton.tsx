import * as React from 'react'
import {cn} from '@/lib/utils'

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement>{ radius?: string }
export const Skeleton: React.FC<SkeletonProps> = ({className, style, radius='4px', ...rest}) => (
  <div className={cn('animate-pulse bg-gray-200 dark:bg-gray-700', className)} style={{borderRadius: radius, ...style}} {...rest} />
)
void Skeleton

