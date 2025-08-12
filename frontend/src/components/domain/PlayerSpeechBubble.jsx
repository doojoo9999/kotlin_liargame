import React from 'react';
import {Paper, Text} from '@mantine/core';

function PlayerSpeechBubble({ message, position = 'top' }) {
  const bubbleStyle = {
    position: 'absolute',
    zIndex: 100,
    padding: '8px 12px',
    borderRadius: 'md',
    backgroundColor: 'white',
    boxShadow: 'sm',
    maxWidth: 200,
    wordBreak: 'break-word',
  };

  const arrowStyle = {
    position: 'absolute',
    width: 0,
    height: 0,
    borderStyle: 'solid',
    borderColor: 'transparent',
  };

  switch (position) {
    case 'top':
      return (
        <Paper style={{ ...bubbleStyle, bottom: '100%', left: '50%', transform: 'translateX(-50%) translateY(-10px)' }}>
          <Text size="sm">{message}</Text>
          <div style={{ ...arrowStyle, borderTopColor: 'white', borderTopWidth: '10px', borderLeftWidth: '10px', borderRightWidth: '10px', bottom: '-10px', left: '50%', transform: 'translateX(-50%)' }} />
        </Paper>
      );
    case 'bottom':
      return (
        <Paper style={{ ...bubbleStyle, top: '100%', left: '50%', transform: 'translateX(-50%) translateY(10px)' }}>
          <Text size="sm">{message}</Text>
          <div style={{ ...arrowStyle, borderBottomColor: 'white', borderBottomWidth: '10px', borderLeftWidth: '10px', borderRightWidth: '10px', top: '-10px', left: '50%', transform: 'translateX(-50%)' }} />
        </Paper>
      );
    case 'left':
      return (
        <Paper style={{ ...bubbleStyle, right: '100%', top: '50%', transform: 'translateY(-50%) translateX(-10px)' }}>
          <Text size="sm">{message}</Text>
          <div style={{ ...arrowStyle, borderLeftColor: 'white', borderLeftWidth: '10px', borderTopWidth: '10px', borderBottomWidth: '10px', right: '-10px', top: '50%', transform: 'translateY(-50%)' }} />
        </Paper>
      );
    case 'right':
      return (
        <Paper style={{ ...bubbleStyle, left: '100%', top: '50%', transform: 'translateY(-50%) translateX(10px)' }}>
          <Text size="sm">{message}</Text>
          <div style={{ ...arrowStyle, borderRightColor: 'white', borderRightWidth: '10px', borderTopWidth: '10px', borderBottomWidth: '10px', left: '-10px', top: '50%', transform: 'translateY(-50%)' }} />
        </Paper>
      );
    default:
      return null;
  }
}

export default PlayerSpeechBubble;
