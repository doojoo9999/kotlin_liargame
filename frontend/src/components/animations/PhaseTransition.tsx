import * as React from 'react'
import {AnimatePresence, motion} from 'framer-motion'
import {phaseTransition} from '@/animations/variants'

export interface PhaseTransitionProps { phaseKey: string; children: React.ReactNode }
export const PhaseTransition: React.FC<PhaseTransitionProps> = ({phaseKey,children}) => (
  <AnimatePresence mode='wait'>
    <motion.div key={phaseKey} variants={phaseTransition} initial='initial' animate='animate' exit='exit' className='w-full'>
      {children}
    </motion.div>
  </AnimatePresence>
)
void PhaseTransition

