import React, {useMemo} from 'react'
import PropTypes from 'prop-types'
import {
    Alert,
    Box,
    Chip,
    Divider,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Paper,
    Stack,
    Typography
} from '@/components/ui'
import {CheckCircle as CheckIcon} from 'lucide-react'
import {buildActionGuidance, PRIORITY_MAPPING} from './ActionGuide.utils'
import {getIconByKey} from './ActionGuide.icons'

const ActionGuide = React.memo(({
  gameStatus = 'WAITING',
  isCurrentTurn = false,
  currentUser,
  currentTurnPlayerId,
  players = [],
  playerRole,
  gameTimer = 0,
  hintSubmitted = false,
  defenseSubmitted = false,
  survivalVoteSubmitted = false,
  wordGuessSubmitted = false,
  accusedPlayerId
}) => {
  // Memoized guidance data generation using extracted utility
  const guidance = useMemo(() => 
    buildActionGuidance({
      gameStatus,
      isCurrentTurn,
      currentUser,
      currentTurnPlayerId,
      players,
      playerRole,
      gameTimer,
      hintSubmitted,
      defenseSubmitted,
      survivalVoteSubmitted,
      wordGuessSubmitted,
      accusedPlayerId
    }), [
    gameStatus,
    isCurrentTurn,
    currentUser,
    currentTurnPlayerId,
    players,
    playerRole,
    gameTimer,
    hintSubmitted,
    defenseSubmitted,
    survivalVoteSubmitted,
    wordGuessSubmitted,
    accusedPlayerId
  ])

  // Memoized styles to prevent recreation on each render
  const containerStyles = useMemo(() => ({ padding: '8px' }), [])
  
  const paperStyles = useMemo(() => ({
    padding: '16px',
    borderRadius: '8px'
  }), [])
  
  const urgentChipStyles = useMemo(() => ({ fontSize: '0.65rem' }), [])
  
  const alertStyles = useMemo(() => ({
    marginBottom: '16px'
  }), [])
  
  const listItemIconStyles = useMemo(() => ({ minWidth: '32px' }), [])
  
  const actionTextStyles = useMemo(() => ({}), [])
  
  const shortcutChipStyles = useMemo(() => ({ 
    fontSize: '0.7rem'
  }), [])
  
  const nextStepBoxStyles = useMemo(() => ({
    padding: '8px',
    backgroundColor: '#f5f5f5',
    borderRadius: '4px'
  }), [])

  // Get resolved icons and priority mapping
  const HeaderIcon = getIconByKey(guidance.iconKey)
  const priorityMapping = PRIORITY_MAPPING[guidance.priority] || PRIORITY_MAPPING.info

  return (
    <Box style={containerStyles}>
      <Paper
        elevation={1}
        style={paperStyles}
        role="region"
        aria-label={guidance.title}
      >
        {/* Header */}
        <Stack direction="row" alignItems="center" spacing={1} mb={2}>
          <HeaderIcon />
          <Typography 
            variant="subtitle1" 
            fontWeight="bold" 
            color={`${priorityMapping.color}.main`}
          >
            {guidance.title}
          </Typography>
          {guidance.urgent && (
            <Chip
              label="긴급"
              size="small"
              color="error"
              variant="filled"
              sx={urgentChipStyles}
              aria-label="긴급"
            />
          )}
        </Stack>

        {/* Description */}
        {guidance.description && (
          <Alert
            severity={priorityMapping.severity}
            sx={alertStyles}
          >
            {guidance.description}
          </Alert>
        )}

        {/* Action Items */}
        {guidance.actions && guidance.actions.length > 0 && (
          <Box mb={2}>
            <Typography 
              variant="body2" 
              color="text.secondary" 
              gutterBottom 
              sx={{ fontWeight: 'bold' }}
              id="actions-title"
            >
              해야 할 일:
            </Typography>
            <List 
              dense 
              sx={{ py: 0 }}
              aria-describedby="actions-title"
            >
              {guidance.actions.map((action) => {
                const ActionIcon = getIconByKey(action.iconKey)
                
                return (
                  <ListItem key={action.key} sx={{ px: 0 }}>
                    <ListItemIcon sx={listItemIconStyles}>
                      {action.completed ? (
                        <CheckIcon color="success" fontSize="small" />
                      ) : (
                        <ActionIcon fontSize="small" color="action" />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={action.text}
                      sx={{
                        ...actionTextStyles,
                        '& .MuiListItemText-primary': {
                          ...actionTextStyles['& .MuiListItemText-primary'],
                          textDecoration: action.completed ? 'line-through' : 'none',
                          color: action.completed ? 'text.secondary' : 'text.primary'
                        }
                      }}
                    />
                  </ListItem>
                )
              })}
            </List>
          </Box>
        )}

        {/* Keyboard Shortcuts */}
        {guidance.shortcuts && guidance.shortcuts.length > 0 && (
          <Box mb={2}>
            <Typography 
              variant="body2" 
              color="text.secondary" 
              gutterBottom 
              sx={{ fontWeight: 'bold' }}
              id="shortcuts-title"
            >
              단축키:
            </Typography>
            <Stack spacing={1} aria-describedby="shortcuts-title">
              {guidance.shortcuts.map((shortcut, index) => (
                <Stack key={`${shortcut.key}-${index}`} direction="row" alignItems="center" spacing={1}>
                  <Chip
                    label={shortcut.key}
                    size="small"
                    variant="outlined"
                    sx={shortcutChipStyles}
                  />
                  <Typography variant="body2" fontSize="0.75rem" color="text.secondary">
                    {shortcut.description}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Box>
        )}

        {/* Next Step */}
        {guidance.nextStep && (
          <>
            <Divider sx={{ mb: 1 }} />
            <Box sx={nextStepBoxStyles}>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                <strong>다음 단계:</strong> {guidance.nextStep}
              </Typography>
            </Box>
          </>
        )}
      </Paper>
    </Box>
  )
})

// PropTypes for type safety
ActionGuide.propTypes = {
  gameStatus: PropTypes.string,
  isCurrentTurn: PropTypes.bool,
  currentUser: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    nickname: PropTypes.string
  }),
  currentTurnPlayerId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  players: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    nickname: PropTypes.string
  })),
  playerRole: PropTypes.string,
  gameTimer: PropTypes.number,
  hintSubmitted: PropTypes.bool,
  defenseSubmitted: PropTypes.bool,
  survivalVoteSubmitted: PropTypes.bool,
  wordGuessSubmitted: PropTypes.bool,
  accusedPlayerId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
}

// Display name for debugging
ActionGuide.displayName = 'ActionGuide'

export default ActionGuide