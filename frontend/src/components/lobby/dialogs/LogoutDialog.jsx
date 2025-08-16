import React from 'react'
import {Button, Group, Modal, Stack, Text} from '@mantine/core'
import {IconLogout, IconX} from '@tabler/icons-react'

const LogoutDialog = ({ open, onClose, onConfirm, currentUser }) => {
  return (
    <Modal
      opened={open}
      onClose={onClose}
      title="🚪 로그아웃"
      centered
      size="sm"
      styles={{
        content: {
          background: 'rgba(30, 41, 59, 0.95)',
          borderRadius: '24px',
          padding: '32px 28px',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          color: 'white',
          maxWidth: '420px'
        },
        header: {
          backgroundColor: 'transparent',
          borderBottom: 'none',
          padding: '0 0 20px 0'
        },
        title: {
          color: 'white',
          fontSize: '18px',
          fontWeight: 'bold',
          textAlign: 'center',
          width: '100%'
        },
        close: {
          color: 'rgba(255, 255, 255, 0.7)',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            color: 'white'
          }
        },
        body: {
          padding: 0,
          color: 'white'
        },
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(3px)'
        }
      }}
    >
      <Stack gap="24px" align="center">
        {/* Content */}
        <Stack gap="12px" align="center">
          <Text 
            size="md" 
            ta="center"
            style={{ 
              color: 'rgba(255, 255, 255, 0.9)',
              lineHeight: 1.5
            }}
          >
            정말로 로그아웃하시겠습니까?
          </Text>
          
          {currentUser && (
            <Text 
              size="sm" 
              ta="center"
              style={{ 
                color: 'rgba(255, 255, 255, 0.7)',
                fontWeight: 500,
                padding: '8px 16px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              {currentUser.nickname}님의 세션이 종료됩니다.
            </Text>
          )}
        </Stack>

        {/* Action buttons */}
        <Group gap="12px" justify="center" style={{ width: '100%' }}>
          <Button
            variant="outline"
            onClick={onClose}
            leftSection={<IconX size={16} />}
            size="md"
            style={{
              borderColor: 'rgba(255, 255, 255, 0.3)',
              color: 'rgba(255, 255, 255, 0.8)',
              backgroundColor: 'transparent',
              minWidth: '110px',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderColor: 'rgba(255, 255, 255, 0.4)',
                color: 'white'
              }
            }}
          >
            취소
          </Button>
          
          <Button
            variant="filled"
            onClick={onConfirm}
            leftSection={<IconLogout size={16} />}
            size="md"
            style={{
              backgroundColor: '#f44336',
              color: 'white',
              minWidth: '110px',
              fontWeight: 600,
              '&:hover': {
                backgroundColor: '#d32f2f'
              }
            }}
          >
            로그아웃
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}

export default LogoutDialog