import {useState} from 'react';
import {Alert, Button, Card, Stack, Text, TextInput} from '@mantine/core';
import {MessageCircle, Send} from 'lucide-react';

interface HintInputProps {
  onSubmitHint: (hint: string) => void;
  isMyTurn: boolean;
  isDisabled?: boolean;
  playerName?: string;
  timeLeft?: number;
}

export function HintInput({ onSubmitHint, isMyTurn, isDisabled, playerName, timeLeft }: HintInputProps) {
  const [hint, setHint] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!hint.trim() || isSubmitting || isDisabled) return;

    setIsSubmitting(true);
    try {
      await onSubmitHint(hint.trim());
      setHint('');
    } catch (error) {
      console.error('Failed to submit hint:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!isMyTurn) {
    return (
      <Card withBorder p="md" radius="md" bg="gray.0">
        <Stack gap="sm">
          <Text size="sm" c="dimmed" ta="center">
            {playerName ? `${playerName}님의 턴입니다` : '다른 플레이어의 턴입니다'}
          </Text>
          {timeLeft !== undefined && (
            <Text size="xs" c="orange" ta="center">
              남은 시간: {timeLeft}초
            </Text>
          )}
        </Stack>
      </Card>
    );
  }

  return (
    <Card withBorder p="md" radius="md" shadow="sm">
      <Stack gap="sm">
        <Text size="lg" fw={600} c="blue">
          <MessageCircle size={20} style={{ display: 'inline', marginRight: '8px' }} />
          힌트를 입력하세요
        </Text>

        {timeLeft !== undefined && (
          <Alert color="orange" variant="light">
            남은 시간: {timeLeft}초
          </Alert>
        )}

        <TextInput
          placeholder="힌트를 입력하세요..."
          value={hint}
          onChange={(e) => setHint(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isDisabled || isSubmitting}
          maxLength={100}
          rightSection={
            <Text size="xs" c="dimmed">
              {hint.length}/100
            </Text>
          }
        />

        <Button
          onClick={handleSubmit}
          disabled={!hint.trim() || isDisabled || isSubmitting}
          loading={isSubmitting}
          leftSection={<Send size={16} />}
          fullWidth
        >
          힌트 제출
        </Button>

        <Text size="xs" c="dimmed" ta="center">
          Enter 키를 눌러서도 제출할 수 있습니다
        </Text>
      </Stack>
    </Card>
  );
}
