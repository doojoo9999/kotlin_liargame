import {ActionIcon, Badge, Box, Card, Group, Stack, Text, Tooltip} from '@mantine/core';
import {IconCopy, IconRobot, IconShield, IconTarget, IconUser} from '@tabler/icons-react';
import {motion} from 'framer-motion';
import dayjs from 'dayjs';

export type ChatMessageType = 'user' | 'system' | 'hint' | 'vote' | 'defense';

interface ChatMessageProps {
  type: ChatMessageType;
  content: string;
  senderName?: string;
  timestamp: Date;
  isOwn?: boolean;
  round?: number;
  metadata?: Record<string, any>;
}

export function ChatMessage({
  type,
  content,
  senderName,
  timestamp,
  isOwn = false,
  round,
  metadata
}: ChatMessageProps) {
  const getMessageConfig = () => {
    switch (type) {
      case 'user':
        return {
          bg: isOwn
            ? 'linear-gradient(135deg, rgba(14, 165, 233, 0.15) 0%, rgba(14, 165, 233, 0.05) 100%)'
            : 'rgba(255, 255, 255, 0.03)',
          border: isOwn
            ? '1px solid rgba(14, 165, 233, 0.3)'
            : '1px solid rgba(255, 255, 255, 0.1)',
          align: isOwn ? 'right' : 'left',
          icon: IconUser,
          accentColor: isOwn ? 'var(--game-neon-primary)' : 'var(--game-text-secondary)'
        };
      case 'system':
        return {
          bg: 'linear-gradient(135deg, rgba(156, 163, 175, 0.1) 0%, rgba(156, 163, 175, 0.05) 100%)',
          border: '1px solid rgba(156, 163, 175, 0.2)',
          align: 'center',
          icon: IconRobot,
          accentColor: 'var(--game-text-muted)'
        };
      case 'hint':
        return {
          bg: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(34, 197, 94, 0.05) 100%)',
          border: '1px solid rgba(34, 197, 94, 0.3)',
          align: 'left',
          icon: IconShield,
          accentColor: 'var(--game-success)'
        };
      case 'vote':
        return {
          bg: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.05) 100%)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          align: 'center',
          icon: IconTarget,
          accentColor: 'var(--game-danger)'
        };
      case 'defense':
        return {
          bg: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.05) 100%)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          align: 'left',
          icon: IconShield,
          accentColor: 'var(--game-warning)'
        };
      default:
        return {
          bg: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          align: 'left',
          icon: IconUser,
          accentColor: 'var(--game-text-secondary)'
        };
    }
  };

  const messageConfig = getMessageConfig();
  const IconComponent = messageConfig.icon;

  const getTypeLabel = () => {
    switch (type) {
      case 'hint': return 'Hint';
      case 'vote': return 'Vote';
      case 'defense': return 'Defense';
      case 'system': return 'System';
      default: return null;
    }
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(content);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      style={{
        maxWidth: type === 'user' ? '75%' : '90%',
        alignSelf: messageConfig.align === 'right' ? 'flex-end' :
                  messageConfig.align === 'center' ? 'center' : 'flex-start',
        margin: '4px 0'
      }}
    >
      <Card
        padding="md"
        radius="lg"
        style={{
          background: messageConfig.bg,
          border: messageConfig.border,
          backdropFilter: 'blur(12px)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* 배경 패턴 */}
        {type !== 'user' && (
          <Box
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '60px',
              height: '60px',
              background: `radial-gradient(circle, ${messageConfig.accentColor}08 0%, transparent 70%)`,
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />
        )}

        <Stack gap="xs" style={{ position: 'relative', zIndex: 1 }}>
          {/* 메시지 헤더 */}
          <Group justify="space-between" gap="xs">
            <Group gap="xs">
              {/* 아이콘과 타입 */}
              {getTypeLabel() && (
                <Group gap="xs">
                  <Box
                    style={{
                      padding: '4px',
                      background: `${messageConfig.accentColor}20`,
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <IconComponent size={12} style={{ color: messageConfig.accentColor }} />
                  </Box>
                  <Badge
                    size="xs"
                    variant="light"
                    style={{
                      background: `${messageConfig.accentColor}15`,
                      border: `1px solid ${messageConfig.accentColor}30`,
                      color: messageConfig.accentColor,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      fontWeight: 600,
                    }}
                  >
                    {getTypeLabel()}
                  </Badge>
                </Group>
              )}

              {/* 발신자 이름 */}
              {senderName && type === 'user' && (
                <Text
                  size="sm"
                  fw={600}
                  style={{
                    color: isOwn ? 'var(--game-neon-primary)' : 'var(--game-text-primary)',
                  }}
                >
                  {senderName}
                </Text>
              )}

              {/* 라운드 */}
              {round && (
                <Badge
                  size="xs"
                  variant="outline"
                  style={{
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    color: 'var(--game-text-muted)',
                    background: 'transparent',
                  }}
                >
                  R{round}
                </Badge>
              )}
            </Group>

            {/* 시간과 액션 */}
            <Group gap="xs">
              <Text
                size="xs"
                style={{
                  color: 'var(--game-text-muted)',
                  fontWeight: 500,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {dayjs(timestamp).format('HH:mm')}
              </Text>

              {type === 'user' && (
                <Tooltip label="Copy message" position="top">
                  <ActionIcon
                    size="sm"
                    variant="subtle"
                    color="gray"
                    onClick={handleCopyMessage}
                    style={{
                      transition: 'all 0.2s ease',
                      opacity: 0.6,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = '1';
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = '0.6';
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <IconCopy size={12} />
                  </ActionIcon>
                </Tooltip>
              )}
            </Group>
          </Group>

          {/* 메시지 내용 */}
          <Text
            size="sm"
            style={{
              wordBreak: 'break-word',
              lineHeight: 1.5,
              color: 'var(--game-text-primary)',
              textAlign: messageConfig.align as any,
            }}
          >
            {content}
          </Text>

          {/* 메타데이터 (투표 정보 등) */}
          {metadata && type === 'vote' && (
            <Box
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '8px',
                padding: '8px 12px',
                marginTop: '4px',
              }}
            >
              <Group justify="center" gap="xs">
                {metadata.targetPlayer && (
                  <Group gap="xs">
                    <IconTarget size={12} style={{ color: 'var(--game-danger)' }} />
                    <Text size="xs" fw={500} style={{ color: 'var(--game-danger)' }}>
                      {metadata.targetPlayer}
                    </Text>
                  </Group>
                )}
                {metadata.voteCount && (
                  <Badge
                    size="xs"
                    color="gameRed"
                    style={{
                      background: 'var(--game-danger)',
                      color: '#ffffff',
                    }}
                  >
                    {metadata.voteCount} votes
                  </Badge>
                )}
              </Group>
            </Box>
          )}
        </Stack>
      </Card>
    </motion.div>
  );
}
