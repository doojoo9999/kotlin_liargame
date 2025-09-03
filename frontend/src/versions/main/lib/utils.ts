import {type ClassValue, clsx} from "clsx"
import {twMerge} from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export function getPlayerStatusColor(status: string): string {
  switch (status) {
    case 'online': return 'bg-green-500';
    case 'offline': return 'bg-gray-500';
    case 'away': return 'bg-yellow-500';
    case 'playing': return 'bg-blue-500';
    default: return 'bg-gray-500';
  }
}

export function getGamePhaseColor(phase: string): string {
  switch (phase) {
    case 'WAITING_FOR_PLAYERS': return 'bg-yellow-500';
    case 'SPEECH': return 'bg-blue-500';
    case 'VOTING_FOR_LIAR': return 'bg-orange-500';
    case 'DEFENDING': return 'bg-purple-500';
    case 'VOTING_FOR_SURVIVAL': return 'bg-red-500';
    case 'GUESSING_WORD': return 'bg-indigo-500';
    case 'GAME_OVER': return 'bg-gray-500';
    default: return 'bg-gray-500';
  }
}
