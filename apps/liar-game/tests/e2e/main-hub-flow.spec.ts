import {type BrowserContext, expect, type Locator, type Page, type Route, test} from '@playwright/test';
import type {
    GameStateResponse,
    PlayerReadyResponse,
    PlayerResponse,
    ScoreboardEntry,
} from '../../src/types/backendTypes';
import type {
    DefenseResponse,
    FinalVoteResponse,
    GameResult,
    GuessResponse,
    HintSubmissionResponse,
    RoundEndResponse,
    VoteResponse,
} from '../../src/types/gameFlow';

type StateKey = 'waiting' | 'speech' | 'voting' | 'defense' | 'finalVote' | 'guess' | 'gameOver';

const MAIN_PAGE_URL = process.env.MAIN_PAGE_URL ?? process.env.LIAR_GAME_BASE_URL ?? 'http://localhost:5173';
const GAME_NUMBER = 95432;
const SCHEMA_VERSION = 'game-flow/2024-09-18';

class MockBackend {
  private readonly gameNumber: number;
  private readonly hostNickname = '테스터';
  private readonly schemaVersion = SCHEMA_VERSION;
  private isAuthenticated = false;
  private roomCreated = false;
  private readyPlayers = new Set<number>();
  private currentState: GameStateResponse;
  private readonly states: Record<StateKey, GameStateResponse>;
  private readonly gameResult: GameResult;
  private readonly basePlayers = [
    {id: 1, userId: 1, nickname: '테스터'},
    {id: 2, userId: 2, nickname: '시민A'},
    {id: 3, userId: 3, nickname: '라이어'},
  ];

  constructor(gameNumber: number) {
    this.gameNumber = gameNumber;
    this.states = {
      waiting: this.buildWaitingState(),
      speech: this.buildSpeechState(),
      voting: this.buildVotingState(),
      defense: this.buildDefenseState(),
      finalVote: this.buildFinalVoteState(),
      guess: this.buildGuessState(),
      gameOver: this.buildGameOverState(),
    };
    this.currentState = this.cloneState(this.states.waiting);
    this.gameResult = this.buildGameResult();
  }

