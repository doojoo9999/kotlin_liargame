import React, {useState} from 'react';
import {
    Avatar,
    Badge,
    Button,
    Card,
    Container,
    Grid,
    Group,
    ScrollArea,
    Stack,
    Text,
    TextInput,
    Title
} from '@mantine/core';
import {IconCheck, IconCrown, IconLogout, IconSend, IconSettings} from '@tabler/icons-react';

const LightGameRoomPage: React.FC = () => {
  const [message, setMessage] = useState("");
  const [isReady, setIsReady] = useState(false);

  const mockPlayers = [
    { id: "1", nickname: "플레이어1", isHost: true, isReady: true },
    { id: "2", nickname: "플레이어2", isHost: false, isReady: true },
    { id: "3", nickname: "플레이어3", isHost: false, isReady: false },
    { id: "4", nickname: "플레이어4", isHost: false, isReady: true }
  ];

  const mockMessages = [
    { id: "1", player: "플레이어1", message: "안녕하세요! 게임 시작하죠", timestamp: "14:30" },
    { id: "2", player: "System", message: "플레이어2가 준비 완료했습니다.", timestamp: "14:31", isSystem: true },
    { id: "3", player: "플레이어2", message: "준비됐습니다!", timestamp: "14:31" }
  ];

  const handleSendMessage = () => {
    if (message.trim()) {
      setMessage("");
    }
  };

  const canStartGame = mockPlayers.filter(p => p.isReady).length >= 3;

  return (
    <Container size="xl" py="md">
      <Stack spacing="md">
        {/* 헤더 */}
        <Group position="apart">
          <div>
            <Title order={2}>초보자 방</Title>
            <Text color="dimmed">라이어를 찾아라! · 플레이어 {mockPlayers.length}/8</Text>
          </div>
          <Group>
            <Button variant="outline" leftIcon={<IconSettings size={16} />}>
              설정
            </Button>
            <Button color="red" leftIcon={<IconLogout size={16} />}>
              나가기
            </Button>
          </Group>
        </Group>

        <Grid>
          {/* 플레이어 목록 */}
          <Grid.Col span={8}>
            <Card withBorder padding="lg">
              <Group position="apart" mb="md">
                <Group>
                  <IconCrown size={20} style={{ color: 'gold' }} />
                  <Title order={4}>플레이어 목록</Title>
                </Group>
                <Text size="sm" color="dimmed">
                  게임 시작까지 최소 3명이 필요합니다
                </Text>
              </Group>

              <Grid mb="md">
                {mockPlayers.map((player) => (
                  <Grid.Col key={player.id} span={6}>
                    <Card withBorder padding="sm">
                      <Group>
                        <Avatar size="sm">{player.nickname[0]}</Avatar>
                        <div style={{ flex: 1 }}>
                          <Group spacing="xs">
                            <Text size="sm" weight={500}>{player.nickname}</Text>
                            {player.isHost && <IconCrown size={14} style={{ color: 'gold' }} />}
                          </Group>
                          <Text size="xs" color="dimmed">
                            {player.id === "2" ? "나" : "플레이어"}
                          </Text>
                        </div>
                        <Badge color={player.isReady ? "green" : "yellow"} size="sm">
                          {player.isReady ? "준비완료" : "대기중"}
                        </Badge>
                      </Group>
                    </Card>
                  </Grid.Col>
                ))}
              </Grid>

              <Stack spacing="sm">
                <Button
                  fullWidth
                  color={isReady ? "yellow" : "green"}
                  onClick={() => setIsReady(!isReady)}
                >
                  {isReady ? "준비 해제" : "준비 완료"}
                </Button>

                <Button
                  fullWidth
                  disabled={!canStartGame}
                  leftIcon={<IconCheck size={16} />}
                >
                  게임 시작 ({mockPlayers.filter(p => p.isReady).length}/3)
                </Button>
              </Stack>
            </Card>
          </Grid.Col>

          {/* 채팅 */}
          <Grid.Col span={4}>
            <Card withBorder padding="lg" style={{ height: 600, display: 'flex', flexDirection: 'column' }}>
              <Title order={4} mb="md">채팅</Title>

              <ScrollArea style={{ flex: 1 }} mb="md">
                <Stack spacing="xs">
                  {mockMessages.map((msg) => (
                    <div
                      key={msg.id}
                      style={{
                        padding: 8,
                        borderRadius: 8,
                        backgroundColor: msg.isSystem
                          ? '#f1f3f4'
                          : msg.player === "플레이어2"
                          ? '#1976d2'
                          : 'white',
                        color: msg.isSystem
                          ? '#666'
                          : msg.player === "플레이어2"
                          ? 'white'
                          : 'black',
                        border: msg.player !== "플레이어2" && !msg.isSystem ? '1px solid #e0e0e0' : 'none',
                        marginLeft: msg.player === "플레이어2" ? 'auto' : 0,
                        marginRight: msg.player === "플레이어2" ? 0 : 'auto',
                        maxWidth: msg.isSystem ? '100%' : '80%',
                        textAlign: msg.isSystem ? 'center' : 'left'
                      }}
                    >
                      {!msg.isSystem && (
                        <Text size="xs" style={{ opacity: 0.7, marginBottom: 2 }}>
                          {msg.player} · {msg.timestamp}
                        </Text>
                      )}
                      <Text size="sm">{msg.message}</Text>
                    </div>
                  ))}
                </Stack>
              </ScrollArea>

              <Group spacing="xs">
                <TextInput
                  placeholder="메시지를 입력하세요..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  style={{ flex: 1 }}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!message.trim()}
                  px="xs"
                >
                  <IconSend size={16} />
                </Button>
              </Group>
            </Card>
          </Grid.Col>
        </Grid>
      </Stack>
    </Container>
  );
};

export default LightGameRoomPage;
