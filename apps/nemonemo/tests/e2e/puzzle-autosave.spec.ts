import { test, expect } from '@playwright/test';

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
  await page.route('**/api/v2/nemonemo/puzzles/fixture-puzzle', async (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({ json: puzzleDetailResponse });
    }
    return route.continue();
  });

  await page.route('**/api/v2/nemonemo/puzzles/fixture-puzzle/plays', async (route) => {
    return route.fulfill({ json: playStartResponse });
  });
};

const trackSnapshotCalls = async (page) => {
  let calls = 0;
  await page.route('**/api/v2/nemonemo/plays/play-e2e/snapshot', async (route) => {
    calls += 1;
    return route.fulfill({ status: 204, body: '' });
  });
  return () => calls;
};

const goToPuzzle = async (page) => {
  await page.goto('/nemonemo/puzzles/fixture-puzzle');
  await expect(page.getByRole('heading', { name: puzzleDetailResponse.title })).toBeVisible();
  await expect(page.getByTestId('puzzle-canvas')).toBeVisible();
};

const triggerManualSave = async (page) => {
  await page.getByTestId('puzzle-cell-0').click();
  await page.getByTestId('manual-save').click();
};

const assertIndicator = async (page, getSnapshotCount) => {
  await expect(page.getByTestId('autosave-indicator')).toContainText('저장 중');
  await expect.poll(getSnapshotCount).toBe(1);
  await expect(page.getByTestId('autosave-indicator')).not.toContainText('오류');
};

const flows = { setupMocks, trackSnapshotCalls, goToPuzzle, triggerManualSave, assertIndicator };

test.describe('Puzzle autosave', () => {
  test('manual save triggers snapshot API', async ({ page }) => {
    await flows.setupMocks(page);
    const getSnapshotCalls = await flows.trackSnapshotCalls(page);
    await flows.goToPuzzle(page);
    await flows.triggerManualSave(page);
    await flows.assertIndicator(page, getSnapshotCalls);
  });
});
