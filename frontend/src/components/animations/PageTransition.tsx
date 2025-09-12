import * as React from 'react'
import {AnimatePresence, motion} from 'framer-motion'
import {pageSlide} from '@/animations/variants'

export interface PageTransitionProps { children: React.ReactNode; routeKey: string }
export const PageTransition: React.FC<PageTransitionProps> = ({children,routeKey}) => (
  <AnimatePresence mode='wait'>
    <motion.div key={routeKey} variants={pageSlide} initial='initial' animate='animate' exit='exit' style={{height:'100%'}}>
      {children}
    </motion.div>
  </AnimatePresence>
)
void PageTransition

