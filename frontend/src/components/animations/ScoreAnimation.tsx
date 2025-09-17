import * as React from 'react'
import {AnimatePresence, motion} from 'framer-motion'
import {scoreUpdate} from '@/animations/variants'

export interface ScoreAnimationProps { value: number }
export const ScoreAnimation: React.FC<ScoreAnimationProps> = ({value}) => {
  const [display,setDisplay] = React.useState(value)
  React.useEffect(()=>{ setDisplay(value) },[value])
  return (
    <AnimatePresence mode='popLayout'>
      <motion.span key={display} variants={scoreUpdate} initial='initial' animate='animate' exit='exit' className='inline-block'>
        {display}
      </motion.span>
    </AnimatePresence>
  )
}
void ScoreAnimation

