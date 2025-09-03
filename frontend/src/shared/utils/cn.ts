import {type ClassValue, clsx} from "clsx"
import {twMerge} from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

export function getPlayerStatusColor(isAlive: boolean, isCurrentTurn: boolean): string {
  if (!isAlive) return "text-muted-foreground"
  if (isCurrentTurn) return "text-turn-active"
  return "text-foreground"
}

export function getGamePhaseColor(phase: string): string {
  const phaseColors: Record<string, string> = {
    WAITING_FOR_PLAYERS: "text-game-waiting",
    SPEECH: "text-game-progress",
    VOTING_FOR_LIAR: "text-destructive",
    DEFENDING: "text-role-liar",
    VOTING_FOR_SURVIVAL: "text-destructive",
    GUESSING_WORD: "text-role-liar",
    GAME_OVER: "text-game-ended"
  }
  return phaseColors[phase] || "text-foreground"
}