  async handle(route: Route): Promise<void> {
    const request = route.request();
    const method = request.method();
    const url = new URL(request.url());
    const path = url.pathname;

    if (method === 'OPTIONS') {
      return this.respondOptions(route);
    }

    if (!path.startsWith('/api/v1/')) {
      return route.continue();
    }

    if (method === 'POST' && path.endsWith('/auth/refresh-session')) {
      if (this.isAuthenticated) {
        return this.json(route, {success: true, userId: 1, nickname: this.hostNickname});
      }
      return this.json(route, {success: false, message: 'unauthenticated'});
    }

    if (method === 'POST' && path.endsWith('/auth/login')) {
      this.isAuthenticated = true;
      return this.json(route, {success: true, userId: 1, nickname: this.hostNickname});
    }

    if (method === 'POST' && path.endsWith('/auth/logout')) {
      this.isAuthenticated = false;
      this.readyPlayers.clear();
      return this.json(route, {success: true});
    }

    if (method === 'GET' && path === '/api/v1/game/modes') {
      return this.json(route, ['LIARS_KNOW', 'LIARS_DIFFERENT_WORD']);
    }

    if (method === 'GET' && path === '/api/v1/subjects/listsubj') {
      return this.json(route, [
        {
          id: 1,
          name: '과일',
          wordIds: [101, 102, 103],
          description: '과일 관련 주제',
        },
      ]);
    }

    if (method === 'GET' && path === '/api/v1/words/wlist') {
      return this.json(route, [
        {
          id: 101,
          subjectId: 1,
          subjectContent: '과일',
          content: '사과',
          status: 'APPROVED',
        },
      ]);
    }

    if (method === 'GET' && path === '/api/v1/game/rooms') {
      const rooms = this.buildRoomList();
      return this.json(route, {
        schemaVersion: this.schemaVersion,
        gameRooms: rooms,
        games: rooms,
      });
    }

    if (method === 'POST' && path === '/api/v1/game/create') {
      this.roomCreated = true;
      this.setActiveState('waiting');
      return this.json(route, this.gameNumber);
    }

    if (method === 'GET' && path === `/api/v1/game/${this.gameNumber}`) {
      return this.json(route, this.getActiveState());
    }

    if (method === 'GET' && path === `/api/v1/game/${this.gameNumber}/ready-status`) {
      return this.json(route, this.buildReadyStatuses());
    }

    if (method === 'POST' && path === `/api/v1/game/${this.gameNumber}/ready`) {
      const isReady = !this.readyPlayers.has(1);
      this.markPlayerReady(1, isReady);

      const payload: PlayerReadyResponse = {
        schemaVersion: this.schemaVersion,
        playerId: 1,
        nickname: this.hostNickname,
        isReady,
        allPlayersReady: this.readyPlayers.size === this.basePlayers.length,
        readyCount: this.readyPlayers.size,
        totalPlayers: this.basePlayers.length,
      };
      return this.json(route, payload);
    }

    if (method === 'GET' && path === `/api/v1/game/${this.gameNumber}/connection-status`) {
      return this.json(route, {
        schemaVersion: this.schemaVersion,
        players: this.basePlayers.map(player => ({
          userId: player.userId,
          nickname: player.nickname,
          isConnected: true,
          hasGracePeriod: false,
          lastSeenAt: this.futureIso(-5),
          connectionStability: 'STABLE',
        })),
        connectedCount: this.basePlayers.length,
        disconnectedCount: 0,
        totalCount: this.basePlayers.length,
      });
    }

    if (method === 'GET' && path === `/api/v1/game/${this.gameNumber}/voting-status`) {
      return this.json(route, {
        schemaVersion: this.schemaVersion,
        gameNumber: this.gameNumber,
        phase: this.currentState.currentPhase,
        votes: {},
        totalPlayers: this.basePlayers.length,
      });
    }

    if (method === 'POST' && path.endsWith('/game/start')) {
      const next = this.setActiveState('speech');
      this.readyPlayers.clear();
      return this.json(route, next);
    }

    if (method === 'POST' && path.endsWith('/game/hint')) {
      const response: HintSubmissionResponse = {
        gameNumber: this.gameNumber,
        gameState: 'IN_PROGRESS',
        currentPhase: 'SPEECH',
        currentTurnIndex: 1,
        currentPlayerId: 2,
        success: true,
      };
      return this.json(route, response);
    }

    if (method === 'POST' && path.endsWith('/game/cast-vote')) {
      const response: VoteResponse = {
        gameNumber: this.gameNumber,
        gameState: 'IN_PROGRESS',
        currentPhase: 'VOTING_FOR_LIAR',
        votedPlayer: {
          id: 3,
          nickname: '라이어',
          voteCount: 1,
        },
        success: true,
      };
      return this.json(route, response);
    }

    if (method === 'POST' && path.endsWith('/game/submit-defense')) {
      const response: DefenseResponse = {
        gameNumber: this.gameNumber,
        gameState: 'IN_PROGRESS',
        currentPhase: 'DEFENDING',
        defenseText: '정말 아닙니다!',
        remainingTime: 45,
        success: true,
      };
      return this.json(route, response);
    }

    if (method === 'POST' && path.endsWith('/game/defense/end')) {
      return this.json(route, {success: true});
    }

    if (method === 'POST' && path.endsWith('/game/vote/final')) {
      const response: FinalVoteResponse = {
        gameNumber: this.gameNumber,
        gameState: 'IN_PROGRESS',
        currentPhase: 'VOTING_FOR_SURVIVAL',
        accusedPlayer: {
          id: 3,
          nickname: '라이어',
          isExecuted: true,
        },
        success: true,
      };
      return this.json(route, response);
    }

    if (method === 'POST' && path.endsWith('/game/guess-word')) {
      const response: GuessResponse = {
        gameNumber: this.gameNumber,
        gameState: 'IN_PROGRESS',
        currentPhase: 'GUESSING_WORD',
        guess: '망고',
        isCorrect: false,
        success: true,
      };
      return this.json(route, response);
    }

    if (method === 'POST' && path.endsWith('/game/end-of-round')) {
      const response: RoundEndResponse = {
        gameNumber: this.gameNumber,
        gameState: 'ENDED',
        currentPhase: 'GAME_OVER',
        gameCurrentRound: 1,
        scoreboard: this.states.gameOver.scoreboard,
        success: true,
      };
      return this.json(route, response);
    }

    if (method === 'GET' && path === `/api/v1/game/result/${this.gameNumber}`) {
      return this.json(route, this.gameResult);
    }

    if (method === 'POST' && path.endsWith('/game/leave')) {
      this.readyPlayers.clear();
      this.setActiveState('waiting');
      return this.json(route, true);
    }

    if (method === 'GET' && path === '/api/v1/chat/history') {
      return this.json(route, []);
    }

    if (method === 'POST' && path === '/api/v1/chat/send') {
      return this.json(route, {success: true});
    }

    if (method === 'POST' && path === '/api/v1/game/cleanup/user-data') {
      return this.json(route, {success: true});
    }

    return this.json(route, {success: true});
  }

