import React from 'react'
import {Avatar, Box, Card, CardContent, Chip, LinearProgress, Stack, Typography, useTheme} from '@mui/material'
import {
    AccessTime as TimeIcon,
    EmojiEvents as TrophyIcon,
    Games as GamesIcon,
    Gavel as GavelIcon,
    Person as PersonIcon,
    Psychology as PsychologyIcon,
    Quiz as QuizIcon,
    Security as SecurityIcon,
    Visibility as EyeIcon
} from '@mui/icons-material'

const GameStatusCard = ({
  gameStatus = 'WAITING',
  currentRound = 1,
  gameTimer = 0,
  playerRole,
  assignedWord,
  subject,
  gamePhase,
  players = [],
  currentTurnPlayerId,
  accusedPlayerId,
  votingResults
}) => {
  const theme = useTheme()

  // Get status information
  const getStatusInfo = () => {
    switch (gameStatus) {
      case 'WAITING':
        return {
          icon: <GamesIcon />,
          title: '게임 대기중',
          color: 'info',
          description: '모든 플레이어가 준비되면 게임이 시작됩니다.'
        }
      case 'HINT_PHASE':
      case 'SPEAKING':
        return {
          icon: <PsychologyIcon />,
          title: '힌트 단계',
          color: 'primary',
          description: '플레이어들이 힌트를 제출하고 있습니다.'
        }
      case 'VOTING':
        return {
          icon: <GavelIcon />,
          title: '투표 진행중',
          color: 'warning',
          description: '라이어로 의심되는 플레이어에게 투표하세요.'
        }
      case 'DEFENSE':
        return {
          icon: <SecurityIcon />,
          title: '변론 단계',
          color: 'error',
          description: '지목된 플레이어가 변론 중입니다.'
        }
      case 'SURVIVAL_VOTING':
        return {
          icon: <GavelIcon />,
          title: '최종 투표',
          color: 'error',
          description: '지목된 플레이어의 생존 여부를 결정합니다.'
        }
      case 'WORD_GUESS':
        return {
          icon: <QuizIcon />,
          title: '단어 추리',
          color: 'secondary',
          description: '라이어가 실제 단어를 추리하고 있습니다.'
        }
      case 'RESULTS':
        return {
          icon: <TrophyIcon />,
          title: '결과 발표',
          color: 'success',
          description: '게임 결과를 확인하세요.'
        }
      case 'FINISHED':
        return {
          icon: <TrophyIcon />,
          title: '게임 종료',
          color: 'default',
          description: '게임이 완료되었습니다.'
        }
      default:
        return {
          icon: <GamesIcon />,
          title: '게임 진행중',
          color: 'primary',
          description: ''
        }
    }
  }

  const statusInfo = getStatusInfo()
  const currentTurnPlayer = players.find(p => p.id === currentTurnPlayerId)
  const accusedPlayer = players.find(p => p.id === accusedPlayerId)

  // Calculate timer percentage for progress bar
  const getTimerProgress = () => {
    const maxTime = 60 // Assume 60 seconds max for most phases
    return Math.max(0, Math.min(100, (gameTimer / maxTime) * 100))
  }

  // Get role display info
  const getRoleInfo = () => {
    if (!playerRole) return null
    
    const isLiar = playerRole === 'LIAR'
    return {
      color: isLiar ? 'error' : 'success',
      icon: isLiar ? '🎭' : '👥',
      label: isLiar ? '라이어' : '시민',
      word: assignedWord || '???'
    }
  }

  const roleInfo = getRoleInfo()

  return (
    <Box sx={{ p: 1 }}>
      <Card
        elevation={2}
        sx={{
          backgroundColor: theme.palette.background.paper,
          border: `2px solid ${theme.palette[statusInfo.color].main}`,
          borderRadius: 2
        }}
      >
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          {/* Status Header */}
          <Stack direction="row" alignItems="center" spacing={1} mb={2}>
            <Avatar
              sx={{
                bgcolor: theme.palette[statusInfo.color].main,
                color: theme.palette[statusInfo.color].contrastText,
                width: 32,
                height: 32
              }}
            >
              {statusInfo.icon}
            </Avatar>
            <Box flex={1}>
              <Typography variant="subtitle1" fontWeight="bold" color={statusInfo.color}>
                {statusInfo.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" fontSize="0.75rem">
                라운드 {currentRound}
              </Typography>
            </Box>
          </Stack>

          {/* Game Timer */}
          {gameTimer > 0 && (
            <Box mb={2}>
              <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                <TimeIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  남은 시간: {gameTimer}초
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={getTimerProgress()}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: theme.palette.grey[200],
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: gameTimer < 10 ? theme.palette.error.main : theme.palette.primary.main
                  }
                }}
              />
            </Box>
          )}

          {/* Subject/Topic Display */}
          {subject && (
            <Box mb={2}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                주제
              </Typography>
              <Chip
                label={typeof subject === 'string' ? subject : subject.name || subject.content}
                variant="outlined"
                size="small"
                sx={{ maxWidth: '100%' }}
              />
            </Box>
          )}

          {/* Player Role Information */}
          {roleInfo && (
            <Box mb={2}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                내 역할
              </Typography>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 1,
                  backgroundColor: theme.palette[roleInfo.color].light,
                  border: `1px solid ${theme.palette[roleInfo.color].main}`
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography fontSize="1.2rem">{roleInfo.icon}</Typography>
                  <Box>
                    <Typography variant="body2" fontWeight="bold" color={roleInfo.color}>
                      {roleInfo.label}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      단어: {roleInfo.word}
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            </Box>
          )}

          {/* Current Turn Player */}
          {currentTurnPlayer && gameStatus !== 'WAITING' && (
            <Box mb={2}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                현재 턴
              </Typography>
              <Stack direction="row" alignItems="center" spacing={1}>
                <PersonIcon fontSize="small" color="primary" />
                <Typography variant="body2" fontWeight="bold">
                  {currentTurnPlayer.nickname}
                </Typography>
              </Stack>
            </Box>
          )}

          {/* Accused Player */}
          {accusedPlayer && (gameStatus === 'DEFENSE' || gameStatus === 'SURVIVAL_VOTING') && (
            <Box mb={2}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                지목된 플레이어
              </Typography>
              <Stack direction="row" alignItems="center" spacing={1}>
                <EyeIcon fontSize="small" color="error" />
                <Typography variant="body2" fontWeight="bold" color="error.main">
                  {accusedPlayer.nickname}
                </Typography>
              </Stack>
            </Box>
          )}

          {/* Status Description */}
          {statusInfo.description && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                fontSize: '0.75rem',
                fontStyle: 'italic',
                mt: 1,
                p: 1,
                backgroundColor: theme.palette.grey[50],
                borderRadius: 1
              }}
            >
              {statusInfo.description}
            </Typography>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}

export default GameStatusCard