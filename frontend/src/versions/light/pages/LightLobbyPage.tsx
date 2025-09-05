import React from 'react';
import {Badge, Button, Card, Container, Grid, Group, Stack, Text, Title} from '@mantine/core';
import {IconCrown, IconSettings, IconUsers} from '@tabler/icons-react';

const LightLobbyPage: React.FC = () => {
  const mockRooms = [
    {
      id: "1",
      name: "초보자 방",
      host: "플레이어1",
      currentPlayers: 3,
      maxPlayers: 8,
      gameMode: "LIARS_KNOW",
      status: "waiting" as const
    },
    {
      id: "2",
      name: "고수방",
      host: "마스터",
      currentPlayers: 6,
      maxPlayers: 10,
      gameMode: "LIARS_DIFFERENT_WORD",
      status: "playing" as const
    }
  ];

  return (
    <Container size="xl" py="xl">
      <Stack spacing="xl">
        {/* 헤더 */}
        <div style={{ textAlign: 'center' }}>
          <Title order={1} mb="sm">라이어 게임 로비</Title>
          <Text color="dimmed">친구들과 함께 즐기는 추리 게임</Text>
        </div>

        {/* 통계 */}
        <Grid>
          <Grid.Col span={4}>
            <Card withBorder padding="lg" style={{ textAlign: 'center' }}>
              <IconUsers size={32} style={{ margin: '0 auto', marginBottom: 8 }} />
              <Title order={2}>1,234</Title>
              <Text size="sm" color="dimmed">온라인 플레이어</Text>
            </Card>
          </Grid.Col>
          <Grid.Col span={4}>
            <Card withBorder padding="lg" style={{ textAlign: 'center' }}>
              <IconSettings size={32} style={{ margin: '0 auto', marginBottom: 8 }} />
              <Title order={2}>56</Title>
              <Text size="sm" color="dimmed">진행 중인 게임</Text>
            </Card>
          </Grid.Col>
          <Grid.Col span={4}>
            <Card withBorder padding="lg" style={{ textAlign: 'center' }}>
              <IconCrown size={32} style={{ margin: '0 auto', marginBottom: 8 }} />
              <Title order={2}>89</Title>
              <Text size="sm" color="dimmed">대기 중인 방</Text>
            </Card>
          </Grid.Col>
        </Grid>

        {/* 방 목록 */}
        <div>
          <Group position="apart" mb="md">
            <Title order={3}>게임 방 목록</Title>
            <Button>방 만들기</Button>
          </Group>

          <Grid>
            {mockRooms.map((room) => (
              <Grid.Col key={room.id} span={6}>
                <Card withBorder padding="lg">
                  <Group position="apart" mb="xs">
                    <Title order={4}>{room.name}</Title>
                    <Badge color={room.status === 'waiting' ? 'green' : 'yellow'}>
                      {room.status === 'waiting' ? '대기중' : '게임중'}
                    </Badge>
                  </Group>

                  <Group spacing="xs" mb="md">
                    <IconCrown size={16} />
                    <Text size="sm">{room.host}</Text>
                  </Group>

                  <Stack spacing="xs" mb="md">
                    <Group position="apart">
                      <Text size="sm">플레이어</Text>
                      <Text size="sm" weight={500}>
                        {room.currentPlayers}/{room.maxPlayers}
                      </Text>
                    </Group>
                    <Group position="apart">
                      <Text size="sm">게임 모드</Text>
                      <Badge variant="outline" size="sm">
                        {room.gameMode === 'LIARS_KNOW' ? '라이어가 아는' : '라이어가 모르는'}
                      </Badge>
                    </Group>
                  </Stack>

                  <Button
                    fullWidth
                    variant={room.status === 'waiting' ? 'filled' : 'outline'}
                    disabled={room.status === 'playing'}
                  >
                    {room.status === 'waiting' ? '참가하기' : '관전하기'}
                  </Button>
                </Card>
              </Grid.Col>
            ))}
          </Grid>
        </div>
      </Stack>
    </Container>
  );
};

export default LightLobbyPage;
