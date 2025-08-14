/**
 * Icon mapping for ActionGuide component
 * Maps icon keys to MUI icon components
 */

import {
    CheckCircle as CheckIcon,
    Create as CreateIcon,
    HowToVote as VoteIcon,
    Keyboard as KeyboardIcon,
    Lightbulb as HintIcon,
    PlayArrow as PlayIcon,
    Quiz as QuizIcon,
    Schedule as WaitIcon,
    Security as DefenseIcon
} from '@mui/icons-material'

/**
 * Maps icon keys to MUI icon React elements
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