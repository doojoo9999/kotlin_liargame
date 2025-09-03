import React, {useEffect, useState} from 'react';
import {
    Avatar,
    Badge,
    Button,
    Card,
    Center,
    Container,
    Grid,
    Group,
    Progress,
    ScrollArea,
    Stack,
    Text,
    TextInput,
    Title
} from '@mantine/core';
import {IconClock, IconSend, IconTrophy, IconUsers} from '@tabler/icons-react';

type GamePhase = 'DISCUSSING' | 'VOTING' | 'REVEALING' | 'FINISHED';

const LightGamePlayPage: React.FC = () => {
  const [gamePhase, setGamePhase] = useState<GamePhase>('DISCUSSING');
  const [timeRemaining, setTimeRemaining] = useState(120);
  const [message, setMessage] = useState("");
  const [selectedVote, setSelectedVote] = useState<string | null>(null);
  const [currentWord] = useState("강아지");
  const [isLiar] = useState(false);

  const mockPlayers = [
    { id: "1", nickname: "플레이어1", role: "CITIZEN" as const, isAlive: true, votesReceived: 0, hasVoted: false },
    { id: "2", nickname: "플레이어2", role: "LIAR" as const, isAlive: true, votesReceived: 2, hasVoted: true },
    { id: "3", nickname: "플레이어3", role: "CITIZEN" as const, isAlive: true, votesReceived: 1, hasVoted: true },
    { id: "4", nickname: "플레이어4", role: "CITIZEN" as const, isAlive: true, votesReceived: 0, hasVoted: false },
    { id: "5", nickname: "플레이어5", role: "CITIZEN" as const, isAlive: true, votesReceived: 1, hasVoted: true }
  ];

  const mockMessages = [
    { id: "1", player: "System", message: "게임이 시작되었습니다! 주제어는 '동물'입니다.", timestamp: "14:30", type: "SYSTEM" },
    { id: "2", player: "플레이어1", message: "이것은 털이 있고 네 발로 걸어다녀요", timestamp: "14:31", type: "NORMAL" },
    { id: "3", player: "플레이어2", message: "집에서 기를 수 있고 사람과 친해요", timestamp: "14:32", type: "NORMAL" }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          if (gamePhase === 'DISCUSSING') {
            setGamePhase('VOTING');
            return 60;
          } else if (gamePhase === 'VOTING') {
            setGamePhase('REVEALING');
            return 10;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gamePhase]);

  const handleSendMessage = () => {
    if (message.trim() && gamePhase === 'DISCUSSING') {
      setMessage("");
    }
  };

  const handleVote = (playerId: string) => {
    if (gamePhase === 'VOTING') {
      setSelectedVote(playerId);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getPhaseText = () => {
    switch (gamePhase) {
      case 'DISCUSSING': return '토론 시간';
      case 'VOTING': return '투표 시간';
      case 'REVEALING': return '결과 공개';
      default: return '대기 중';
    }
  };

  const getPhaseColor = () => {
    switch (gamePhase) {
      case 'DISCUSSING': return 'blue';
      case 'VOTING': return 'red';
      case 'REVEALING': return 'yellow';
      default: return 'gray';
    }
  };

  return (
    <Container size="xl" py="md">
      <Stack spacing="md">
        {/* 게임 헤더 */}
        <Center>
          <Stack spacing="md" align="center">
            <Group spacing="lg">
              <Badge size="lg" color={getPhaseColor()}>
                {getPhaseText()}
              </Badge>
              <Group spacing="xs">
                <IconClock size={20} />
                <Text size="xl" weight={700} style={{ fontFamily: 'monospace' }}>
                  {formatTime(timeRemaining)}
                </Text>
              </Group>
            </Group>

            {/* 주제어 표시 */}
            <Card withBorder padding="lg" style={{ textAlign: 'center', minWidth: 300 }}>
              <Text size="sm" color="dimmed" mb="xs">
                {isLiar ? "당신은 라이어입니다!" : "주제어"}
              </Text>
              <Title order={1} color={isLiar ? "red" : "blue"}>
                {isLiar ? "???" : currentWord}
              </Title>
              {isLiar && (
                <Text size="sm" color="red" mt="xs">
                  다른 플레이어들의 설명을 듣고 주제어를 추리하세요
                </Text>
              )}
            </Card>
          </Stack>
        </Center>

        <Grid>
          {/* 플레이어 카드들 */}
          <Grid.Col span={9}>
            <Grid>
              {mockPlayers.map((player) => (
                <Grid.Col key={player.id} span={2.4}>
                  <Card
                    withBorder
                    padding="sm"
                    style={{
                      cursor: gamePhase === 'VOTING' ? 'pointer' : 'default',
                      borderColor: selectedVote === player.id ? '#1976d2' : undefined,
                      borderWidth: selectedVote === player.id ? 2 : 1
                    }}
                    onClick={() => handleVote(player.id)}
                  >
                    <Stack spacing="xs" align="center">
                      <Avatar size="md">{player.nickname[0]}</Avatar>
                      <Text size="sm" weight={500} align="center">{player.nickname}</Text>

                      {gamePhase === 'REVEALING' && (
                        <Badge
                          color={player.role === 'LIAR' ? 'red' : 'blue'}
                          size="sm"
                        >
                          {player.role === 'LIAR' ? '라이어' : '시민'}
                        </Badge>
                      )}

                      {gamePhase === 'VOTING' && (
                        <div style={{ textAlign: 'center' }}>
                          <Text size="xs" color="dimmed">
                            투표 {player.votesReceived}표
                          </Text>
                          {player.hasVoted && (
                            <Text size="xs" color="green">✓ 투표완료</Text>
                          )}
                          {player.id !== "1" && (
                            <Button
                              size="xs"
                              fullWidth
                              mt="xs"
                              variant={selectedVote === player.id ? "filled" : "outline"}
                              color={selectedVote === player.id ? "red" : "blue"}
                            >
                              투표
                            </Button>
                          )}
                        </div>
                      )}
                    </Stack>
                  </Card>
                </Grid.Col>
              ))}
            </Grid>

            {/* 투표 확인 버튼 */}
            {gamePhase === 'VOTING' && selectedVote && (
              <Center mt="md">
                <Button size="lg" color="red">
                  {mockPlayers.find(p => p.id === selectedVote)?.nickname}에게 투표하기
                </Button>
              </Center>
            )}

            {/* 게임 진행 상황 */}
            <Card withBorder padding="lg" mt="md">
              <Group position="apart" mb="md">
                <Group>
                  <IconTrophy size={20} />
                  <Title order={4}>게임 진행 상황</Title>
                </Group>
              </Group>

              <Stack spacing="md">
                <div>
                  <Group position="apart" mb="xs">
                    <Text size="sm">시간 진행</Text>
                    <Text size="sm">{formatTime(timeRemaining)}</Text>
                  </Group>
                  <Progress value={(timeRemaining / 120) * 100} />
                </div>

                <Grid>
                  <Grid.Col span={6}>
                    <div style={{ textAlign: 'center' }}>
                      <Title order={2} color="blue">
                        {mockPlayers.filter(p => p.hasVoted).length}
                      </Title>
                      <Text size="sm" color="dimmed">투표 완료</Text>
                    </div>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <div style={{ textAlign: 'center' }}>
                      <Title order={2} color="green">
                        {mockPlayers.length}
                      </Title>
                      <Text size="sm" color="dimmed">전체 플레이어</Text>
                    </div>
                  </Grid.Col>
                </Grid>
              </Stack>
            </Card>
          </Grid.Col>

          {/* 채팅 */}
          <Grid.Col span={3}>
            <Card withBorder padding="lg" style={{ height: 600, display: 'flex', flexDirection: 'column' }}>
              <Group mb="md">
                <IconUsers size={20} />
                <Title order={4}>게임 채팅</Title>
              </Group>

              <ScrollArea style={{ flex: 1 }} mb="md">
                <Stack spacing="xs">
                  {mockMessages.map((msg) => (
                    <div
                      key={msg.id}
                      style={{
                        padding: 8,
                        borderRadius: 8,
                        backgroundColor: msg.type === 'SYSTEM'
                          ? '#f1f3f4'
                          : msg.player === "플레이어1"
                          ? '#1976d2'
                          : 'white',
                        color: msg.type === 'SYSTEM'
                          ? '#666'
                          : msg.player === "플레이어1"
                          ? 'white'
                          : 'black',
                        border: msg.player !== "플레이어1" && msg.type !== 'SYSTEM' ? '1px solid #e0e0e0' : 'none',
                        marginLeft: msg.player === "플레이어1" ? 'auto' : 0,
                        marginRight: msg.player === "플레이어1" ? 0 : 'auto',
                        maxWidth: msg.type === 'SYSTEM' ? '100%' : '80%',
                        textAlign: msg.type === 'SYSTEM' ? 'center' : 'left'
                      }}
                    >
                      {msg.type !== 'SYSTEM' && (
                        <Text size="xs" style={{ opacity: 0.7, marginBottom: 2 }}>
                          {msg.player} · {msg.timestamp}
                        </Text>
                      )}
                      <Text size="sm">{msg.message}</Text>
                    </div>
                  ))}
                </Stack>
              </ScrollArea>

              {gamePhase === 'DISCUSSING' ? (
                <Group spacing="xs">
                  <TextInput
                    placeholder="힌트를 말해주세요..."
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
              ) : (
                <div style={{ textAlign: 'center', padding: 16, backgroundColor: '#f5f5f5', borderRadius: 8 }}>
                  <Text size="sm" color="dimmed">
                    {gamePhase === 'VOTING' ? "투표 시간입니다! 라이어라고 생각하는 플레이어를 선택하세요." :
                     "결과를 확인하고 있습니다..."}
                  </Text>
                </div>
              )}
            </Card>
          </Grid.Col>
        </Grid>
      </Stack>
    </Container>
  );
};

export default LightGamePlayPage;
