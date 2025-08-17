import React from 'react';
import {motion} from 'framer-motion';
import {ActionIcon, Box, Group, Typography} from '@mantine/core';
import {IconBook, IconDeviceGamepad2, IconHelp, IconLogout, IconPlus, IconRefresh,} from '@tabler/icons-react';
import {MotionMenuButton} from '../MotionMenuButton';

const LobbyHeader = ({
  currentUser,
  loading,
  onRefreshRooms,
  onCreateRoom,
  onAddContent,
  onOpenHelp,
  onLogout
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      style={{
        padding: '1rem 1.5rem',
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
        marginBottom: '2rem',
        width: '100%',
      }}
    >
      <Group justify="space-between" align="center">
        <Box>
            <Group gap="sm">
                <IconDeviceGamepad2 size={32} color="#ffffff" style={{ filter: 'drop-shadow(2px 2px 8px rgba(0, 0, 0, 0.7))' }} />
                <Typography
                    component="h1"
                    variant="h4"
                    style={{
                        color: '#ffffff',
                        fontWeight: 'bold',
                        textShadow: '2px 2px 8px rgba(0, 0, 0, 0.7)',
                    }}
                >
                    게임 로비
                </Typography>
            </Group>
            {currentUser && (
            <Typography style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                환영합니다, {currentUser.nickname}님!
            </Typography>
            )}
        </Box>

        <Group gap="md">
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                <ActionIcon
                    size="lg"
                    variant="gradient"
                    gradient={{ from: 'cyan', to: 'violet' }}
                    onClick={onRefreshRooms}
                    disabled={loading?.rooms}
                    radius="md"
                >
                    <IconRefresh size={20} />
                </ActionIcon>
            </motion.div>
            <MotionMenuButton
                onClick={onCreateRoom}
                icon={IconPlus}
                gradient={{ from: 'orange', to: 'red' }}
                fullWidth={false}
            >
                방 만들기
            </MotionMenuButton>
            <MotionMenuButton
                onClick={onAddContent}
                icon={IconBook}
                gradient={{ from: 'teal', to: 'lime', deg: 105 }}
                fullWidth={false}
            >
                콘텐츠 추가
            </MotionMenuButton>
            <MotionMenuButton
                onClick={onOpenHelp}
                icon={IconHelp}
                gradient={{ from: 'blue', to: 'cyan' }}
                fullWidth={false}
            >
                도움말
            </MotionMenuButton>
            <MotionMenuButton
                onClick={onLogout}
                icon={IconLogout}
                gradient={{ from: 'grape', to: 'pink' }}
                fullWidth={false}
            >
                로그아웃
            </MotionMenuButton>
        </Group>
      </Group>
    </motion.div>
  );
};

export default LobbyHeader;