import {Badge, Box, Button, Card, Group, Stack, Text} from '@mantine/core';
import {IconEye, IconLock, IconPlayerPlay, IconUsers} from '@tabler/icons-react';
import {motion} from 'framer-motion';

interface GameRoomCardProps {
  roomName: string;
  currentPlayers: number;
  maxPlayers: number;
  isPrivate: boolean;
  gameState: 'WAITING' | 'PLAYING' | 'ENDED';
  hostName: string;
  onJoin: () => void;
  disabled?: boolean;
}

export function GameRoomCard({
  roomName,
  currentPlayers,
  maxPlayers,
  isPrivate,
  gameState,
  hostName,
  onJoin,
  disabled = false
}: GameRoomCardProps) {
  const getStateConfig = () => {
    switch (gameState) {
      case 'WAITING':
        return {
          color: 'gameNeon',
          text: 'Waiting',
          icon: IconUsers,
          bgClass: 'game-bg-waiting',
          glow: false
        };
      case 'PLAYING':
        return {
          color: 'gameGreen',
          text: 'Live',
          icon: IconPlayerPlay,
          bgClass: 'game-bg-playing',
          glow: true
        };
      case 'ENDED':
        return {
          color: 'gray',
          text: 'Ended',
          icon: IconEye,
          bgClass: '',
          glow: false
        };
      default:
        return {
          color: 'gray',
          text: 'Unknown',
          icon: IconUsers,
          bgClass: '',
          glow: false
        };
    }
  };

  const stateConfig = getStateConfig();
  const StateIcon = stateConfig.icon;
  const isFull = currentPlayers >= maxPlayers;
  const canJoin = gameState === 'WAITING' && !isFull && !disabled;
  const playerRatio = currentPlayers / maxPlayers;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{
        duration: 0.3,
        type: "spring",
        stiffness: 400,
        damping: 25
      }}
    >
      <Card
        className={`game-card-glass ${stateConfig.bgClass} ${stateConfig.glow ? 'game-glow-success' : ''}`}
        style={{
          position: 'relative',
          overflow: 'hidden',
          cursor: canJoin ? 'pointer' : 'default',
          minHeight: '200px',
        }}
        onClick={canJoin ? onJoin : undefined}
      >
        {/* 배경 그라데이션 오버레이 */}
        <Box
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: gameState === 'PLAYING'
              ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.05) 0%, transparent 50%)'
              : gameState === 'WAITING'
              ? 'linear-gradient(135deg, rgba(14, 165, 233, 0.05) 0%, transparent 50%)'
              : 'transparent',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />

        <Stack gap="lg" style={{ position: 'relative', zIndex: 1 }}>
          {/* 헤더 */}
          <Group justify="space-between" align="flex-start">
            <Box flex={1}>
              <Group gap="xs" mb="xs">
                <Text
                  size="lg"
                  fw={600}
                  style={{
                    color: 'var(--game-text-primary)',
                    lineHeight: 1.3,
                    wordBreak: 'break-word'
                  }}
                  lineClamp={2}
                >
                  {roomName}
                </Text>
                {isPrivate && (
                  <IconLock
                    size={16}
                    style={{
                      color: 'var(--game-text-secondary)',
                      flexShrink: 0
                    }}
                  />
                )}
              </Group>

              <Text
                size="sm"
                style={{ color: 'var(--game-text-secondary)' }}
              >
                Host: <Text component="span" fw={500}>{hostName}</Text>
              </Text>
            </Box>

            {/* 상태 배지 */}
            <Badge
              color={stateConfig.color}
              variant="light"
              size="sm"
              style={{
                background: stateConfig.glow
                  ? 'rgba(34, 197, 94, 0.15)'
                  : 'rgba(14, 165, 233, 0.15)',
                border: `1px solid ${stateConfig.glow 
                  ? 'rgba(34, 197, 94, 0.3)' 
                  : 'rgba(14, 165, 233, 0.3)'}`,
                backdropFilter: 'blur(8px)',
                flexShrink: 0,
              }}
              leftSection={<StateIcon size={12} />}
            >
              {stateConfig.text}
            </Badge>
          </Group>

          {/* 플레이어 정보 */}
          <Box>
            <Group justify="space-between" mb="xs">
              <Group gap="xs">
                <IconUsers size={16} style={{ color: 'var(--game-text-secondary)' }} />
                <Text
                  size="sm"
                  fw={500}
                  style={{ color: 'var(--game-text-primary)' }}
                >
                  {currentPlayers}/{maxPlayers}
                </Text>
              </Group>

              <Text
                size="xs"
                style={{ color: 'var(--game-text-muted)' }}
              >
                {Math.round(playerRatio * 100)}% full
              </Text>
            </Group>

            {/* 플레이어 진행률 바 */}
            <Box
              style={{
                height: '3px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '2px',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${playerRatio * 100}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                style={{
                  height: '100%',
                  background: isFull
                    ? 'linear-gradient(90deg, var(--game-danger), var(--game-warning))'
                    : playerRatio > 0.7
                    ? 'linear-gradient(90deg, var(--game-warning), var(--game-success))'
                    : 'linear-gradient(90deg, var(--game-neon-primary), var(--game-neon-secondary))',
                  borderRadius: '2px',
                  boxShadow: playerRatio > 0.7
                    ? '0 0 10px rgba(34, 197, 94, 0.4)'
                    : '0 0 10px rgba(14, 165, 233, 0.4)',
                }}
              />
            </Box>
          </Box>

          {/* 액션 버튼 */}
          <motion.div
            whileHover={{ scale: canJoin ? 1.02 : 1 }}
            whileTap={{ scale: canJoin ? 0.98 : 1 }}
          >
            <Button
              fullWidth
              disabled={!canJoin}
              variant={canJoin ? "filled" : "light"}
              size="md"
              style={{
                background: canJoin
                  ? 'linear-gradient(135deg, var(--game-neon-primary), var(--game-neon-secondary))'
                  : 'rgba(255, 255, 255, 0.05)',
                border: 'none',
                color: canJoin ? '#ffffff' : 'var(--game-text-muted)',
                fontWeight: 500,
                height: '44px',
                boxShadow: canJoin ? 'var(--game-shadow-glow)' : 'none',
              }}
              leftSection={
                canJoin ? (
                  <IconPlayerPlay size={16} />
                ) : gameState === 'PLAYING' ? (
                  <IconEye size={16} />
                ) : null
              }
            >
              {isFull ? 'Room Full' :
               gameState === 'PLAYING' ? 'In Progress' :
               gameState === 'ENDED' ? 'Game Ended' : 'Join Game'}
            </Button>
          </motion.div>
        </Stack>

        {/* 라이브 게임 펄스 효과 */}
        {gameState === 'PLAYING' && (
          <Box
            className="game-pulse"
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              width: '8px',
              height: '8px',
              background: 'var(--game-success)',
              borderRadius: '50%',
              boxShadow: '0 0 10px var(--game-success-glow)',
              zIndex: 2,
            }}
          />
        )}
      </Card>
    </motion.div>
  );
}
