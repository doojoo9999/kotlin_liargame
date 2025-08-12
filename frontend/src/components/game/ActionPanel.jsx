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
            <Title order={2}>Waiting for Players</Title>
            <Text>{game.roomPlayers.length} / {game.currentRoom?.maxPlayers} players</Text>
            {isHost && (
              <Button onClick={() => game.startGame(game.currentRoom.gameNumber)} loading={game.isStartingGame}>
                Start Game
              </Button>
            )}
          </Stack>
        );

      case 'SPEAKING':
        return (
          <Stack align="center">
            <Title order={2}>Speaking Phase</Title>
            <Text>Current Speaker: {game.roomPlayers.find(p => p.id === game.currentTurnPlayerId)?.nickname || '...'}</Text>
            {isMyTurn && (
              <form onSubmit={(e) => { e.preventDefault(); game.submitHint({ gameNumber: game.currentRoom.gameNumber, hint }); }}>
                <Group>
                  <TextInput placeholder="Enter your hint" value={hint} onChange={(e) => setHint(e.target.value)} required />
                  <Button type="submit" loading={game.isSubmittingHint}>Submit</Button>
                </Group>
              </form>
            )}
          </Stack>
        );

      case 'VOTING':
        return (
          <Stack align="center">
            <Title order={2}>Vote for the Liar</Title>
            <Group>
              {game.roomPlayers.filter(p => p.isAlive && p.id !== game.user?.userId).map(player => (
                <Button key={player.id} onClick={() => game.castVote({ gameNumber: game.currentRoom.gameNumber, targetPlayerId: player.id })} loading={game.isCastingVote}>
                  Vote {player.nickname}
                </Button>
              ))}
            </Group>
          </Stack>
        );

      case 'DEFENSE':
        return (
          <Stack align="center">
            <Title order={2}>Defense Phase</Title>
            <Text>{accusedPlayer?.nickname} is defending.</Text>
            {game.user?.userId === game.accusedPlayerId ? (
              <form onSubmit={(e) => { e.preventDefault(); game.submitDefense({ gameNumber: game.currentRoom.gameNumber, defenseText: defense }); }}>
                <Group>
                  <TextInput placeholder="Enter your defense" value={defense} onChange={(e) => setDefense(e.target.value)} required />
                  <Button type="submit" loading={game.isSubmittingDefense}>Submit</Button>
                </Group>
              </form>
            ) : <Text>Waiting for the defense...</Text>}
          </Stack>
        );

      case 'SURVIVAL_VOTING':
        return (
            <Stack align="center">
                <Title order={2}>Final Judgment</Title>
                <Text>Decide the fate of {accusedPlayer?.nickname}.</Text>
                <Group mt="md">
                    <Button color="green" onClick={() => game.castSurvivalVote({ gameNumber: game.currentRoom.gameNumber, survival: true })} loading={game.isCastingSurvivalVote}>Spare</Button>
                    <Button color="red" onClick={() => game.castSurvivalVote({ gameNumber: game.currentRoom.gameNumber, survival: false })} loading={game.isCastingSurvivalVote}>Eliminate</Button>
                </Group>
            </Stack>
        );

      case 'WORD_GUESS':
        return (
            <Stack align="center">
                <Title order={2}>Liar's Chance</Title>
                {game.playerRole === 'LIAR' ? (
                    <form onSubmit={(e) => { e.preventDefault(); game.guessWord({ gameNumber: game.currentRoom.gameNumber, guessedWord: guess }); }}>
                        <Group>
                            <TextInput placeholder="Guess the word" value={guess} onChange={(e) => setGuess(e.target.value)} required />
                            <Button type="submit" loading={game.isGuessingWord}>Guess</Button>
                        </Group>
                    </form>
                ) : <Text>Waiting for the Liar to guess...</Text>}
            </Stack>
        );

      case 'FINISHED':
        return (
          <Stack align="center">
            <Title order={2}>Game Over</Title>
            {game.gameResults && (
              <Alert color={game.gameResults.winner === 'LIAR' ? 'red' : 'green'} title={`${game.gameResults.winner} Wins!`}>
                {game.gameResults.message}
              </Alert>
            )}
            {isHost && <Button onClick={() => game.startGame(game.currentRoom.gameNumber)}>Play Again</Button>}
          </Stack>
        );

      default:
        return <Text>Loading game state...</Text>;
    }
  };

  return <Paper p="xl" shadow="md" withBorder style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>{renderContent()}</Paper>;
};

export default ActionPanel;
