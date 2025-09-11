import * as React from 'react'
import {cn} from '@/lib/utils'

export interface TouchButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> { haptic?: boolean; activeScale?: number }

export const TouchButton = React.forwardRef<HTMLButtonElement, TouchButtonProps>(({className,haptic=true,activeScale=0.96, onClick, ...rest}, ref) => {
  const [pressed,setPressed] = React.useState(false)
  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => { setPressed(true); if(haptic && 'vibrate' in navigator) navigator.vibrate?.(10); rest.onPointerDown?.(e) }
  const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => { setPressed(false); rest.onPointerUp?.(e) }
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => { onClick?.(e) }
  return (
    <button
      ref={ref}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={()=>setPressed(false)}
      onClick={handleClick}
      className={cn('select-none active:opacity-90 transition-transform rounded-md px-4 py-2 text-sm font-medium bg-primary-600 text-white shadow', className)}
      style={pressed?{transform:`scale(${activeScale})`}:undefined}
      {...rest}
    />
  )
})
TouchButton.displayName='TouchButton'
void TouchButton

