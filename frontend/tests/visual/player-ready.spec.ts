import {expect, request, test} from '@playwright/test';

const FRONTEND_ORIGIN = 'http://218.150.3.77:5173';
const BACKEND_ORIGIN = 'http://218.150.3.77:20021';

async function loginAndGetState(nickname: string) {
  const apiContext = await request.newContext({ baseURL: BACKEND_ORIGIN });
  const response = await apiContext.post('/api/v1/auth/login', {
    data: { nickname, password: '' },
  });
  if (!response.ok()) {
    throw new Error(`Login failed for ${nickname}: ${response.status()} ${response.statusText()}`);
  }
  const storageState = await apiContext.storageState();
  return { apiContext, storageState };
}

test('players can ready up and host sees everyone ready', async ({ browser }) => {
  const host = await loginAndGetState('테스트호스트');
  const player2 = await loginAndGetState('테스트플레이어2');
  const player3 = await loginAndGetState('테스트플레이어3');

  const createGameResponse = await host.apiContext.post('/api/v1/game/create', {
    data: {
      gameName: '플레이어 준비 테스트',
      gameParticipants: 5,
      gameTotalRounds: 3,
      gameLiarCount: 1,
      gameMode: 'LIARS_KNOW',
      useRandomSubjects: true,
      randomSubjectCount: 1,
      targetPoints: 10,
    },
  });

  expect(createGameResponse.ok()).toBeTruthy();
  const gameNumber = await createGameResponse.json();

  await player2.apiContext.post('/api/v1/game/join', {
    data: { gameNumber, nickname: '테스트플레이어2' },
  });
  await player3.apiContext.post('/api/v1/game/join', {
    data: { gameNumber, nickname: '테스트플레이어3' },
  });

  const hostContext = await browser.newContext({ storageState: host.storageState });
  const hostPage = await hostContext.newPage();
  await hostPage.goto(`${FRONTEND_ORIGIN}/game/${gameNumber}`);

  await expect(hostPage.getByText('0/3 준비 완료')).toBeVisible({ timeout: 15000 });

  const player2Context = await browser.newContext({ storageState: player2.storageState });
  const player2Page = await player2Context.newPage();
  await player2Page.goto(`${FRONTEND_ORIGIN}/game/${gameNumber}`);

  const player3Context = await browser.newContext({ storageState: player3.storageState });
  const player3Page = await player3Context.newPage();
  await player3Page.goto(`${FRONTEND_ORIGIN}/game/${gameNumber}`);

  await player2Page.getByRole('button', { name: '준비 완료' }).click();
  await expect(hostPage.getByText('1/3 준비 완료')).toBeVisible({ timeout: 10000 });

  await player3Page.getByRole('button', { name: '준비 완료' }).click();
  await expect(hostPage.getByText('2/3 준비 완료')).toBeVisible({ timeout: 10000 });

  await hostPage.getByRole('button', { name: '준비 완료' }).click();
  await expect(hostPage.getByText('3/3 준비 완료')).toBeVisible({ timeout: 10000 });
  await expect(hostPage.getByRole('button', { name: '게임 시작' })).toBeEnabled();

  await hostContext.close();
  await player2Context.close();
  await player3Context.close();
  await host.apiContext.dispose();
  await player2.apiContext.dispose();
  await player3.apiContext.dispose();
});
