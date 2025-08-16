import React from 'react';
import {Box, Button, Typography} from '@components/ui';
import {RotateCcw as RefreshIcon} from 'lucide-react';
import {IconBook, IconDoorEnter, IconHelp, IconInfoCircle, IconLogout,} from '@tabler/icons-react';
import {MotionMenuButton} from '../MotionMenuButton';

/**
 * LobbyHeader component that displays the header section of the lobby
 * @param {Object} props - Component props
 * @param {Object} props.currentUser - Current user object
 * @param {Object} props.loading - Loading states object
 * @param {Function} props.onRefreshRooms - Function to refresh room list
 * @param {Function} props.onCreateRoom - Function to open create room dialog
 * @param {Function} props.onAddContent - Function to open add content dialog
 * @param {Function} props.onOpenHelp - Function to open help dialog
 * @param {Function} props.onOpenGameRules - Function to open game rules dialog
 * @param {Function} props.onLogout - Function to open logout dialog
 * @returns {JSX.Element} LobbyHeader component
 */
const LobbyHeader = ({
  currentUser,
  loading,
  onRefreshRooms,
  onCreateRoom,
  onAddContent,
  onOpenHelp,
  onOpenGameRules,
  onLogout
}) => {
  return (
    <Box style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
      <Box>
        <Typography variant="h4" style={{ marginBottom: '8px' }}>
          라이어 게임 로비
        </Typography>
        {currentUser && (
          <Typography variant="body2" style={{ color: '#666666' }}>
            환영합니다, {currentUser.nickname}님!
          </Typography>
        )}
      </Box>
      <Box style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon size={16} />}
          onClick={onRefreshRooms}
          disabled={loading?.rooms}
        >
          새로고침
        </Button>
        <MotionMenuButton
          onClick={onCreateRoom}
          icon={IconDoorEnter}
          gradient={{ from: 'indigo', to: 'cyan' }}
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
          주제/답안 추가
        </MotionMenuButton>
        <MotionMenuButton
          onClick={onOpenHelp}
          icon={IconHelp}
          gradient={{ from: '#4dabf7', to: '#a5d8ff' }}
          fullWidth={false}
        >
          도움말
        </MotionMenuButton>
        <MotionMenuButton
          onClick={onOpenGameRules}
          icon={IconInfoCircle}
          gradient={{ from: 'grape', to: 'pink' }}
          fullWidth={false}
        >
          게임 방법
        </MotionMenuButton>
        <MotionMenuButton
          onClick={onLogout}
          icon={IconLogout}
          gradient={{ from: 'orange', to: 'red' }}
          fullWidth={false}
        >
          로그아웃
        </MotionMenuButton>
      </Box>
    </Box>
  );
};

export default LobbyHeader;