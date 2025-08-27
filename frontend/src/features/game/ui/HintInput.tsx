import {useState} from 'react';
import {Alert, Button, Card, Group, Stack, Text, TextInput} from '@mantine/core';
import {AlertTriangle, MessageCircle, Send} from 'lucide-react';

interface HintInputProps {
  onSubmitHint: (hint: string) => void;
  isMyTurn: boolean;
  isDisabled?: boolean;
  timeRemaining?: number;
  maxLength?: number;
}

export function HintInput({
  onSubmitHint,
  isMyTurn,
  isDisabled = false,
  timeRemaining,
  maxLength = 100
}: HintInputProps) {
  const [hint, setHint] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!hint.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmitHint(hint.trim());
      setHint('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  };

  if (!isMyTurn) {
    return (
      <Card withBorder padding="md" style={{ backgroundColor: '#f8f9fa' }}>
        <Group gap="sm">
          <MessageCircle size={20} color="#868e96" />
          <Text c="dimmed">다른 플레이어의 턴입니다. 잠시 기다려주세요.</Text>
        </Group>
      </Card>
    );
  }

  return (
    <Card withBorder padding="lg" shadow="sm">
      <Stack gap="md">
        <Group justify="space-between">
          <Text fw={600} size="md">힌트 입력</Text>
          {timeRemaining && (
            <Text size="sm" c={timeRemaining <= 10 ? 'red' : 'blue'}>
              남은 시간: {timeRemaining}초
            </Text>
          )}
        </Group>

        {timeRemaining && timeRemaining <= 10 && (
          <Alert icon={<AlertTriangle size={16} />} color="orange" variant="light">
            시간이 얼마 남지 않았습니다!
          </Alert>
        )}

        <TextInput
          placeholder="힌트를 입력하세요..."
          value={hint}
          onChange={(e) => setHint(e.currentTarget.value)}
          onKeyPress={handleKeyPress}
          disabled={isDisabled || isSubmitting}
          maxLength={maxLength}
          rightSection={
            <Text size="xs" c="dimmed">
              {hint.length}/{maxLength}
            </Text>
          }
          rightSectionWidth={60}
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
          Enter를 눌러서 빠르게 제출할 수 있습니다
        </Text>
      </Stack>
    </Card>
  );
}
