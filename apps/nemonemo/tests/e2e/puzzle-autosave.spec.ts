import { test, expect } from '@playwright/test';

const MOCK_BASE = '/__mock__';

const registerRoute = async (page, path, handler) => {
  await page.route(`${MOCK_BASE}${path}`, handler);
};

const puzzleDetailResponse = {
  id: 'fixture-puzzle',
  title: 'E2E Puzzle',
  description: 'Playwright e2e harness',
  width: 5,
  height: 5,
  status: 'APPROVED',
  author: null,
  contentStyle: 'GENERIC_PIXEL',
  textLikenessScore: 0,
  difficultyScore: 3.2,
  difficultyCategory: 'MEDIUM',
  hints: { rows: Array(5).fill([1]), cols: Array(5).fill([1]) },
  statistics: { viewCount: 0, playCount: 0, clearCount: 0, averageTimeMs: 0, averageRating: 0 },
  modes: ['NORMAL']
};

const playStartResponse = {
  playId: 'play-e2e',
  stateToken: 'token',
  expiresAt: new Date(Date.now() + 3_600_000).toISOString()
};

const setupMocks = async (page) => {
  await registerRoute(page, '/puzzles/fixture-puzzle', async (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({ json: puzzleDetailResponse });
    }
    return route.continue();
  });

  await registerRoute(page, '/puzzles/fixture-puzzle/plays', async (route) => {
    return route.fulfill({ json: playStartResponse });
  });
};

const trackSnapshotCalls = async (page) => {
  let calls = 0;
  await registerRoute(page, '/plays/play-e2e/snapshot', async (route) => {
    calls += 1;
    return route.fulfill({ status: 204, body: '' });
  });
  return () => calls;
};

const goToPuzzle = async (page) => {
  await page.goto('/puzzles/fixture-puzzle');
  await expect(page.getByRole('heading', { name: puzzleDetailResponse.title })).toBeVisible();
  await expect(page.getByTestId('puzzle-canvas')).toBeVisible();
};

const triggerManualSave = async (page) => {
  await page.getByTestId('puzzle-cell-0').click();
  const saveButton = page.getByTestId('manual-save');
  await expect
    .poll(async () =>
      page.evaluate(
        () => (window as Window & { __PLAYWRIGHT_LAST_STATUS__?: string }).__PLAYWRIGHT_LAST_STATUS__ ?? null
      )
    )
    .toBe('ready');
  await page.waitForTimeout(200);
  await expect(saveButton).toBeEnabled();
  await saveButton.click();
};

const assertIndicator = async (page, getSnapshotCount) => {
  await expect.poll(getSnapshotCount).toBe(1);
  await expect(page.getByTestId('autosave-indicator')).not.toContainText('오류');
};

const flows = { setupMocks, trackSnapshotCalls, goToPuzzle, triggerManualSave, assertIndicator };

test.beforeEach(async ({ page }) => {
  await page.addInitScript((base) => {
    window.__PLAYWRIGHT_API_BASE__ = base;
    localStorage.setItem('anon_id', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
  }, MOCK_BASE);
});

test.describe('Puzzle autosave', () => {
  test('manual save triggers snapshot API', async ({ page }) => {
    await flows.setupMocks(page);
    const getSnapshotCalls = await flows.trackSnapshotCalls(page);
    await flows.goToPuzzle(page);
    await flows.triggerManualSave(page);
    await flows.assertIndicator(page, getSnapshotCalls);
  });
});
