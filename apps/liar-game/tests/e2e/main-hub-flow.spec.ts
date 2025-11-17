import {type BrowserContext, expect, type Locator, type Page, test} from '@playwright/test';
import type {GameStateResponse} from '../../src/types/backendTypes';
import {MockBackend, type StateKey} from './support/mockBackend';

const MAIN_PAGE_URL = process.env.MAIN_PAGE_URL ?? process.env.LIAR_GAME_BASE_URL ?? 'http://localhost:5173';
const GAME_NUMBER = 95432;
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

    const liarGamePage = await navigateToLiarGame(page, context);
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
