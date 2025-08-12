import React from 'react';
import {Center, RingProgress, Text} from '@mantine/core';

function GameTimerComponent({ gameTimer, maxTime = 60, size = 120, thickness = 12 }) {
  const progress = (gameTimer / maxTime) * 100;
  const color = progress > 50 ? 'green' : progress > 25 ? 'yellow' : 'red';

  return (
    <RingProgress
      size={size}
      thickness={thickness}
      roundCaps
      sections={[{ value: progress, color }]}
      label={
        <Center>
          <Text c={color} fw={700} ta="center" size="xl">
            {gameTimer}
          </Text>
        </Center>
      }
    />
  );
}

export default GameTimerComponent;
