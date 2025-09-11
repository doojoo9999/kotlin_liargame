import * as React from 'react'
import * as PopoverPrimitive from '@radix-ui/react-popover'
import {cn} from '@/lib/utils'

export interface PopoverProps { trigger: React.ReactElement; children: React.ReactNode; align?: 'start'|'center'|'end'; side?: 'top'|'right'|'bottom'|'left' }
export const Popover: React.FC<PopoverProps> = ({trigger, children, align='center', side='bottom'}) => (
  <PopoverPrimitive.Root>
    <PopoverPrimitive.Trigger asChild>{trigger}</PopoverPrimitive.Trigger>
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content align={align} side={side} sideOffset={8} className={cn('z-50 rounded-lg border bg-background p-3 shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 w-64 max-w-xs')}>
        {children}
        <PopoverPrimitive.Arrow className="fill-background" />
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Portal>
  </PopoverPrimitive.Root>
)
void Popover