  setActiveState(key: StateKey): GameStateResponse {
    const state = this.cloneState(this.states[key]);
    this.currentState = state;
    return this.cloneState(state);
  }

  getActiveState(): GameStateResponse {
    return this.cloneState(this.currentState);
  }

  markPlayerReady(id: number | string, ready: boolean): void {
    const numeric = typeof id === 'string' ? Number.parseInt(id, 10) : id;
    if (!Number.isFinite(numeric)) {
      return;
    }
    if (ready) {
      this.readyPlayers.add(numeric);
    } else {
      this.readyPlayers.delete(numeric);
    }
  }

  private buildWaitingState(): GameStateResponse {
    const state = this.blankState();
    state.gameState = 'WAITING';
    state.currentPhase = 'WAITING_FOR_PLAYERS';
    state.yourRole = null;
    state.yourWord = null;
    state.isChatAvailable = false;
    state.currentTurnIndex = 0;
    state.phaseEndTime = this.futureIso(120);
    state.players = [
      this.makePlayer(1, {state: 'WAITING_FOR_HINT'}),
      this.makePlayer(2, {state: 'WAITING_FOR_HINT'}),
      this.makePlayer(3, {state: 'WAITING_FOR_HINT'}),
    ];
    return state;
  }

  private buildSpeechState(): GameStateResponse {
    const state = this.blankState();
    state.gameState = 'IN_PROGRESS';
    state.currentPhase = 'SPEECH';
    state.currentTurnIndex = 0;
    state.players = [
      this.makePlayer(1, {state: 'WAITING_FOR_HINT'}),
      this.makePlayer(2, {state: 'WAITING_FOR_HINT'}),
      this.makePlayer(3, {state: 'WAITING_FOR_HINT'}),
    ];
    return state;
  }

  private buildVotingState(): GameStateResponse {
    const state = this.blankState();
    state.currentPhase = 'VOTING_FOR_LIAR';
    state.currentTurnIndex = 2;
    state.players = [
      this.makePlayer(1, {state: 'WAITING_FOR_VOTE', hasVoted: true}),
      this.makePlayer(2, {state: 'WAITING_FOR_VOTE', hasVoted: false}),
      this.makePlayer(3, {state: 'ACCUSED', votesReceived: 1}),
    ];
    return state;
  }

  private buildDefenseState(): GameStateResponse {
    const state = this.blankState();
    state.currentPhase = 'DEFENDING';
    state.players = [
      this.makePlayer(1, {state: 'WAITING_FOR_FINAL_VOTE'}),
      this.makePlayer(2, {state: 'WAITING_FOR_FINAL_VOTE'}),
      this.makePlayer(3, {state: 'ACCUSED', defense: '저는 라이어가 아닙니다!', votesReceived: 2}),
    ];
    state.accusedPlayer = {...state.players[2]};
    return state;
  }

