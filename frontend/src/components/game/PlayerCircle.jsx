import React from 'react';
import {Avatar, Box, Indicator, Stack, Text, Tooltip} from '@mantine/core';

const PlayerCircle = ({ players, currentTurnPlayerId, size = 350 }) => {
  const radius = size / 2;

  const getPosition = (index, total) => {
    const angle = (index / total) * 2 * Math.PI - Math.PI / 2; // Start from top
    const x = radius + radius * Math.cos(angle) - 40; // -40 to center avatar
    const y = radius + radius * Math.sin(angle) - 40; // -40 to center avatar
    return { left: `${x}px`, top: `${y}px` };
  };

  return (
    <Box style={{ position: 'relative', width: size, height: size, margin: 'auto' }}>
      {players.map((player, index) => {
        const isCurrentTurn = player.id === currentTurnPlayerId;
        const position = getPosition(index, players.length);

        return (
          <Box
            key={player.id}
            style={{ position: 'absolute', ...position, transition: 'all 0.3s ease' }}
          >
            <Tooltip label={player.nickname} withArrow>
                <Indicator inline color="yellow" size={12} disabled={!isCurrentTurn} processing={isCurrentTurn}>
                    <Stack align="center" spacing={0}>
                        <Avatar
                            src={player.avatarUrl || `https://api.dicebear.com/8.x/adventurer/js/seed=${player.nickname}.svg`}
                            alt={player.nickname}
                            size="xl"
                            radius="50%"
                            style={{ 
                                border: `3px solid ${isCurrentTurn ? 'gold' : 'transparent'}`,
                                opacity: player.isAlive === false ? 0.4 : 1,
                                filter: player.isAlive === false ? 'grayscale(100%)' : 'none'
                            }}
                        />
                        <Text size="sm" fw={500} truncate>{player.nickname}</Text>
                    </Stack>
                </Indicator>
            </Tooltip>
          </Box>
        );
      })}
    </Box>
  );
};

export default PlayerCircle;
