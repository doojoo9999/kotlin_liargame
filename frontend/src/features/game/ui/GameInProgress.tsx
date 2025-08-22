import {Grid, Stack} from '@mantine/core';
import {ChatBox, useChatSocket} from '../../chat';
import type {GameStateResponse} from '../../room/types';
import {Timer} from '../../../shared/ui/Timer';
import {PlayerList} from './PlayerList';
import {DefensePhase} from './DefensePhase';
import {FinalVotePhase} from './FinalVotePhase';
import {GameEndedPhase} from './GameEndedPhase';
import {LiarGuessPhase} from './LiarGuessPhase';
import {SpeechPhase} from './SpeechPhase';
import {VotePhase} from './VotePhase';

interface GameInProgressProps {
  gameState: GameStateResponse;
}

const PhaseComponent = ({ gameState }: { gameState: GameStateResponse }) => {
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
};

export function GameInProgress({ gameState }: GameInProgressProps) {
  const { messages, sendMessage } = useChatSocket(gameState.gameNumber);
  const showTimer = ['SPEECH', 'VOTE', 'DEFENSE', 'FINAL_VOTE', 'LIAR_GUESS'].includes(gameState.currentPhase) && gameState.phaseEndTime;

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
          {gameState.isChatAvailable && <ChatBox messages={messages} onSendMessage={sendMessage} />}
        </Stack>
      </Grid.Col>
    </Grid>
  );
}