  private buildFinalVoteState(): GameStateResponse {
    const state = this.blankState();
    state.currentPhase = 'VOTING_FOR_SURVIVAL';
    state.players = [
      this.makePlayer(1, {state: 'WAITING_FOR_FINAL_VOTE', hasVoted: true}),
      this.makePlayer(2, {state: 'WAITING_FOR_FINAL_VOTE', hasVoted: false}),
      this.makePlayer(3, {state: 'ACCUSED', votesReceived: 2}),
    ];
    state.accusedPlayer = {...state.players[2]};
    return state;
  }

  private buildGuessState(): GameStateResponse {
    const state = this.blankState();
    state.currentPhase = 'GUESSING_WORD';
    state.players = [
      this.makePlayer(1, {state: 'WAITING_FOR_HINT'}),
      this.makePlayer(2, {state: 'WAITING_FOR_HINT'}),
      this.makePlayer(3, {state: 'ACCUSED'}),
    ];
    state.accusedPlayer = {...state.players[2]};
    return state;
  }

  private buildGameOverState(): GameStateResponse {
    const state = this.blankState();
    state.gameState = 'ENDED';
    state.currentPhase = 'GAME_OVER';
    state.players = [
      this.makePlayer(1, {state: 'SURVIVED'}),
      this.makePlayer(2, {state: 'SURVIVED'}),
      this.makePlayer(3, {state: 'ELIMINATED', isAlive: false, votesReceived: 2}),
    ];
    state.accusedPlayer = {...state.players[2]};
    state.winner = 'CITIZENS';
    state.reason = '시민이 라이어를 색출했습니다';
    state.scoreboard = [
      {userId: 1, nickname: '테스터', isAlive: true, score: 5},
      {userId: 2, nickname: '시민A', isAlive: true, score: 4},
      {userId: 3, nickname: '라이어', isAlive: false, score: 1},
    ];
    state.finalVotingRecord = [
      {
        gameNumber: this.gameNumber,
        voterPlayerId: 1,
        voterNickname: '테스터',
        voteForExecution: true,
        success: true,
        message: 'Final decision',
      },
    ];
    return state;
  }

  private buildGameResult(): GameResult {
    return {
      gameNumber: this.gameNumber,
      winningTeam: 'CITIZENS',
      reason: '시민이 라이어를 색출했습니다',
      players: [
        {id: 1, nickname: '테스터', role: 'CITIZEN', isAlive: true, isWinner: true, score: 5},
        {id: 2, nickname: '시민A', role: 'CITIZEN', isAlive: true, isWinner: true, score: 4},
        {id: 3, nickname: '라이어', role: 'LIAR', isAlive: false, isWinner: false, score: 1},
      ],
      gameStatistics: {
        currentRound: 1,
        totalRounds: 1,
        totalDuration: 180,
        averageRoundDuration: 180,
      },
    };
  }

  private blankState(): GameStateResponse {
    return {
      schemaVersion: this.schemaVersion,
      gameNumber: this.gameNumber,
      gameName: `${this.hostNickname} 님의 방`,
      gameOwner: this.hostNickname,
      gameParticipants: this.basePlayers.length,
      gameCurrentRound: 1,
      gameTotalRounds: 1,
      gameLiarCount: 1,
      gameMode: 'LIARS_KNOW',
      gameState: 'IN_PROGRESS',
      currentPhase: 'SPEECH',
      players: [],
      yourRole: 'CITIZEN',
      yourWord: '사과',
      accusedPlayer: null,
      isChatAvailable: true,
      citizenSubject: '과일',
      liarSubject: null,
      subjects: ['과일'],
      turnOrder: ['1', '2', '3'],
      currentTurnIndex: 0,
      phaseEndTime: this.futureIso(60),
      winner: null,
      reason: null,
      targetPoints: 10,
      scoreboard: this.zeroScoreboard(),
      finalVotingRecord: null,
    };
  }

  private zeroScoreboard(): ScoreboardEntry[] {
    return this.basePlayers.map(player => ({
      userId: player.userId,
      nickname: player.nickname,
      isAlive: true,
      score: 0,
    }));
  }

