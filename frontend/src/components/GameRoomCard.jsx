import {Badge, Button, Card, Group, Text} from '@mantine/core'
import {IconLock, IconLogin, IconUsers} from '@tabler/icons-react'
import {motion} from 'framer-motion'

const MotionCard = motion.create(Card)

export function GameRoomCard({ room, onJoin }) {
  return (
    <MotionCard
      shadow="xl"
      padding="xl"
      radius="xl"
      withBorder
      whileHover={{ y: -5, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      style={{ 
        background: 'rgba(30, 41, 59, 0.95)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        padding: '24px'
      }}
    >
      <Group justify="space-between" mb="xs">
        <Text fw={600} size="lg" style={{ color: '#ffffff' }}>#{room.gameNumber}</Text>
        <Badge 
          color={room.state === 'WAITING' ? 'green' : 'blue'} 
          variant="filled"
          style={{ 
            backgroundColor: room.state === 'WAITING' ? '#22c55e' : '#3b82f6',
            color: 'white'
          }}
        >
          {room.state === 'WAITING' ? '대기중' : '진행중'}
        </Badge>
      </Group>

      <Text size="sm" style={{ color: 'rgba(255, 255, 255, 0.8)' }} mb="md">
        {room.title || '제목 없음'}
      </Text>

      <Group justify="space-between">
        <Group gap="xs" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
          <IconUsers size={16} color="rgba(255, 255, 255, 0.9)" />
          <Text size="sm" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
            {room.currentPlayers || 0}/{room.maxPlayers || 4}
          </Text>
          {room.hasPassword && <IconLock size={16} color="#fbbf24" />}
        </Group>

        <Button 
          leftSection={<IconLogin size={16} />}
          variant="gradient" 
          gradient={{ from: '#06b6d4', to: '#8b5cf6' }}
          size="sm"
          onClick={() => onJoin(room)}
          style={{
            fontWeight: 600,
            color: 'white',
            border: 'none'
          }}
        >
          입장
        </Button>
      </Group>
    </MotionCard>
  )
}