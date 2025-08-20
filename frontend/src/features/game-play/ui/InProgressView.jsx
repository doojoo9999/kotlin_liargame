import {Text} from '@mantine/core';
import {HintPhase} from '@/features/give-hint/ui/HintPhase';
import {VotePhase} from '@/features/vote/ui/VotePhase';
import {DefensePhase} from '@/features/defense/ui/DefensePhase';
import {FinalVotePhase} from '@/features/final-vote/ui/FinalVotePhase';

export const InProgressView = ({ gameState }) => {
  switch (gameState.currentPhase) {
    case 'GIVING_HINTS':
      return <HintPhase gameState={gameState} />;
    case 'VOTING_FOR_LIAR':
      return <VotePhase gameState={gameState} />;
    case 'DEFENDING':
      return <DefensePhase gameState={gameState} />;
    case 'VOTING_FOR_SURVIVAL':
      return <FinalVotePhase gameState={gameState} />;
    default:
      return <Text>Unknown game phase: {gameState.currentPhase}</Text>;
  }
};
