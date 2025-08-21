import type {GameStateResponse} from '../../room/types';
import {SpeechPhase} from './SpeechPhase';
import {VotePhase} from './VotePhase';

interface GameInProgressProps {
  gameState: GameStateResponse;
}

export function GameInProgress({ gameState }: GameInProgressProps) {
  switch (gameState.currentPhase) {
    case 'SPEECH':
      return <SpeechPhase gameState={gameState} />;
    case 'VOTE':
      return <VotePhase gameState={gameState} />;
    // TODO: Add cases for other phases like DEFENSE, FINAL_VOTE, etc.
    default:
      return <div>Current Phase: {gameState.currentPhase}</div>;
  }
}
