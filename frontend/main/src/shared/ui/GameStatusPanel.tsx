import {Badge, Box, Card, Divider, Group, Progress, Stack, Text} from '@mantine/core';
import {IconActivity, IconClock, IconEye, IconTarget, IconTrendingUp, IconUsers} from '@tabler/icons-react';
import {motion} from 'framer-motion';

export type GamePhase = 'WAITING' | 'HINT_PHASE' | 'VOTING_PHASE' | 'DEFENSE_PHASE' | 'FINAL_VOTE_PHASE' | 'LIAR_GUESS_PHASE' | 'ENDED';

interface GameStatusPanelProps {
  gameNumber: number;
  phase: GamePhase;
  round: number;
  currentPlayer?: string;
  totalPlayers: number;
  category?: string;
  timeLeft?: number;
  maxTime?: number;
  votingTarget?: string;
  theme?: 'compact' | 'detailed';
}

export function GameStatusPanel({
  gameNumber,
  phase,
  round,
  currentPlayer,
  totalPlayers,
  category,
  timeLeft,
  maxTime,
  votingTarget,
  theme = 'detailed'
}: GameStatusPanelProps) {
  const getPhaseConfig = () => {
    switch (phase) {
      case 'WAITING':
        return {
          text: 'Waiting for Players',
          color: 'gameNeon',
          icon: IconUsers,
          bgGradient: 'linear-gradient(135deg, rgba(14, 165, 233, 0.1) 0%, transparent 60%)',
          accentColor: 'var(--game-neon-primary)'
        };
      case 'HINT_PHASE':
        return {
          text: 'Giving Hints',
          color: 'gameGreen',
          icon: IconEye,
          bgGradient: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, transparent 60%)',
          accentColor: 'var(--game-success)'
        };
      case 'VOTING_PHASE':
        return {
          text: 'Voting for Liar',
          color: 'yellow',
          icon: IconTarget,
          bgGradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, transparent 60%)',
          accentColor: 'var(--game-warning)'
        };
      case 'DEFENSE_PHASE':
        return {
          text: 'Defense Phase',
          color: 'orange',
          icon: IconActivity,
          bgGradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, transparent 60%)',
          accentColor: 'var(--game-warning)'
        };
      case 'FINAL_VOTE_PHASE':
        return {
          text: 'Final Vote',
          color: 'gameRed',
          icon: IconTarget,
          bgGradient: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, transparent 60%)',
          accentColor: 'var(--game-danger)'
        };
      case 'LIAR_GUESS_PHASE':
        return {
          text: 'Liar\'s Last Chance',
          color: 'violet',
          icon: IconTrendingUp,
          bgGradient: 'linear-gradient(135deg, rgba(139, 69, 197, 0.1) 0%, transparent 60%)',
          accentColor: '#8b45c5'
        };
      case 'ENDED':
        return {
          text: 'Game Over',
          color: 'gray',
          icon: IconUsers,
          bgGradient: 'linear-gradient(135deg, rgba(156, 163, 175, 0.1) 0%, transparent 60%)',
          accentColor: 'var(--game-text-muted)'
        };
      default:
        return {
          text: 'Unknown Phase',
          color: 'gray',
          icon: IconUsers,
          bgGradient: 'transparent',
          accentColor: 'var(--game-text-muted)'
        };
    }
  };

  const phaseConfig = getPhaseConfig();
  const IconComponent = phaseConfig.icon;
  const timeProgress = timeLeft && maxTime ? (timeLeft / maxTime) * 100 : 0;
  const isLowTime = timeLeft && timeLeft < 10;
  const isCriticalTime = timeLeft && timeLeft < 5;

  if (theme === 'compact') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Card
          className="game-card-glass"
          padding="md"
          style={{
            background: phaseConfig.bgGradient,
            border: `1px solid ${phaseConfig.accentColor}33`,
          }}
        >
          <Group justify="space-between" align="center">
            <Group gap="sm">
              <Box
                style={{
                  padding: '8px',
                  background: `${phaseConfig.accentColor}15`,
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <IconComponent size={18} style={{ color: phaseConfig.accentColor }} />
              </Box>

              <div>
                <Text fw={600} size="sm" style={{ color: 'var(--game-text-primary)' }}>
                  {phaseConfig.text}
                </Text>
                <Text size="xs" style={{ color: 'var(--game-text-secondary)' }}>
                  Round {round} • {totalPlayers} players
                </Text>
              </div>
            </Group>

            {timeLeft !== undefined && maxTime && (
              <Group gap="xs">
                <IconClock
                  size={14}
                  style={{
                    color: isCriticalTime ? 'var(--game-danger)' : 'var(--game-text-secondary)'
                  }}
                />
                <Text
                  size="sm"
                  fw={600}
                  className={isCriticalTime ? 'game-pulse' : ''}
                  style={{
                    color: isCriticalTime ? 'var(--game-danger)' :
                           isLowTime ? 'var(--game-warning)' : 'var(--game-text-primary)',
                    minWidth: '30px',
                    textAlign: 'right'
                  }}
                >
                  {timeLeft}s
                </Text>
              </Group>
            )}
          </Group>

          {timeLeft !== undefined && maxTime && (
            <Box mt="sm">
              <Progress
                value={timeProgress}
                color={isCriticalTime ? 'gameRed' : isLowTime ? 'yellow' : phaseConfig.color}
                size="sm"
                radius="xl"
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                }}
                animated={isCriticalTime}
              />
            </Box>
          )}
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card
        className="game-card-glass"
        padding="xl"
        style={{
          background: phaseConfig.bgGradient,
          border: `1px solid ${phaseConfig.accentColor}33`,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* 배경 패턴 */}
        <Box
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '200px',
            height: '200px',
            background: `radial-gradient(circle, ${phaseConfig.accentColor}08 0%, transparent 70%)`,
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />

        <Stack gap="lg" style={{ position: 'relative', zIndex: 1 }}>
          {/* 헤더 */}
          <Group justify="space-between" align="flex-start">
            <div>
              <Group gap="md" mb="xs">
                <Box
                  style={{
                    padding: '12px',
                    background: `${phaseConfig.accentColor}15`,
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: `1px solid ${phaseConfig.accentColor}30`,
                  }}
                >
                  <IconComponent size={24} style={{ color: phaseConfig.accentColor }} />
                </Box>

                <div>
                  <Text size="xl" fw={700} style={{ color: 'var(--game-text-primary)' }}>
                    Game #{gameNumber}
                  </Text>
                  <Text size="sm" style={{ color: 'var(--game-text-secondary)' }}>
                    Live Game Session
                  </Text>
                </div>
              </Group>
            </div>

            <Badge
              size="lg"
              variant="light"
              style={{
                background: `${phaseConfig.accentColor}15`,
                border: `1px solid ${phaseConfig.accentColor}40`,
                color: phaseConfig.accentColor,
                backdropFilter: 'blur(8px)',
                padding: '8px 16px',
                fontWeight: 600,
              }}
            >
              {phaseConfig.text}
            </Badge>
          </Group>

          <Divider
            style={{
              borderColor: 'rgba(255, 255, 255, 0.1)',
              opacity: 0.6
            }}
          />

          {/* 게임 정보 그리드 */}
          <Group grow>
            <Box>
              <Text size="xs" style={{ color: 'var(--game-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Round
              </Text>
              <Text size="lg" fw={700} style={{ color: 'var(--game-text-primary)' }}>
                {round}
              </Text>
            </Box>

            {category && (
              <Box>
                <Text size="xs" style={{ color: 'var(--game-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Category
                </Text>
                <Text size="lg" fw={600} style={{ color: phaseConfig.accentColor }}>
                  {category}
                </Text>
              </Box>
            )}

            <Box>
              <Text size="xs" style={{ color: 'var(--game-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Players
              </Text>
              <Group gap="xs">
                <IconUsers size={16} style={{ color: 'var(--game-text-secondary)' }} />
                <Text size="lg" fw={700} style={{ color: 'var(--game-text-primary)' }}>
                  {totalPlayers}
                </Text>
              </Group>
            </Box>
          </Group>

          {/* 현재 플레이어/투표 대상 */}
          {(currentPlayer || votingTarget) && (
            <Box
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '16px',
                backdropFilter: 'blur(8px)',
              }}
            >
              <Group justify="space-between">
                <div>
                  <Text size="xs" style={{ color: 'var(--game-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {currentPlayer ? 'Current Turn' : 'Vote Target'}
                  </Text>
                  <Text size="md" fw={600} style={{ color: phaseConfig.accentColor }}>
                    {currentPlayer || votingTarget}
                  </Text>
                </div>

                <Box
                  className="game-pulse"
                  style={{
                    width: '8px',
                    height: '8px',
                    background: phaseConfig.accentColor,
                    borderRadius: '50%',
                    boxShadow: `0 0 12px ${phaseConfig.accentColor}80`,
                  }}
                />
              </Group>
            </Box>
          )}

          {/* 타이머 */}
          {timeLeft !== undefined && maxTime && (
            <Box>
              <Group justify="space-between" mb="xs">
                <Group gap="xs">
                  <IconClock size={16} style={{ color: 'var(--game-text-secondary)' }} />
                  <Text size="sm" style={{ color: 'var(--game-text-secondary)' }}>
                    Time Remaining
                  </Text>
                </Group>

                <motion.div
                  animate={isCriticalTime ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 0.5, repeat: isCriticalTime ? Infinity : 0 }}
                >
                  <Text
                    size="xl"
                    fw={700}
                    className={isCriticalTime ? 'game-text-glow' : ''}
                    style={{
                      color: isCriticalTime ? 'var(--game-danger)' :
                             isLowTime ? 'var(--game-warning)' : phaseConfig.accentColor
                    }}
                  >
                    {timeLeft}s
                  </Text>
                </motion.div>
              </Group>

              <Progress
                value={timeProgress}
                color={isCriticalTime ? 'gameRed' : isLowTime ? 'yellow' : phaseConfig.color}
                size="lg"
                radius="xl"
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  boxShadow: isCriticalTime ? 'var(--game-danger-glow)' : 'none',
                }}
                animated={isLowTime}
              />

              {isCriticalTime && (
                <Text
                  size="xs"
                  ta="center"
                  mt="xs"
                  className="game-pulse"
                  style={{
                    color: 'var(--game-danger)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    fontWeight: 600
                  }}
                >
                  ⚠️ Time Critical
                </Text>
              )}
            </Box>
          )}
        </Stack>
      </Card>
    </motion.div>
  );
}
