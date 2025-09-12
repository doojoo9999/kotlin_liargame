import * as React from 'react'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import {cn} from '@/lib/utils'

export interface TooltipProps { content: React.ReactNode; children: React.ReactElement; openDelay?: number; closeDelay?: number }

export const Tooltip: React.FC<TooltipProps> = ({content, children, openDelay=300, closeDelay=100}) => (
  <TooltipPrimitive.Provider delayDuration={openDelay} skipDelayDuration={closeDelay}>
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content sideOffset={6} className={cn('z-50 rounded-md bg-gray-900 px-2 py-1 text-xs text-white shadow-lg animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95')}>
          {content}
          <TooltipPrimitive.Arrow className="fill-gray-900" />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  </TooltipPrimitive.Provider>
)
void Tooltip

