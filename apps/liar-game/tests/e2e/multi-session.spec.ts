import {expect, test} from '@playwright/test';

interface TestUser {
  id: number;
  nickname: string;
  role: 'LIAR' | 'CITIZEN';
  word?: string;
}

const gameNumber = 999;

const players = [
  {
    id: 1,
    userId: 1,
    nickname: '호스트',
    isAlive: true,
    state: 'WAITING_FOR_HINT',
    hint: null,
    defense: null,
    votesReceived: 0,
    hasVoted: false
  },
  {
    id: 2,
    userId: 2,
    nickname: '시민A',
    isAlive: true,
    state: 'WAITING_FOR_HINT',
    hint: null,
    defense: null,
    votesReceived: 0,
    hasVoted: false
  },
  {
    id: 3,
    userId: 3,
    nickname: '시민B',
    isAlive: true,
    state: 'WAITING_FOR_HINT',
    hint: null,
    defense: null,
    votesReceived: 0,
    hasVoted: false
  }
] as const;

const makeGameState = (user: TestUser) => {
  const now = Date.now();
  return {
    gameNumber,
    gameName: '복구 시나리오 테스트',
    gameOwner: '호스트',
    gameParticipants: 3,
    gameCurrentRound: 1,
    gameTotalRounds: 3,
    gameLiarCount: 1,
    gameMode: 'LIARS_KNOW',
    gameState: 'IN_PROGRESS',
    players: players.map((player) => ({
      ...player,
      id: player.id,
      userId: player.userId,
      nickname: player.nickname,
      isAlive: true,
      state: player.state,
      hint: null,
      defense: null,
      votesReceived: 0,
      hasVoted: false
    })),
    currentPhase: 'SPEECH',
    yourRole: user.role,
    yourWord: user.role === 'LIAR' ? null : user.word ?? '사과',
    accusedPlayer: null,
    isChatAvailable: true,
    citizenSubject: '과일',
    liarSubject: null,
    subjects: ['과일', '야채'],
    turnOrder: ['1', '2', '3'],
    currentTurnIndex: 0,
    phaseEndTime: new Date(now + 45000).toISOString(),
    winner: null,
    reason: null,
    targetPoints: 10,
    scoreboard: players.map((player) => ({
      userId: player.userId,
      nickname: player.nickname,
      isAlive: true,
      score: player.userId === user.id ? 5 : 2,
    })),
    finalVotingRecord: null,
  };
};

const users: TestUser[] = [
  { id: 1, nickname: '호스트', role: 'LIAR' },
  { id: 2, nickname: '시민A', role: 'CITIZEN', word: '사과' },
  { id: 3, nickname: '시민B', role: 'CITIZEN', word: '사과' },
];

async function prepareContext(context: import('@playwright/test').BrowserContext, user: TestUser) {
  await context.addInitScript(({ snapshotUser }) => {
    const storageValue = JSON.stringify({
      state: {
        isAuthenticated: true,
        userId: snapshotUser.id,
        nickname: snapshotUser.nickname,
      },
      version: 0,
    });
    window.localStorage.setItem('auth-storage', storageValue);

    // Prevent real websocket connections during tests
    class MockWebSocket {
      url: string;
      readyState = 1;
      constructor(url: string) {
        this.url = url;
      }

      set onopen(_cb: ((evt: unknown) => void) | null) {}

      set onclose(_cb: ((evt: unknown) => void) | null) {}

      set onerror(_cb: ((evt: unknown) => void) | null) {}

      set onmessage(_cb: ((evt: unknown) => void) | null) {}

      send() {}

      close() {}

      addEventListener() {}

      removeEventListener() {}
    }
    // @ts-expect-error override for tests
    window.WebSocket = MockWebSocket;
  }, { snapshotUser: user });
}

async function mockGameState(page: import('@playwright/test').Page, user: TestUser) {
  await page.route('**/api/auth/refresh', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, userId: user.id, nickname: user.nickname })
      });
      return;
    }
    await route.continue();
  });

  await page.route(`**/api/v1/game/${gameNumber}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(makeGameState(user))
    });
  });

  // prevent websocket fallback requests from hanging tests
  await page.route('**/ws/**', (route) => route.abort());
  await page.route('**/sockjs-node/**', (route) => route.abort());
}

test.describe('Multi-session liar scenario', () => {
  test('liar and citizens view coordinated state', async ({browser}) => {
    const [liarUser, citizenA, citizenB] = users;

    const liarContext = await browser.newContext();
    const citizenAContext = await browser.newContext();
    const citizenBContext = await browser.newContext();

    await Promise.all([
      prepareContext(liarContext, liarUser),
      prepareContext(citizenAContext, citizenA),
      prepareContext(citizenBContext, citizenB),
    ]);

    const liarPage = await liarContext.newPage();
    const citizenAPage = await citizenAContext.newPage();
    const citizenBPage = await citizenBContext.newPage();

    await Promise.all([
      mockGameState(liarPage, liarUser),
      mockGameState(citizenAPage, citizenA),
      mockGameState(citizenBPage, citizenB),
    ]);

    await liarPage.goto(`/game/${gameNumber}`);
    await citizenAPage.goto(`/game/${gameNumber}`);
    await citizenBPage.goto(`/game/${gameNumber}`);

    await expect(liarPage.getByText('라이어 게임')).toBeVisible();
    await expect(liarPage.getByText('라이어는 단어를 추측하세요')).toBeVisible();
    await expect(liarPage.getByText('당신은 라이어입니다', { exact: false })).toBeVisible();

    await expect(citizenAPage.getByText('라이어 게임')).toBeVisible();
    await expect(citizenAPage.getByText('단어: 사과')).toBeVisible();
    await expect(citizenAPage.getByText('당신은 라이어입니다', { exact: false })).toHaveCount(0);

    await expect(citizenBPage.getByText('단어: 사과')).toBeVisible();
    await expect(citizenBPage.getByRole('heading', { name: '힌트 제공 단계' })).toBeVisible();

    await Promise.all([
      liarContext.close(),
      citizenAContext.close(),
      citizenBContext.close(),
    ]);
  });
});
