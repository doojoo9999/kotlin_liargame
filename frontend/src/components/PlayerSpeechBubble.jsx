import {useEffect, useState} from 'react';
import {Box, Typography} from '@components/ui';
import PropTypes from 'prop-types';

/**
 * PlayerSpeechBubble component displays a speech bubble near a player profile.
 * It shows game status messages related to a specific player, such as their role,
 * voting results, or hints.
 * 
 * The speech bubble automatically disappears after a specified duration.
 * 
 * @param {Object} props - Component props
 * @param {string} props.message - The message to display in the speech bubble
 * @param {string} props.position - The position of the speech bubble relative to the player profile ('top', 'right', 'bottom', 'left')
 * @param {number} props.duration - Duration in milliseconds before the speech bubble disappears (default: 5000ms)
 * @param {boolean} props.show - Whether to show the speech bubble
 * @param {function} props.onHide - Callback function called when the speech bubble is hidden
 */
function PlayerSpeechBubble({ message, position, duration, show, onHide }) {
  const [visible, setVisible] = useState(show);

  useEffect(() => {
    setVisible(show);
    
    if (show) {
      const timer = setTimeout(() => {
        setVisible(false);
        if (onHide) onHide();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [show, duration, onHide]);

  if (!visible) return null;

  const getPositionStyles = () => {
    switch (position) {
      case 'top':
        return {
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginBottom: '10px'
        };
      case 'right':
        return {
          left: '100%',
          top: '50%',
          transform: 'translateY(-50%)',
          marginLeft: '10px'
        };
      case 'bottom':
        return {
          top: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginTop: '10px'
        };
      case 'left':
        return {
          right: '100%',
          top: '50%',
          transform: 'translateY(-50%)',
          marginRight: '10px'
        };
      default:
        return {
          top: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginTop: '10px'
        };
    }
  };

  const getArrowStyles = () => {
    const arrowColor = 'rgba(255, 152, 0, 0.9)';
    switch (position) {
      case 'top':
        return {
          position: 'absolute',
          top: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 0,
          height: 0,
          border: '8px solid transparent',
          borderTopColor: arrowColor,
        };
      case 'right':
        return {
          position: 'absolute',
          right: '100%',
          top: '50%',
          transform: 'translateY(-50%)',
          width: 0,
          height: 0,
          border: '8px solid transparent',
          borderRightColor: arrowColor,
        };
      case 'bottom':
        return {
          position: 'absolute',
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 0,
          height: 0,
          border: '8px solid transparent',
          borderBottomColor: arrowColor,
        };
      case 'left':
        return {
          position: 'absolute',
          left: '100%',
          top: '50%',
          transform: 'translateY(-50%)',
          width: 0,
          height: 0,
          border: '8px solid transparent',
          borderLeftColor: arrowColor,
        };
      default:
        return {
          position: 'absolute',
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 0,
          height: 0,
          border: '8px solid transparent',
          borderBottomColor: arrowColor,
        };
    }
  };

  return (
    <Box
      style={{
        position: 'absolute',
        maxWidth: '150px',
        padding: '8px 12px',
        backgroundColor: 'rgba(255, 152, 0, 0.9)',
        color: 'white',
        borderRadius: '12px',
        boxShadow: '0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23)',
        zIndex: 10,
        ...getPositionStyles(),
      }}
    >
      <Typography variant="body2" style={{ fontWeight: '500' }}>
        {message}
      </Typography>
      <div style={getArrowStyles()} />
    </Box>
  );
}

PlayerSpeechBubble.propTypes = {
  message: PropTypes.string.isRequired,
  position: PropTypes.oneOf(['top', 'right', 'bottom', 'left']),
  duration: PropTypes.number,
  show: PropTypes.bool,
  onHide: PropTypes.func
};

PlayerSpeechBubble.defaultProps = {
  position: 'bottom',
  duration: 5000,
  show: true
};

export default PlayerSpeechBubble;