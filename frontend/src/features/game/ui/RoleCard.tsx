import {Badge, Card, Group, Stack, Text} from '@mantine/core';
import {Eye, EyeOff} from 'lucide-react';

interface RoleCardProps {
  isLiar: boolean;
  subject?: string;
  word?: string;
  isRevealed: boolean;
  onToggleReveal?: () => void;
}

export function RoleCard({ isLiar, subject, word, isRevealed, onToggleReveal }: RoleCardProps) {
  return (
    <Card withBorder p="md" radius="md" shadow="sm">
      <Stack gap="sm">
        <Group justify="space-between">
          <Text size="lg" fw={600}>
            당신의 역할
          </Text>
          {onToggleReveal && (
            <Badge
              variant="light"
              color={isRevealed ? "blue" : "gray"}
              style={{ cursor: 'pointer' }}
              onClick={onToggleReveal}
              leftSection={isRevealed ? <Eye size={14} /> : <EyeOff size={14} />}
            >
              {isRevealed ? "숨기기" : "보기"}
            </Badge>
          )}
        </Group>

        {isRevealed && (
          <>
            <Badge
              size="lg"
              color={isLiar ? "red" : "blue"}
              variant="filled"
            >
              {isLiar ? "라이어" : "시민"}
            </Badge>

            {!isLiar && subject && (
              <Stack gap="xs">
                <Text size="sm" c="dimmed">주제</Text>
                <Text fw={500}>{subject}</Text>
              </Stack>
            )}

            {!isLiar && word && (
              <Stack gap="xs">
                <Text size="sm" c="dimmed">단어</Text>
                <Text fw={500} c="blue">{word}</Text>
              </Stack>
            )}

            {isLiar && (
              <Text size="sm" c="dimmed" style={{ fontStyle: 'italic' }}>
                다른 플레이어들의 힌트를 듣고 주제를 추측하세요!
              </Text>
            )}
          </>
        )}

        {!isRevealed && (
          <Text size="sm" c="dimmed" ta="center" py="md">
            클릭하여 역할을 확인하세요
          </Text>
        )}
      </Stack>
    </Card>
  );
}
