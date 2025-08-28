import {useState} from 'react';
import {Alert, Button, Card, Stack, Text, TextInput} from '@mantine/core';
import {Send, Target} from 'lucide-react';

interface LiarGuessInputProps {
  onSubmitGuess: (guess: string) => void;
  isLiar: boolean;
  isLiarGuessPhase: boolean;
  isDisabled?: boolean;
  timeLeft?: number;
}

export function LiarGuessInput({
  onSubmitGuess,
  isLiar,
  isLiarGuessPhase,
  isDisabled,
  timeLeft
}: LiarGuessInputProps) {
  const [guess, setGuess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!guess.trim() || isSubmitting || isDisabled) return;

    setIsSubmitting(true);
    try {
      await onSubmitGuess(guess.trim());
      setGuess('');
    } catch (error) {
      console.error('Failed to submit guess:', error);
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

  if (!isLiarGuessPhase) {
    return null;
  }

  if (!isLiar) {
    return (
      <Card withBorder p="md" radius="md" bg="gray.0">
        <Stack gap="sm">
          <Text size="sm" c="dimmed" ta="center">
            라이어가 주제를 추측하고 있습니다...
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
    <Card withBorder p="md" radius="md" shadow="sm" bg="red.0">
      <Stack gap="sm">
        <Text size="lg" fw={600} c="red">
          <Target size={20} style={{ display: 'inline', marginRight: '8px' }} />
          주제를 추측하세요!
        </Text>

        <Alert color="red" variant="light">
          <Text size="sm">
            마지막 기회입니다! 주제를 정확히 맞추면 라이어가 승리합니다.
          </Text>
        </Alert>

        {timeLeft !== undefined && (
          <Alert color="orange" variant="light">
            남은 시간: {timeLeft}초
          </Alert>
        )}

        <TextInput
          placeholder="주제를 입력하세요..."
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isDisabled || isSubmitting}
          maxLength={50}
          rightSection={
            <Text size="xs" c="dimmed">
              {guess.length}/50
            </Text>
          }
        />

        <Button
          onClick={handleSubmit}
          disabled={!guess.trim() || isDisabled || isSubmitting}
          loading={isSubmitting}
          leftSection={<Send size={16} />}
          color="red"
          fullWidth
        >
          주제 추측 제출
        </Button>

        <Text size="xs" c="dimmed" ta="center">
          신중하게 생각하세요. 한 번만 기회가 있습니다!
        </Text>
      </Stack>
    </Card>
  );
}
