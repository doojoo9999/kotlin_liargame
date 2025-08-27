import {Badge, Card, Group, Stack, Text, ThemeIcon} from '@mantine/core';
import {Eye, EyeOff} from 'lucide-react';

interface RoleCardProps {
  role: 'LIAR' | 'CITIZEN';
  word?: string;
  subject?: string;
  isRevealed?: boolean;
}

export function RoleCard({ role, word, subject, isRevealed = true }: RoleCardProps) {
  const isLiar = role === 'LIAR';

  return (
    <Card
      shadow="md"
      padding="lg"
      radius="md"
      withBorder
      style={{
        borderColor: isLiar ? '#fa5252' : '#51cf66',
        backgroundColor: isLiar ? '#fff5f5' : '#f3f9f3'
      }}
    >
      <Stack gap="md">
        <Group justify="space-between">
          <Badge
            color={isLiar ? 'red' : 'green'}
            size="lg"
            variant="filled"
          >
            {isLiar ? '라이어' : '시민'}
          </Badge>
          <ThemeIcon
            color={isRevealed ? 'blue' : 'gray'}
            variant="light"
            size="sm"
          >
            {isRevealed ? <Eye size={16} /> : <EyeOff size={16} />}
          </ThemeIcon>
        </Group>

        {isRevealed && (
          <>
            {subject && (
              <div>
                <Text size="sm" c="dimmed" fw={500}>주제</Text>
                <Text fw={600} size="md">{subject}</Text>
              </div>
            )}

            {!isLiar && word && (
              <div>
                <Text size="sm" c="dimmed" fw={500}>단어</Text>
                <Text fw={700} size="lg" c="green">{word}</Text>
              </div>
            )}

            {isLiar && (
              <div>
                <Text size="sm" c="red" fw={500}>
                  당신은 라이어입니다! 주제를 추측하고 시민들 사이에 섞여보세요.
                </Text>
              </div>
            )}
          </>
        )}

        {!isRevealed && (
          <Text c="dimmed" ta="center" fs="italic">
            역할이 숨겨져 있습니다
          </Text>
        )}
      </Stack>
    </Card>
  );
}
