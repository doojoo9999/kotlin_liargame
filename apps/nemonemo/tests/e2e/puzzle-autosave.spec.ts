import { test, expect, type APIRequestContext, type Page, type Response } from '@playwright/test';

const API_BASE = process.env.PLAYWRIGHT_API_BASE ?? 'http://127.0.0.1:20021/api/v2/nemonemo';
const SUBJECT_KEY = process.env.PLAYWRIGHT_SUBJECT_KEY ?? 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

type PuzzleFixture = {
  id: string;
  title: string;
};

let puzzleFixture: PuzzleFixture | null = null;

const ensureFixture = (): PuzzleFixture => {
  if (!puzzleFixture) {
    throw new Error('Puzzle fixture has not been prepared.');
  }
  return puzzleFixture;
};

const safeJson = async (response: Response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

const observeSnapshotCalls = (page: Page) => {
  const fixture = ensureFixture();
  let snapshotCalls = 0;
  let currentPlayId: string | null = null;

  page.on('response', async (response) => {
    const url = response.url();
    const method = response.request().method();

    if (method === 'POST' && url.includes(`/puzzles/${fixture.id}/plays`)) {
      const body = await safeJson(response);
      if (body?.playId) {
        currentPlayId = body.playId;
      }
    }

    if (
      currentPlayId &&
      method === 'PATCH' &&
      url.includes(`/plays/${currentPlayId}/snapshot`) &&
      response.status() === 204
    ) {
      snapshotCalls += 1;
    }
  });

  return () => snapshotCalls;
};

const buildGrid = (attempt: number): string[] => {
  const base = ['#....', '##...', '#.#..', '.#.#.', '..###'];
  const rowIndex = attempt % base.length;
  const colIndex = attempt % base[0].length;
  return base.map((row, idx) => {
    if (idx !== rowIndex) {
      return row;
    }
    const chars = row.split('');
    chars[colIndex] = chars[colIndex] === '#' ? '.' : '#';
    return chars.join('');
  });
};

const createPuzzleFixture = async (request: APIRequestContext): Promise<PuzzleFixture> => {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const payload = {
      title: `E2E Puzzle ${Date.now()}-${attempt}`,
      description: 'Playwright autosave scenario',
      width: 5,
      height: 5,
      grid: buildGrid(attempt),
      tags: ['e2e', 'autosave'],
      seriesId: null,
      contentStyle: 'GENERIC_PIXEL'
    };

    const response = await request.post(`${API_BASE}/puzzles`, {
      data: payload,
      headers: { 'X-Subject-Key': SUBJECT_KEY }
    });

    if (response.status() === 409) {
      continue;
    }

    expect(response.ok()).toBeTruthy();
    const body = await response.json();

    const detailResponse = await request.get(`${API_BASE}/puzzles/${body.puzzleId}`, {
      headers: { 'X-Subject-Key': SUBJECT_KEY }
    });
    expect(detailResponse.ok()).toBeTruthy();
    const detail = await detailResponse.json();
    expect(detail.status).toBe('APPROVED');

    return { id: body.puzzleId, title: detail.title };
  }

  throw new Error('Unable to seed puzzle fixture without checksum conflict');
};

const goToPuzzle = async (page: Page) => {
  const fixture = ensureFixture();
  await page.goto(`/puzzles/${fixture.id}`);
  await expect(page.getByRole('heading', { name: fixture.title })).toBeVisible();
  await expect(page.getByTestId('puzzle-board')).toBeVisible();
};

const triggerManualSave = async (page: Page) => {
  await page.getByTestId('puzzle-cell-0').click();
  const saveButton = page.getByTestId('manual-save');
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as Window & { __PLAYWRIGHT_LAST_STATUS__?: string }).__PLAYWRIGHT_LAST_STATUS__ ?? null
      )
    )
    .toBe('ready');
  await expect(saveButton).toBeEnabled();
  await saveButton.click();
};

const assertIndicator = async (page: Page, getSnapshotCount: () => number) => {
  await expect.poll(getSnapshotCount).toBe(1);
  await expect(page.getByTestId('autosave-indicator')).not.toContainText('오류');
};

test.beforeAll(async ({ request }) => {
  puzzleFixture = await createPuzzleFixture(request);
});

test.beforeEach(async ({ page }) => {
  await page.addInitScript((subjectKey) => {
    localStorage.setItem('anon_id', subjectKey);
  }, SUBJECT_KEY);
});

test.describe('Puzzle autosave', () => {
  test('manual save triggers snapshot API', async ({ page }, testInfo) => {
    const getSnapshotCalls = observeSnapshotCalls(page);
    await goToPuzzle(page);
    await triggerManualSave(page);
    await assertIndicator(page, getSnapshotCalls);
    const screenshotPath = testInfo.outputPath('autosave.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    await testInfo.attach('autosave-screenshot', { path: screenshotPath, contentType: 'image/png' });
  });
});
