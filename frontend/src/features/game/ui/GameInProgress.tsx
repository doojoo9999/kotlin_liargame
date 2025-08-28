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
import {useUserStore} from '../../../shared/stores/userStore';

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
  const currentUserNickname = useUserStore((state) => state.nickname);
  const showTimer = ['SPEECH', 'VOTE', 'DEFENSE', 'FINAL_VOTE', 'LIAR_GUESS'].includes(gameState.currentPhase) && gameState.phaseEndTime;

  // 채팅 입력 제한 로직
  const isChatDisabled = () => {
    // 게임이 종료되었거나 채팅이 비활성화된 경우
    if (!gameState.isChatAvailable || gameState.currentPhase === 'ENDED') {
      return true;
    }

    // SPEECH 페이즈에서는 현재 턴인 사람만 채팅 가능
    if (gameState.currentPhase === 'SPEECH') {
      // 현재 턴인 플레이어의 닉네임 확인
      const currentPlayerTurnNickname =
        gameState.turnOrder && gameState.currentTurnIndex != null
          ? gameState.turnOrder[gameState.currentTurnIndex]
          : null;

      // 현재 턴이 아닌 사람은 채팅 비활성화
      return currentUserNickname !== currentPlayerTurnNickname;
    }

    return false;
  };

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
          <ChatBox
            messages={messages}
            onSendMessage={sendMessage}
            disabled={isChatDisabled()}
          />
        </Stack>
      </Grid.Col>
    </Grid>
  );
}
