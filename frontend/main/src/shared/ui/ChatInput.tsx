import {Badge, Button, Card, Group, Progress, Stack, Text, TextInput} from '@mantine/core';
import {IconSend} from '@tabler/icons-react';
import {useState} from 'react';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
  gamePhase?: 'HINT_PHASE' | 'DEFENSE_PHASE' | 'NORMAL';
}

export function ChatInput({
  onSend,
  disabled = false,
  placeholder = "메시지를 입력하세요...",
  maxLength = 200,
  gamePhase = 'NORMAL'
}: ChatInputProps) {
  const [message, setMessage] = useState('');

  const handleSubmit = () => {
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const getPhaseStyle = () => {
    switch (gamePhase) {
      case 'HINT_PHASE':
        return { borderColor: 'blue', placeholder: '힌트를 입력하세요...' };
      case 'DEFENSE_PHASE':
        return { borderColor: 'orange', placeholder: '변론을 입력하세요...' };
      default:
        return { borderColor: undefined, placeholder };
    }
  };

  const phaseStyle = getPhaseStyle();

  return (
    <Card padding="sm" withBorder>
      <Stack gap="xs">
        {gamePhase !== 'NORMAL' && (
          <Group justify="space-between">
            <Badge
              color={gamePhase === 'HINT_PHASE' ? 'blue' : 'orange'}
              variant="light"
            >
              {gamePhase === 'HINT_PHASE' ? '힌트 입력 중' : '변론 입력 중'}
            </Badge>
            <Text size="xs" c="dimmed">
              {message.length}/{maxLength}
            </Text>
          </Group>
        )}

        <Group gap="xs">
          <TextInput
            flex={1}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={phaseStyle.placeholder}
            disabled={disabled}
            maxLength={maxLength}
            style={{
              borderColor: phaseStyle.borderColor
            }}
          />
          <Button
            onClick={handleSubmit}
            disabled={!message.trim() || disabled}
            leftSection={<IconSend size={16} />}
            color={gamePhase === 'HINT_PHASE' ? 'blue' : gamePhase === 'DEFENSE_PHASE' ? 'orange' : undefined}
          >
            전송
          </Button>
        </Group>

        {message.length > maxLength * 0.8 && (
          <Progress
            value={(message.length / maxLength) * 100}
            color={message.length >= maxLength ? 'red' : 'yellow'}
            size="xs"
          />
        )}
      </Stack>
    </Card>
  );
}
