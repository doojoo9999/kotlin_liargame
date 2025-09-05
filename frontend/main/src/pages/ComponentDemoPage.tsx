import {useState} from 'react';
import {
    Badge,
    Button,
    Card,
    Container,
    Divider,
    Grid,
    Group,
    ScrollArea,
    Stack,
    Tabs,
    Text,
    Title
} from '@mantine/core';
import {useDisclosure} from '@mantine/hooks';
import {
    ActionButtons,
    ChatInput,
    ChatMessage,
    ConfirmModal,
    GameRoomCard,
    GameStatusPanel,
    PlayerCard,
    VotingPanel
} from '../shared/ui';
import {motion} from 'framer-motion';

export function ComponentDemoPage() {
  const [confirmOpened, { open: openConfirm, close: closeConfirm }] = useDisclosure(false);
  const [userVote, setUserVote] = useState<number | undefined>(undefined);

  // 목 데이터
  const mockGameRooms = [
    {
      gameNumber: 1,
      roomName: '재미있는 라이어 게임',
      currentPlayers: 3,
      maxPlayers: 6,
      isPrivate: false,
      gameState: 'WAITING' as const,
      hostName: '플레이어1'
    },
    {
      gameNumber: 2,
      roomName: '고수만 오세요 🔥',
      currentPlayers: 5,
      maxPlayers: 6,
      isPrivate: true,
      gameState: 'PLAYING' as const,
      hostName: '게임마스터'
    },
    {
      gameNumber: 3,
      roomName: '초보자 환영합니다',
      currentPlayers: 6,
      maxPlayers: 6,
      isPrivate: false,
      gameState: 'ENDED' as const,
      hostName: '친절한플레이어'
    }
  ];

  const mockPlayers = [
    { playerId: 1, nickname: '플레이어1', isHost: true, isCurrentTurn: false, isReady: true, isOnline: true, status: 'playing' as const },
    { playerId: 2, nickname: '게임마스터', isHost: false, isCurrentTurn: true, isReady: true, isOnline: true, status: 'playing' as const, votedBy: 2 },
    { playerId: 3, nickname: '라이어킬러', isHost: false, isCurrentTurn: false, isReady: true, isOnline: true, status: 'playing' as const },
    { playerId: 4, nickname: '신입플레이어', isHost: false, isCurrentTurn: false, isReady: false, isOnline: false, status: 'waiting' as const },
    { playerId: 5, nickname: '승리자', isHost: false, isCurrentTurn: false, isReady: true, isOnline: true, status: 'winner' as const }
  ];

  const mockChatMessages = [
    {
      id: '1',
      type: 'system' as const,
      content: '게임이 시작되었습니다! 주제는 "음식"입니다.',
      timestamp: new Date(Date.now() - 300000),
      round: 1
    },
    {
      id: '2',
      type: 'hint' as const,
      content: '이것은 달콤하고 차가운 것입니다.',
      senderName: '플레이어1',
      timestamp: new Date(Date.now() - 240000),
      round: 1
    },
    {
      id: '3',
      type: 'user' as const,
      content: '아이스크림인가요?',
      senderName: '게임마스터',
      timestamp: new Date(Date.now() - 180000),
      isOwn: false
    },
    {
      id: '4',
      type: 'user' as const,
      content: '저도 그렇게 생각해요!',
      senderName: '나',
      timestamp: new Date(Date.now() - 120000),
      isOwn: true
    },
    {
      id: '5',
      type: 'vote' as const,
      content: '플레이어1이 게임마스터를 라이어로 지목했습니다.',
      timestamp: new Date(Date.now() - 60000),
      metadata: { targetPlayer: '게임마스터', voteCount: 1 }
    },
    {
      id: '6',
      type: 'defense' as const,
      content: '저는 라이어가 아닙니다! 아이스크림에 대해 잘 알고 있어요.',
      senderName: '게임마스터',
      timestamp: new Date(Date.now() - 30000)
    }
  ];

  const mockVoteOptions = [
    { playerId: 1, playerName: '플레이어1', voteCount: 1, hasVoted: true },
    { playerId: 2, playerName: '게임마스터', voteCount: 3, hasVoted: false },
    { playerId: 3, playerName: '라이어킬러', voteCount: 0, hasVoted: false },
    { playerId: 4, playerName: '신입플레이어', voteCount: 1, hasVoted: false },
    { playerId: 5, playerName: '나', voteCount: 0, isCurrentUser: true, hasVoted: false }
  ];

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        <div>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <Group justify="space-between" align="flex-start" mb="lg">
              <div>
                <Title
                  order={1}
                  mb="xs"
                  style={{
                    background: 'linear-gradient(135deg, var(--game-text-primary) 0%, var(--game-neon-primary) 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontSize: '2.5rem',
                    fontWeight: 700,
                    letterSpacing: '-0.02em',
                  }}
                >
                  Liar Game
                </Title>
                <Text
                  size="lg"
                  style={{
                    color: 'var(--game-text-secondary)',
                    fontWeight: 400,
                    letterSpacing: '0.01em'
                  }}
                >
                  Design System & Component Library
                </Text>
              </div>

              <Badge
                size="lg"
                variant="light"
                style={{
                  background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.15) 0%, rgba(14, 165, 233, 0.05) 100%)',
                  border: '1px solid rgba(14, 165, 233, 0.3)',
                  color: 'var(--game-neon-primary)',
                  backdropFilter: 'blur(8px)',
                  padding: '8px 16px',
                  fontWeight: 600,
                  textTransform: 'none',
                }}
              >
                ✨ Interactive Demo
              </Badge>
            </Group>

            <Text
              style={{
                color: 'var(--game-text-muted)',
                fontSize: '16px',
                lineHeight: 1.6,
                maxWidth: '600px'
              }}
            >
              Experience our modern, dark-themed game interface inspired by Linear's design philosophy.
              Every component is crafted for seamless real-time gaming with glassmorphism effects and smooth animations.
            </Text>
          </motion.div>
        </div>

        <Tabs defaultValue="cards" keepMounted={false}>
          <Tabs.List>
            <Tabs.Tab value="cards">카드 컴포넌트</Tabs.Tab>
            <Tabs.Tab value="game">게임 상태</Tabs.Tab>
            <Tabs.Tab value="chat">채팅 시스템</Tabs.Tab>
            <Tabs.Tab value="voting">투표 시스템</Tabs.Tab>
            <Tabs.Tab value="actions">액션 버튼</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="cards" pt="md">
            <Stack gap="xl">
              <div>
                <Title order={2} mb="md">🏠 게임 방 카드</Title>
                <Grid>
                  {mockGameRooms.map((room) => (
                    <Grid.Col key={room.gameNumber} span={{ base: 12, sm: 6, md: 4 }}>
                      <GameRoomCard
                        {...room}
                        onJoin={() => console.log(`방 ${room.gameNumber} 참여`)}
                      />
                    </Grid.Col>
                  ))}
                </Grid>
              </div>

              <Divider />

              <div>
                <Title order={2} mb="md">👤 플레이어 카드</Title>
                <Text c="dimmed" mb="md">다양한 상태의 플레이어 카드들</Text>
                <Grid>
                  {mockPlayers.map((player) => (
                    <Grid.Col key={player.playerId} span={{ base: 12, sm: 6, md: 4 }}>
                      <PlayerCard
                        nickname={player.nickname}
                        isHost={player.isHost}
                        isCurrentTurn={player.isCurrentTurn}
                        isReady={player.isReady}
                        isOnline={player.isOnline}
                        status={player.status}
                        votedBy={player.votedBy}
                        onClick={() => console.log(`플레이어 ${player.nickname} 클릭`)}
                      />
                    </Grid.Col>
                  ))}
                </Grid>

                <Title order={3} mt="xl" mb="md">사이즈 변형</Title>
                <Group>
                  <PlayerCard
                    nickname="작은카드"
                    size="sm"
                    isReady={true}
                    onClick={() => {}}
                  />
                  <PlayerCard
                    nickname="중간카드"
                    size="md"
                    isCurrentTurn={true}
                    onClick={() => {}}
                  />
                  <PlayerCard
                    nickname="큰카드"
                    size="lg"
                    isHost={true}
                    onClick={() => {}}
                  />
                </Group>
              </div>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="game" pt="md">
            <Stack gap="xl">
              <div>
                <Title order={2} mb="md">🎯 게임 상태 패널</Title>
                <Grid>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <GameStatusPanel
                      gameNumber={12345}
                      phase="HINT_PHASE"
                      round={2}
                      currentPlayer="게임마스터"
                      totalPlayers={5}
                      category="음식"
                      timeLeft={45}
                      maxTime={60}
                      theme="detailed"
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <GameStatusPanel
                      gameNumber={12345}
                      phase="VOTING_PHASE"
                      round={2}
                      totalPlayers={5}
                      votingTarget="의심스러운플레이어"
                      timeLeft={8}
                      maxTime={30}
                      theme="compact"
                    />
                  </Grid.Col>
                </Grid>
              </div>

              <div>
                <Title order={3} mb="md">다양한 게임 페이즈</Title>
                <Grid>
                  <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                    <GameStatusPanel
                      gameNumber={1}
                      phase="WAITING"
                      round={0}
                      totalPlayers={3}
                      theme="compact"
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                    <GameStatusPanel
                      gameNumber={2}
                      phase="DEFENSE_PHASE"
                      round={1}
                      totalPlayers={5}
                      currentPlayer="피고인"
                      timeLeft={25}
                      maxTime={30}
                      theme="compact"
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                    <GameStatusPanel
                      gameNumber={3}
                      phase="ENDED"
                      round={3}
                      totalPlayers={5}
                      theme="compact"
                    />
                  </Grid.Col>
                </Grid>
              </div>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="chat" pt="md">
            <Stack gap="xl">
              <div>
                <Title order={2} mb="md">💬 채팅 시스템</Title>
                <Grid>
                  <Grid.Col span={{ base: 12, md: 8 }}>
                    <Card padding="md" withBorder style={{ height: 400 }}>
                      <Stack gap="xs" style={{ height: '100%' }}>
                        <Text fw={600} mb="sm">채팅 메시지들</Text>
                        <ScrollArea style={{ flex: 1 }}>
                          <Stack gap="xs">
                            {mockChatMessages.map((message) => (
                              <ChatMessage key={message.id} {...message} />
                            ))}
                          </Stack>
                        </ScrollArea>
                      </Stack>
                    </Card>
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 4 }}>
                    <Stack gap="md">
                      <div>
                        <Text fw={600} mb="sm">일반 채팅 입력</Text>
                        <ChatInput
                          onSend={(msg) => console.log('일반 메시지:', msg)}
                          placeholder="채팅을 입력하세요..."
                        />
                      </div>
                      <div>
                        <Text fw={600} mb="sm">힌트 입력 모드</Text>
                        <ChatInput
                          onSend={(msg) => console.log('힌트:', msg)}
                          gamePhase="HINT_PHASE"
                        />
                      </div>
                      <div>
                        <Text fw={600} mb="sm">변론 입력 모드</Text>
                        <ChatInput
                          onSend={(msg) => console.log('변론:', msg)}
                          gamePhase="DEFENSE_PHASE"
                        />
                      </div>
                    </Stack>
                  </Grid.Col>
                </Grid>
              </div>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="voting" pt="md">
            <Stack gap="xl">
              <div>
                <Title order={2} mb="md">🗳️ 투표 시스템</Title>
                <VotingPanel
                  title="라이어를 찾아주세요!"
                  description="가장 의심스러운 플레이어에게 투표하세요."
                  options={mockVoteOptions}
                  timeLeft={23}
                  maxTime={60}
                  onVote={(playerId) => {
                    setUserVote(playerId);
                    console.log('투표:', playerId);
                  }}
                  userVote={userVote}
                  type="liar-vote"
                  showResults={false}
                />
              </div>

              <div>
                <Title order={3} mb="md">투표 결과 표시</Title>
                <VotingPanel
                  title="최종 찬반 투표"
                  description="게임마스터를 탈락시키시겠습니까?"
                  options={mockVoteOptions}
                  onVote={() => {}}
                  type="final-vote"
                  showResults={true}
                  disabled={true}
                />
              </div>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="actions" pt="md">
            <Stack gap="xl">
              <div>
                <Title order={2} mb="md">🎬 액션 버튼</Title>
                <Card padding="lg" withBorder>
                  <Stack gap="xl">
                    <div>
                      <Text fw={600} mb="md">기본 액션 버튼들</Text>
                      <ActionButtons
                        primaryAction={{
                          label: '게임 시작',
                          onClick: () => console.log('게임 시작'),
                          color: 'green'
                        }}
                        secondaryAction={{
                          label: '준비 완료',
                          onClick: () => console.log('준비 완료')
                        }}
                        dangerAction={{
                          label: '방 나가기',
                          onClick: openConfirm
                        }}
                      />
                    </div>

                    <div>
                      <Text fw={600} mb="md">로딩 상태</Text>
                      <ActionButtons
                        primaryAction={{
                          label: '처리 중...',
                          onClick: () => {},
                          loading: true,
                          disabled: true
                        }}
                      />
                    </div>

                    <div>
                      <Text fw={600} mb="md">비활성화 상태</Text>
                      <ActionButtons
                        primaryAction={{
                          label: '투표하기',
                          onClick: () => {},
                          disabled: true
                        }}
                        secondaryAction={{
                          label: '패스',
                          onClick: () => {},
                          disabled: true
                        }}
                      />
                    </div>
                  </Stack>
                </Card>
              </div>

              <div>
                <Title order={3} mb="md">확인 모달</Title>
                <Group>
                  <Button onClick={openConfirm}>
                    위험한 액션 테스트
                  </Button>
                </Group>
              </div>
            </Stack>
          </Tabs.Panel>
        </Tabs>

        {/* 확인 모달 */}
        <ConfirmModal
          opened={confirmOpened}
          onClose={closeConfirm}
          onConfirm={() => {
            console.log('위험한 액션 실행됨');
            closeConfirm();
          }}
          title="정말로 나가시겠습니까?"
          message="게임을 나가면 다시 들어올 수 없습니다. 정말로 나가시겠습니까?"
          confirmLabel="나가기"
          cancelLabel="취소"
          type="danger"
        />
      </Stack>
    </Container>
  );
}