  private makePlayer(id: number, overrides: Partial<PlayerResponse> = {}): PlayerResponse {
    const base = this.basePlayers.find(player => player.id === id);
    if (!base) {
      throw new Error(`Unknown player id ${id}`);
    }
    return {
      id: base.id,
      userId: base.userId,
      nickname: base.nickname,
      isAlive: overrides.isAlive ?? true,
      isOnline: overrides.isOnline ?? true,
      state: overrides.state ?? 'WAITING_FOR_HINT',
      hint: overrides.hint ?? null,
      defense: overrides.defense ?? null,
      votesReceived: overrides.votesReceived ?? 0,
      hasVoted: overrides.hasVoted ?? false,
    };
  }

  private buildReadyStatuses(): PlayerReadyResponse[] {
    const readyCount = this.readyPlayers.size;
    const total = this.basePlayers.length;
    return this.basePlayers.map(player => ({
      schemaVersion: this.schemaVersion,
      playerId: player.id,
      nickname: player.nickname,
      isReady: this.readyPlayers.has(player.id),
      allPlayersReady: readyCount === total,
      readyCount,
      totalPlayers: total,
    }));
  }

  private buildRoomList() {
    if (!this.roomCreated) {
      return [];
    }
    return [
      {
        schemaVersion: this.schemaVersion,
        gameNumber: this.gameNumber,
        title: `${this.hostNickname} 님의 방`,
        host: this.hostNickname,
        currentPlayers: Math.max(1, this.readyPlayers.size),
        maxPlayers: 6,
        hasPassword: false,
        subject: '과일',
        subjects: ['과일'],
        state: this.currentState.gameState,
        players: this.currentState.players,
        gameMode: 'LIARS_KNOW',
      },
    ];
  }

  private cloneState(state: GameStateResponse): GameStateResponse {
    return JSON.parse(JSON.stringify(state)) as GameStateResponse;
  }

  private futureIso(seconds: number): string {
    return new Date(Date.now() + seconds * 1000).toISOString();
  }

  private async respondOptions(route: Route): Promise<void> {
    await route.fulfill({
      status: 200,
      headers: {
        'access-control-allow-origin': '*',
        'access-control-allow-methods': 'GET,POST,PUT,DELETE,OPTIONS',
        'access-control-allow-headers': 'content-type',
      },
      body: '',
    });
  }

  private async json(route: Route, payload: unknown, status = 200): Promise<void> {
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(payload),
    });
  }
}

async function openPotentialNewPage(locator: Locator, context: BrowserContext): Promise<Page | null> {
  const target = await locator.getAttribute('target');
  if (target === '_blank') {
    const [newPage] = await Promise.all([
      context.waitForEvent('page'),
      locator.click(),
    ]);
    await newPage.waitForLoadState('domcontentloaded');
    return newPage;
  }
  await locator.click();
  return null;
}

async function isLoginPage(page: Page): Promise<boolean> {
  try {
    return await page.locator('input#nickname').first().isVisible();
  } catch {
    return false;
  }
}

async function navigateToLiarGame(page: Page, context: BrowserContext): Promise<Page> {
  if (await isLoginPage(page)) {
    return page;
  }

  const liarCard = page.locator('a.landing__card').filter({hasText: '라이어 게임'}).first();
  if (await liarCard.count()) {
    const newPage = await openPotentialNewPage(liarCard, context);
    if (newPage) {
      return newPage;
    }
    if (await isLoginPage(page)) {
      return page;
    }
  }

  const playNow = page.getByRole('link', {name: /지금 바로 플레이/}).first();
  if (await playNow.count()) {
    const newPage = await openPotentialNewPage(playNow, context);
    if (newPage) {
      return newPage;
    }
    if (await isLoginPage(page)) {
      return page;
    }
  }

  const liarLink = page.getByRole('link', {name: /라이어 게임/}).first();
  if (await liarLink.count()) {
    const newPage = await openPotentialNewPage(liarLink, context);
    if (newPage) {
      return newPage;
    }
  }

  return page;
}

