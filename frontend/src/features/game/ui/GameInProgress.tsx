import {DefensePhase} from './DefensePhase';
import {FinalVotePhase} from './FinalVotePhase';
import {GameEndedPhase} from './GameEndedPhase';
import {LiarGuessPhase} from './LiarGuessPhase';
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
    case 'DEFENSE':
      return <DefensePhase gameState={gameState} />;
    case 'FINAL_VOTE':
      return <FinalVotePhase gameState={gameState} />;
    case 'LIAR_GUESS':
      return <LiarGuessPhase gameState={gameState} />;
    case 'ENDED':
      return <GameEndedPhase gameState={gameState} />;
    default:
      return <div>Current Phase: {gameState.currentPhase}</div>;
  }
}
