import type {Transition} from 'framer-motion'

export const fast: Transition = {duration: 0.15, ease: 'easeOut'}
export const normal: Transition = {duration: 0.3, ease: 'easeInOut'}
export const slow: Transition = {duration: 0.5, ease: 'easeInOut'}

export const transitions = { fast, normal, slow }
void transitions

