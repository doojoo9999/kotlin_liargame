import {Avatar, Badge, Box, Card, Group, Stack, Text} from '@mantine/core';
import {IconCrown, IconTarget, IconTrophy, IconWifi, IconWifiOff} from '@tabler/icons-react';
import {motion} from 'framer-motion';

interface PlayerCardProps {
  nickname: string;
  isHost?: boolean;
  isCurrentTurn?: boolean;
  isReady?: boolean;
  isOnline?: boolean;
  avatar?: string;
  status?: 'waiting' | 'playing' | 'eliminated' | 'winner';
  votedBy?: number;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  disabled?: boolean;
}

export function PlayerCard({
  nickname,
  isHost = false,
  isCurrentTurn = false,
  isReady = false,
  isOnline = true,
  avatar,
  status = 'waiting',
  votedBy = 0,
  size = 'md',
  onClick,
  disabled = false
}: PlayerCardProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'waiting':
        return {
          color: isReady ? 'gameGreen' : 'gray',
          text: isReady ? 'Ready' : 'Waiting',
          bgGlow: isReady ? 'game-glow-success' : '',
          borderColor: isReady ? 'var(--game-success)' : 'var(--game-border)'
        };
      case 'playing':
        return {
          color: isCurrentTurn ? 'gameNeon' : 'gameGreen',
          text: isCurrentTurn ? 'Your Turn' : 'Playing',
          bgGlow: isCurrentTurn ? 'game-glow-primary' : '',
          borderColor: isCurrentTurn ? 'var(--game-neon-primary)' : 'var(--game-success)'
        };
      case 'eliminated':
        return {
          color: 'gameRed',
          text: 'Eliminated',
          bgGlow: '',
          borderColor: 'var(--game-danger)'
        };
      case 'winner':
        return {
          color: 'yellow',
          text: 'Winner',
          bgGlow: 'game-glow-success',
          borderColor: '#f59e0b'
        };
      default:
        return {
          color: 'gray',
          text: '',
          bgGlow: '',
          borderColor: 'var(--game-border)'
        };
    }
  };

  const statusConfig = getStatusConfig();
  const cardPadding = size === 'sm' ? 'xs' : size === 'md' ? 'md' : 'lg';
  const avatarSize = size === 'sm' ? 36 : size === 'md' ? 44 : 52;
  const hasVotes = votedBy > 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{
        scale: onClick && !disabled ? 1.02 : 1,
        y: onClick && !disabled ? -2 : 0
      }}
      whileTap={{ scale: onClick && !disabled ? 0.98 : 1 }}
      transition={{
        duration: 0.2,
        type: "spring",
        stiffness: 400,
        damping: 25
      }}
    >
      <Card
        className={`game-card-glass ${statusConfig.bgGlow} ${isCurrentTurn ? 'game-current-turn' : ''}`}
        padding={cardPadding}
        style={{
          position: 'relative',
          cursor: onClick && !disabled ? 'pointer' : 'default',
          opacity: !isOnline ? 0.6 : 1,
          border: `2px solid ${isCurrentTurn ? 'var(--game-neon-primary)' : statusConfig.borderColor}`,
          background: isCurrentTurn
            ? 'linear-gradient(135deg, rgba(14, 165, 233, 0.08) 0%, rgba(14, 165, 233, 0.02) 100%)'
            : 'var(--game-bg-glass)',
          backdropFilter: 'blur(12px)',
          overflow: 'hidden',
        }}
        onClick={onClick && !disabled ? onClick : undefined}
      >
        {/* 현재 턴 배경 효과 */}
        {isCurrentTurn && (
          <Box
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.1) 0%, transparent 50%)',
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />
        )}

        <Stack gap="sm" style={{ position: 'relative', zIndex: 1 }}>
          {/* 메인 플레이어 정보 */}
          <Group gap="sm" justify="space-between">
            <Group gap="sm" flex={1}>
              {/* 아바타 */}
              <Box style={{ position: 'relative' }}>
                <Avatar
                  src={avatar}
                  size={avatarSize}
                  radius="lg"
                  style={{
                    border: `2px solid ${isCurrentTurn ? 'var(--game-neon-primary)' : 'transparent'}`,
                    boxShadow: isCurrentTurn ? 'var(--game-shadow-glow)' : 'none',
                  }}
                >
                  <Text fw={600} size={size === 'sm' ? 'sm' : 'md'}>
                    {nickname.charAt(0).toUpperCase()}
                  </Text>
                </Avatar>

                {/* 온라인 상태 인디케이터 */}
                <Box
                  style={{
                    position: 'absolute',
                    bottom: '-2px',
                    right: '-2px',
                    width: '12px',
                    height: '12px',
                    background: isOnline ? 'var(--game-success)' : 'var(--game-text-muted)',
                    border: '2px solid var(--game-bg-primary)',
                    borderRadius: '50%',
                    boxShadow: isOnline ? '0 0 8px var(--game-success-glow)' : 'none',
                  }}
                />
              </Box>

              {/* 이름과 역할 */}
              <Box flex={1} style={{ minWidth: 0 }}>
                <Group gap="xs" mb={2}>
                  <Text
                    size={size === 'sm' ? 'sm' : 'md'}
                    fw={600}
                    style={{
                      color: 'var(--game-text-primary)',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden'
                    }}
                  >
                    {nickname}
                  </Text>

                  {isHost && (
                    <motion.div
                      animate={{
                        rotate: [0, 5, -5, 0],
                        scale: [1, 1.1, 1]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        repeatDelay: 3
                      }}
                    >
                      <IconCrown
                        size={size === 'sm' ? 14 : 16}
                        style={{ color: '#f59e0b' }}
                      />
                    </motion.div>
                  )}
                </Group>

                {/* 연결 상태 */}
                {!isOnline && (
                  <Group gap="xs">
                    <IconWifiOff size={12} style={{ color: 'var(--game-text-muted)' }} />
                    <Text size="xs" style={{ color: 'var(--game-text-muted)' }}>
                      Offline
                    </Text>
                  </Group>
                )}
              </Box>
            </Group>

            {/* 상태 배지 */}
            {statusConfig.text && (
              <Badge
                color={statusConfig.color}
                variant="light"
                size={size === 'sm' ? 'xs' : 'sm'}
                style={{
                  background: status === 'winner'
                    ? 'rgba(245, 158, 11, 0.15)'
                    : status === 'eliminated'
                    ? 'rgba(239, 68, 68, 0.15)'
                    : isCurrentTurn
                    ? 'rgba(14, 165, 233, 0.15)'
                    : isReady
                    ? 'rgba(34, 197, 94, 0.15)'
                    : 'rgba(255, 255, 255, 0.05)',
                  border: `1px solid ${
                    status === 'winner' 
                      ? 'rgba(245, 158, 11, 0.3)'
                      : status === 'eliminated'
                      ? 'rgba(239, 68, 68, 0.3)'
                      : isCurrentTurn
                      ? 'rgba(14, 165, 233, 0.3)'
                      : isReady
                      ? 'rgba(34, 197, 94, 0.3)'
                      : 'rgba(255, 255, 255, 0.1)'
                  }`,
                  backdropFilter: 'blur(8px)',
                }}
                leftSection={
                  status === 'winner' ? <IconTrophy size={12} /> :
                  isCurrentTurn ? <IconTarget size={12} /> :
                  isOnline ? <IconWifi size={12} /> : <IconWifiOff size={12} />
                }
              >
                {statusConfig.text}
              </Badge>
            )}
          </Group>

          {/* 투표 정보 */}
          {hasVotes && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.3 }}
            >
              <Box
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <Group justify="space-between" gap="xs">
                  <Text size="xs" style={{ color: 'var(--game-text-secondary)' }}>
                    Votes received
                  </Text>
                  <Badge
                    color="gameRed"
                    variant="filled"
                    size="xs"
                    style={{
                      background: 'var(--game-danger)',
                      boxShadow: 'var(--game-danger-glow)',
                    }}
                  >
                    {votedBy}
                  </Badge>
                </Group>

                {/* 투표 진행률 바 */}
                <Box
                  style={{
                    height: '3px',
                    background: 'rgba(239, 68, 68, 0.2)',
                    borderRadius: '2px',
                    overflow: 'hidden',
                    marginTop: '6px',
                  }}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((votedBy / 8) * 100, 100)}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    style={{
                      height: '100%',
                      background: 'linear-gradient(90deg, var(--game-danger), var(--game-warning))',
                      borderRadius: '2px',
                      boxShadow: '0 0 8px var(--game-danger-glow)',
                    }}
                  />
                </Box>
              </Box>
            </motion.div>
          )}

          {/* 현재 턴 알림 */}
          {isCurrentTurn && (
            <motion.div
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Text
                size="xs"
                ta="center"
                fw={600}
                className="game-text-glow"
                style={{
                  color: 'var(--game-neon-primary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}
              >
                ⚡ Your Turn
              </Text>
            </motion.div>
          )}
        </Stack>

        {/* 승리 효과 */}
        {status === 'winner' && (
          <Box
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, transparent 50%)',
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />
        )}
      </Card>
    </motion.div>
  );
}
