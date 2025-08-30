import {Grid, Stack} from '@mantine/core';
import {useChatSocket} from '../../chat';
import type {GameStateResponse} from '../../room/types';
import {Timer} from '../../../shared/ui/Timer';
import {PlayerList} from './PlayerList';
import {DefensePhase} from './DefensePhase';
import {FinalVotePhase} from './FinalVotePhase';
import {GameEndedPhase} from './GameEndedPhase';
import {LiarGuessPhase} from './LiarGuessPhase';
import {SpeechPhase} from './SpeechPhase';
import {VotePhase} from './VotePhase';
import {HintHistory} from './HintHistory';
import {Scoreboard} from './Scoreboard';

interface GameInProgressProps {
  gameState: GameStateResponse;
}

const PhaseComponent = ({ gameState }: { gameState: GameStateResponse }) => {
  switch (gameState.currentPhase) {
    case 'SPEECH':
      return <SpeechPhase gameState={gameState} />;
    case 'VOTING_FOR_LIAR':
      return <VotePhase gameState={gameState} />;
    case 'DEFENDING':
      return <DefensePhase gameState={gameState} />;
    case 'VOTING_FOR_SURVIVAL':
      return <FinalVotePhase gameState={gameState} />;
    case 'GUESSING_WORD':
      return <LiarGuessPhase gameState={gameState} />;
    case 'GAME_OVER':
      return <GameEndedPhase gameState={gameState} />;
    case 'WAITING_FOR_PLAYERS':
      return <div>플레이어를 기다리는 중...</div>;
    default:
      console.warn('[PhaseComponent] Unknown phase:', gameState.currentPhase);
      return <div>Current Phase: {gameState.currentPhase}</div>;
  }
};

export function GameInProgress({ gameState }: GameInProgressProps) {
  const { messages } = useChatSocket(gameState.gameNumber);
  const showTimer = [
    'SPEECH',
    'VOTING_FOR_LIAR',
    'DEFENDING',
    'VOTING_FOR_SURVIVAL',
    'GUESSING_WORD'
  ].includes(gameState.currentPhase) && gameState.phaseEndTime;

  return (
    <Grid>
      <Grid.Col span={{ base: 12, md: 8 }}>
        <Stack>
          {showTimer && (
            <Timer
              key={gameState.currentPhase} // Reset timer when phase changes
              endTime={gameState.phaseEndTime}
            />
          )}
          <PhaseComponent gameState={gameState} />
        </Stack>
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 4 }}>
        <Stack>
          <PlayerList players={gameState.players} gameOwner={gameState.gameOwner} />
          <Scoreboard gameState={gameState} />
          <HintHistory
            messages={messages}
            gameState={gameState}
          />
        </Stack>
      </Grid.Col>
    </Grid>
  );
}
