import React, {useState} from 'react';
import {useGame} from '../../hooks/useGame';
import {Alert, Button, Group, Paper, Stack, Text, TextInput, Title} from '@mantine/core';

const ActionPanel = () => {
  const game = useGame();
  const [hint, setHint] = useState('');
  const [defense, setDefense] = useState('');
  const [guess, setGuess] = useState('');

  const isMyTurn = game.currentTurnPlayerId === game.user?.userId;
  const isHost = game.currentRoom?.host === game.user?.nickname;
  const accusedPlayer = game.roomPlayers.find(p => p.id === game.accusedPlayerId);

  const renderContent = () => {
    switch (game.gameStatus) {
      case 'WAITING':
        return (
          <Stack align="center">
            <Title order={2}>플레이어 대기 중</Title>
            <Text>{game.roomPlayers.length} / {game.currentRoom?.maxPlayers} 명</Text>
            {isHost && (
              <Button onClick={() => game.startGame(game.currentRoom.gameNumber)} loading={game.isStartingGame}>
                게임 시작
              </Button>
            )}
          </Stack>
        );

      case 'SPEAKING':
        return (
          <Stack align="center">
            <Title order={2}>발언 단계</Title>
            <Text>현재 발언자: {game.roomPlayers.find(p => p.id === game.currentTurnPlayerId)?.nickname || '...'}</Text>
            {isMyTurn && (
              <form onSubmit={(e) => { e.preventDefault(); game.submitHint({ gameNumber: game.currentRoom.gameNumber, hint }); }}>
                <Group>
                  <TextInput placeholder="제시어에 대한 힌트를 입력하세요" value={hint} onChange={(e) => setHint(e.target.value)} required />
                  <Button type="submit" loading={game.isSubmittingHint}>제출</Button>
                </Group>
              </form>
            )}
          </Stack>
        );

      case 'VOTING':
        return (
          <Stack align="center">
            <Title order={2}>라이어 투표</Title>
            <Text>라이어라고 생각되는 사람에게 투표하세요.</Text>
            <Group>
              {game.roomPlayers.filter(p => p.isAlive && p.id !== game.user?.userId).map(player => (
                <Button key={player.id} onClick={() => game.castVote({ gameNumber: game.currentRoom.gameNumber, targetPlayerId: player.id })} loading={game.isCastingVote}>
                  {player.nickname}에게 투표
                </Button>
              ))}
            </Group>
          </Stack>
        );

      case 'DEFENSE':
        return (
          <Stack align="center">
            <Title order={2}>최후 변론</Title>
            <Text>{accusedPlayer?.nickname}님이 최후 변론 중입니다.</Text>
            {game.user?.userId === game.accusedPlayerId ? (
              <form onSubmit={(e) => { e.preventDefault(); game.submitDefense({ gameNumber: game.currentRoom.gameNumber, defenseText: defense }); }}>
                <Group>
                  <TextInput placeholder="최후 변론을 입력하세요" value={defense} onChange={(e) => setDefense(e.target.value)} required />
                  <Button type="submit" loading={game.isSubmittingDefense}>제출</Button>
                </Group>
              </form>
            ) : <Text>변론을 기다리는 중입니다...</Text>}
          </Stack>
        );

      case 'SURVIVAL_VOTING':
        return (
            <Stack align="center">
                <Title order={2}>최종 판결</Title>
                <Text>{accusedPlayer?.nickname}의 생사를 결정해주세요.</Text>
                <Group mt="md">
                    <Button color="green" onClick={() => game.castSurvivalVote({ gameNumber: game.currentRoom.gameNumber, survival: true })} loading={game.isCastingSurvivalVote}>생존</Button>
                    <Button color="red" onClick={() => game.castSurvivalVote({ gameNumber: game.currentRoom.gameNumber, survival: false })} loading={game.isCastingSurvivalVote}>처형</Button>
                </Group>
            </Stack>
        );

      case 'WORD_GUESS':
        return (
            <Stack align="center">
                <Title order={2}>라이어의 마지막 기회</Title>
                {game.playerRole === 'LIAR' ? (
                    <form onSubmit={(e) => { e.preventDefault(); game.guessWord({ gameNumber: game.currentRoom.gameNumber, guessedWord: guess }); }}>
                        <Group>
                            <TextInput placeholder="제시어를 맞춰주세요" value={guess} onChange={(e) => setGuess(e.target.value)} required />
                            <Button type="submit" loading={game.isGuessingWord}>추측</Button>
                        </Group>
                    </form>
                ) : <Text>라이어의 선택을 기다리는 중입니다...</Text>}
            </Stack>
        );

      case 'FINISHED':
        return (
          <Stack align="center">
            <Title order={2}>게임 종료</Title>
            {game.gameResults && (
              <Alert color={game.gameResults.winner === 'LIAR' ? 'red' : 'green'} title={`${game.gameResults.winner} 승리!`}>
                {game.gameResults.message}
              </Alert>
            )}
            {isHost && <Button onClick={() => game.startGame(game.currentRoom.gameNumber)}>다시 시작</Button>}
          </Stack>
        );

      default:
        return <Text>게임 상태를 불러오는 중...</Text>;
    }
  };

  return <Paper p="xl" shadow="md" withBorder style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>{renderContent()}</Paper>;
};

export default ActionPanel;
