import {useState} from 'react';
import {Alert, Button, Card, Group, Stack, Text, Textarea} from '@mantine/core';
import {AlertTriangle, Brain, Send, Target} from 'lucide-react';

interface LiarGuessInputProps {
  onSubmitGuess: (guess: string) => void;
  isLiar: boolean;
  isGuessPhase: boolean;
  timeRemaining?: number;
  isDisabled?: boolean;
  maxLength?: number;
}

export function LiarGuessInput({
  onSubmitGuess,
  isLiar,
  isGuessPhase,
  timeRemaining,
  isDisabled = false,
  maxLength = 50
}: LiarGuessInputProps) {
  const [guess, setGuess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!guess.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmitGuess(guess.trim());
      setGuess('');
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

  // 라이어가 아닌 경우
  if (!isLiar) {
    return (
      <Card withBorder padding="md" style={{ backgroundColor: '#f3f9f3' }}>
        <Group gap="sm">
          <Target size={20} color="#51cf66" />
          <Text c="green" fw={500}>
            당신은 시민입니다. 라이어의 추측을 기다려주세요.
          </Text>
        </Group>
      </Card>
    );
  }

  // 추측 단계가 아닌 경우
  if (!isGuessPhase) {
    return (
      <Card withBorder padding="md" style={{ backgroundColor: '#fff5f5' }}>
        <Group gap="sm">
          <Brain size={20} color="#fa5252" />
          <Text c="red" fw={500}>
            아직 추측 단계가 아닙니다. 잠시 기다려주세요.
          </Text>
        </Group>
      </Card>
    );
  }

  return (
    <Card withBorder padding="lg" shadow="sm" style={{ borderColor: '#fa5252' }}>
      <Stack gap="md">
        <Group justify="space-between">
          <Group gap="sm">
            <Brain size={20} color="#fa5252" />
            <Text fw={600} size="lg" c="red">주제 추측</Text>
          </Group>
          {timeRemaining && (
            <Text size="sm" c={timeRemaining <= 10 ? 'red' : 'orange'} fw={500}>
              남은 시간: {timeRemaining}초
            </Text>
          )}
        </Group>

        <Alert icon={<AlertTriangle size={16} />} color="red" variant="light">
          <Text size="sm">
            <strong>마지막 기회입니다!</strong> 시민들의 힌트를 바탕으로 주제를 추측하세요.
          </Text>
        </Alert>

        {timeRemaining && timeRemaining <= 15 && (
          <Alert color="orange" variant="light">
            시간이 얼마 남지 않았습니다! 빠르게 추측하세요.
          </Alert>
        )}

        <Textarea
          placeholder="주제를 입력하세요... (예: 음식, 동물, 스포츠 등)"
          value={guess}
          onChange={(e) => setGuess(e.currentTarget.value)}
          onKeyPress={handleKeyPress}
          disabled={isDisabled || isSubmitting}
          maxLength={maxLength}
          minRows={2}
          maxRows={4}
          autosize
        />

        <Group justify="space-between">
          <Text size="xs" c="dimmed">
            {guess.length}/{maxLength}자
          </Text>
          <Text size="xs" c="dimmed">
            Enter로 빠른 제출 가능
          </Text>
        </Group>

        <Button
          onClick={handleSubmit}
          disabled={!guess.trim() || isDisabled || isSubmitting}
          loading={isSubmitting}
          leftSection={<Send size={16} />}
          color="red"
          size="md"
          fullWidth
        >
          주제 추측 제출
        </Button>

        <Text size="xs" c="red" ta="center" fw={500}>
          정확히 맞추면 라이어가 승리합니다!
        </Text>
      </Stack>
    </Card>
  );
}
