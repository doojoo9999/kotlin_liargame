/**
 * Icon mapping for ActionGuide component
 * Maps icon keys to lucide-react icon components
 */

import {
    CheckCircle as CheckIcon,
    Clock as WaitIcon,
    Edit as CreateIcon,
    HelpCircle as QuizIcon,
    Keyboard as KeyboardIcon,
    Lightbulb as HintIcon,
    Play as PlayIcon,
    Shield as DefenseIcon,
    Vote as VoteIcon
} from 'lucide-react'

/**
 * Maps icon keys to lucide-react icon React elements
 * Used by ActionGuide component to resolve iconKey strings to actual icons
 */
export const actionIcons = {
    play: PlayIcon,
    wait: WaitIcon,
    vote: VoteIcon,
    defense: DefenseIcon,
    hint: HintIcon,
    quiz: QuizIcon,
    check: CheckIcon,
    keyboard: KeyboardIcon,
    create: CreateIcon
}

/**
 * Gets an icon component by key with fallback
 * @param {string} iconKey - The icon key to look up
 * @returns {React.ComponentType} The icon component
 */
export function getIconByKey(iconKey) {
    return actionIcons[iconKey] || actionIcons.play
}