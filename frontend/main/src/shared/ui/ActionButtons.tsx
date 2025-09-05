import {Box, Button, Group, Modal, Stack, Text} from '@mantine/core';
import {IconAlertTriangle, IconCheck, IconExclamationMark, IconInfo, IconX} from '@tabler/icons-react';
import {AnimatePresence, motion} from 'framer-motion';

interface ActionButtonsProps {
  primaryAction?: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
    loading?: boolean;
    color?: string;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
  };
  dangerAction?: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
    confirmText?: string;
  };
}

export function ActionButtons({
  primaryAction,
  secondaryAction,
  dangerAction
}: ActionButtonsProps) {
  return (
    <Group justify="center" gap="md">
      {secondaryAction && (
        <Button
          variant="light"
          onClick={secondaryAction.onClick}
          disabled={secondaryAction.disabled}
        >
          {secondaryAction.label}
        </Button>
      )}

      {primaryAction && (
        <Button
          onClick={primaryAction.onClick}
          disabled={primaryAction.disabled}
          loading={primaryAction.loading}
          color={primaryAction.color}
          leftSection={<IconCheck size={16} />}
        >
          {primaryAction.label}
        </Button>
      )}

      {dangerAction && (
        <Button
          color="red"
          variant="light"
          onClick={dangerAction.onClick}
          disabled={dangerAction.disabled}
          leftSection={<IconX size={16} />}
        >
          {dangerAction.label}
        </Button>
      )}
    </Group>
  );
}

interface ConfirmModalProps {
  opened: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: 'warning' | 'danger' | 'info' | 'success';
  size?: 'sm' | 'md' | 'lg';
}

export function ConfirmModal({
  opened,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = '확인',
  cancelLabel = '취소',
  type = 'warning',
  size = 'md'
}: ConfirmModalProps) {
  const getTypeConfig = () => {
    switch (type) {
      case 'danger':
        return {
          icon: IconAlertTriangle,
          iconColor: 'var(--game-danger)',
          iconBg: 'rgba(239, 68, 68, 0.1)',
          confirmColor: 'red',
          accentColor: 'var(--game-danger)',
          bgGradient: 'linear-gradient(135deg, rgba(239, 68, 68, 0.03) 0%, transparent 60%)'
        };
      case 'warning':
        return {
          icon: IconExclamationMark,
          iconColor: 'var(--game-warning)',
          iconBg: 'rgba(245, 158, 11, 0.1)',
          confirmColor: 'orange',
          accentColor: 'var(--game-warning)',
          bgGradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.03) 0%, transparent 60%)'
        };
      case 'info':
        return {
          icon: IconInfo,
          iconColor: 'var(--game-neon-primary)',
          iconBg: 'rgba(14, 165, 233, 0.1)',
          confirmColor: 'blue',
          accentColor: 'var(--game-neon-primary)',
          bgGradient: 'linear-gradient(135deg, rgba(14, 165, 233, 0.03) 0%, transparent 60%)'
        };
      case 'success':
        return {
          icon: IconCheck,
          iconColor: 'var(--game-success)',
          iconBg: 'rgba(34, 197, 94, 0.1)',
          confirmColor: 'green',
          accentColor: 'var(--game-success)',
          bgGradient: 'linear-gradient(135deg, rgba(34, 197, 94, 0.03) 0%, transparent 60%)'
        };
      default:
        return {
          icon: IconExclamationMark,
          iconColor: 'var(--game-warning)',
          iconBg: 'rgba(245, 158, 11, 0.1)',
          confirmColor: 'orange',
          accentColor: 'var(--game-warning)',
          bgGradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.03) 0%, transparent 60%)'
        };
    }
  };

  const config = getTypeConfig();
  const IconComponent = config.icon;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={null}
      centered
      size={size}
      padding={0}
      radius="xl"
      styles={{
        content: {
          background: 'rgba(20, 21, 23, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          overflow: 'hidden',
        },
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(4px)',
        },
        body: {
          padding: 0,
        },
      }}
      transitionProps={{
        transition: 'fade',
        duration: 200,
      }}
    >
      <AnimatePresence>
        {opened && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{
              duration: 0.2,
              ease: [0.16, 1, 0.3, 1] // Linear.app 스타일 easing
            }}
          >
            {/* 배경 그라데이션 */}
            <Box
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: config.bgGradient,
                pointerEvents: 'none',
                zIndex: 0,
              }}
            />

            {/* 메인 콘텐츠 */}
            <Box
              style={{
                position: 'relative',
                zIndex: 1,
                padding: '32px',
              }}
            >
              <Stack gap="lg">
                {/* 아이콘과 제목 */}
                <Group gap="md" align="flex-start">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.1, duration: 0.4, type: "spring", stiffness: 200 }}
                  >
                    <Box
                      style={{
                        padding: '12px',
                        background: config.iconBg,
                        borderRadius: '12px',
                        border: `1px solid ${config.accentColor}20`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backdropFilter: 'blur(8px)',
                      }}
                    >
                      <IconComponent
                        size={24}
                        style={{ color: config.iconColor }}
                      />
                    </Box>
                  </motion.div>

                  <div style={{ flex: 1 }}>
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15, duration: 0.3 }}
                    >
                      <Text
                        size="xl"
                        fw={600}
                        style={{
                          color: 'var(--game-text-primary)',
                          marginBottom: '8px',
                          lineHeight: 1.3,
                        }}
                      >
                        {title}
                      </Text>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2, duration: 0.3 }}
                    >
                      <Text
                        size="md"
                        style={{
                          color: 'var(--game-text-secondary)',
                          lineHeight: 1.5,
                        }}
                      >
                        {message}
                      </Text>
                    </motion.div>
                  </div>
                </Group>

                {/* 액션 버튼들 */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25, duration: 0.3 }}
                >
                  <Group justify="flex-end" gap="sm" pt="md">
                    <Button
                      variant="subtle"
                      color="gray"
                      onClick={onClose}
                      style={{
                        color: 'var(--game-text-secondary)',
                        backgroundColor: 'transparent',
                        border: '1px solid rgba(255, 255, 255, 0.1)',

                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                        },
                      }}
                    >
                      {cancelLabel}
                    </Button>

                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        color={config.confirmColor}
                        onClick={onConfirm}
                        style={{
                          background: `linear-gradient(135deg, ${config.accentColor}, ${config.accentColor}dd)`,
                          border: 'none',
                          boxShadow: `0 0 20px ${config.accentColor}40`,
                          fontWeight: 600,

                          '&:hover': {
                            background: `linear-gradient(135deg, ${config.accentColor}dd, ${config.accentColor}bb)`,
                            boxShadow: `0 0 30px ${config.accentColor}60`,
                            transform: 'translateY(-1px)',
                          },
                        }}
                        leftSection={
                          type === 'danger' ? <IconX size={16} /> :
                          type === 'success' ? <IconCheck size={16} /> :
                          <IconCheck size={16} />
                        }
                      >
                        {confirmLabel}
                      </Button>
                    </motion.div>
                  </Group>
                </motion.div>
              </Stack>
            </Box>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
}