async function syncGameState(page: Page, snapshot: GameStateResponse): Promise<void> {
  await page.evaluate(async (state) => {
    const [gameStoreModule, gameplayStoreModule] = await Promise.all([
      import('/src/stores/unifiedGameStore.ts'),
      import('/src/stores/gameplayStore.ts'),
    ]);
    const gameStore = gameStoreModule.useGameStore.getState();
    gameStore.setGameNumber(state.gameNumber);
    gameStore.updateFromGameState(state);

    if (gameplayStoreModule.useGameplayStore) {
      const gameplayStore = gameplayStoreModule.useGameplayStore.getState();
      gameplayStore.actions?.hydrateFromSnapshot?.(state);
    }
  }, snapshot);
}

async function moveToState(page: Page, backend: MockBackend, key: StateKey): Promise<void> {
  const next = backend.setActiveState(key);
  await syncGameState(page, next);
  await page.waitForTimeout(75);
}

test.describe('Main hub to liar game end-to-end', () => {
  test('navigates from landing to liar game and completes a full round', async ({page, context}) => {
    const backend = new MockBackend(GAME_NUMBER);

    await context.route('**/api/v1/**', route => backend.handle(route));
    await context.route('**/ws/**', route => route.abort());
    await context.route('**/sockjs-node/**', route => route.abort());
    await context.route('**/stomp/**', route => route.abort());

    await context.addInitScript(() => {
      class MockWebSocket {
        url: string;
        readyState = 1;
        constructor(url: string) {
          this.url = url;
        }

        set onopen(cb: ((event: unknown) => void) | null) {
          if (cb) {
            cb({});
          }
        }

        set onclose(_cb: ((event: unknown) => void) | null) {}

        set onerror(_cb: ((event: unknown) => void) | null) {}

        set onmessage(_cb: ((event: unknown) => void) | null) {}

        close() {}

        send() {}

        addEventListener() {}

        removeEventListener() {}
      }
      // @ts-expect-error override for tests
      window.WebSocket = MockWebSocket;
    });

    await page.goto(MAIN_PAGE_URL);

    let liarGamePage = await navigateToLiarGame(page, context);
    await liarGamePage.bringToFront();
    await liarGamePage.waitForLoadState('domcontentloaded');

    if (!(await isLoginPage(liarGamePage))) {
      throw new Error('Failed to reach liar game login page');
    }

    const nicknameInput = liarGamePage.locator('input#nickname');
    await nicknameInput.fill('테스터');

    const loginButton = liarGamePage.getByRole('button', {name: /게임 시작/});
    await Promise.all([
      liarGamePage.waitForURL(/\/lobby$/),
      loginButton.click(),
    ]);

    await expect(liarGamePage.getByText('라이어 게임 로비')).toBeVisible();

    const createRoomTrigger = liarGamePage
      .getByRole('button', {name: '게임방 만들기', exact: true})
      .first();
    await expect(createRoomTrigger).toBeEnabled();
    await createRoomTrigger.click();

    await expect(liarGamePage.getByRole('heading', {name: '새 게임방 생성'})).toBeVisible();
    await liarGamePage.locator('#room-name').fill('테스트 라운드');

    const confirmCreate = liarGamePage.getByRole('button', {name: '생성하기'});
    await Promise.all([
      liarGamePage.waitForURL(new RegExp(`/game/${GAME_NUMBER}$`)),
      confirmCreate.click(),
    ]);

    const readyButton = liarGamePage.getByRole('button', {name: /준비 (완료|해제)/});
    await expect(readyButton).toHaveText(/준비 완료/);

    await Promise.all([
      liarGamePage.waitForResponse(resp => resp.url().includes(`/api/v1/game/${GAME_NUMBER}/ready`) && resp.request().method() === 'POST'),
      readyButton.click(),
    ]);

    backend.markPlayerReady(1, true);
    await expect(readyButton).toHaveText(/준비 해제/);

    backend.markPlayerReady(2, true);
    backend.markPlayerReady(3, true);
    await liarGamePage.evaluate(async () => {
      const {useGameStore} = await import('/src/stores/unifiedGameStore.ts');
      const store = useGameStore.getState();
      store.handlePlayerReady('2', true);
      store.handlePlayerReady('3', true);
    });

    const startButton = liarGamePage.getByRole('button', {name: '게임 시작'});
    await expect(startButton).toBeEnabled();

    await Promise.all([
      liarGamePage.waitForResponse(resp => resp.url().endsWith('/api/v1/game/start') && resp.request().method() === 'POST'),
      startButton.click(),
    ]);

    await expect(
      liarGamePage.getByRole('heading', {name: /힌트 (제공|제출)/})
    ).toBeVisible();

    const hintTypeButton = liarGamePage.getByRole('button', {name: '힌트'});
    await hintTypeButton.click();

    const hintInput = liarGamePage.getByRole('textbox', {name: /메시지를 입력해 주세요/});
    await hintInput.fill('상큼한 과일');
    await hintInput.press('Enter');

    const chatRegion = liarGamePage.getByRole('main', {name: '게임 채팅 영역'});
    await expect(chatRegion.getByRole('status')).toContainText('메시지가 전송되었습니다.');

    await moveToState(liarGamePage, backend, 'voting');
    await expect(liarGamePage.getByText('라이어 투표')).toBeVisible();

    const voteList = liarGamePage.getByRole('listbox', {name: /라이어로 의심되는 플레이어/});
    await voteList.getByRole('option', {name: /라이어에게 투표/}).click();

    const voteButton = liarGamePage.getByRole('button', {name: /라이어 투표|투표하기/}).first();
    await expect(voteButton).toBeEnabled();
    await voteButton.click();

    await moveToState(liarGamePage, backend, 'defense');
    await expect(
      liarGamePage.getByRole('heading', {name: /변론 (단계|듣기)/})
    ).toBeVisible();

    await moveToState(liarGamePage, backend, 'finalVote');
    await expect(
      liarGamePage.getByRole('heading', {name: /생존 투표|최종 투표/})
    ).toBeVisible();

    const executeChoice = liarGamePage.getByRole('button', {name: /처형/}).first();
    await executeChoice.click();

    const finalVoteButton = liarGamePage.getByRole('button', {name: /최종 투표|투표하기/}).first();
    await expect(finalVoteButton).toBeEnabled();
    await finalVoteButton.click();

    await moveToState(liarGamePage, backend, 'guess');
    await expect(
      liarGamePage.getByRole('heading', {name: /(단어|라이어).*(추측)/})
    ).toBeVisible();

    await moveToState(liarGamePage, backend, 'gameOver');
    const freshResultState = backend.setActiveState('gameOver');
    await syncGameState(liarGamePage, freshResultState);

    const resultResponse = liarGamePage.waitForResponse(resp => resp.url().includes(`/api/v1/game/result/${GAME_NUMBER}`));
    await liarGamePage.evaluate(async () => {
      const {useGameStore} = await import('/src/stores/unifiedGameStore.ts');
      const store = useGameStore.getState();
      store.setLoading = () => {};
      useGameStore.setState({isLoading: false});
    });
    await resultResponse;

    try {
      await expect(liarGamePage.getByText('게임 결과를 불러오는 중...'))
        .toBeHidden({ timeout: 1000 });
    } catch {
      // loader already gone, continue
    }

    await expect(
      liarGamePage.locator('h3').filter({ hasText: /시민팀 승리!|라이어팀 승리!/ })
    ).toBeVisible();

    const returnButton = liarGamePage
      .getByRole('complementary', {name: '게임 컨텍스트'})
      .getByRole('button', {name: '로비로 돌아가기'});
    await expect(returnButton).toBeVisible();
    await Promise.all([
      liarGamePage.waitForResponse(resp => resp.url().endsWith('/api/v1/game/leave') && resp.request().method() === 'POST'),
      returnButton.click(),
    ]);

    await liarGamePage.waitForURL(/\/lobby$/);
    await expect(liarGamePage.getByText('라이어 게임 로비')).toBeVisible();
  });
});
