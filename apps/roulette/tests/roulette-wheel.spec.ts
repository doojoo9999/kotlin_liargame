import {expect, test} from '@playwright/test';

async function addParticipants(page: import('@playwright/test').Page, names: string[]) {
  const input = page.getByTestId('participant-input');
  const submit = page.getByTestId('participant-submit');
  const rowLocator = page.getByTestId('participant-row');

  for (const chunk of chunkNames(names, 10)) {
    const before = await rowLocator.count();
    await input.fill(chunk.join(', '));
    await submit.click();
    const expected = before + chunk.length;
    await expect(rowLocator).toHaveCount(expected, {timeout: 10000});
  }
}

function chunkNames(names: string[], size: number) {
  const result: string[][] = [];
  for (let i = 0; i < names.length; i += size) {
    result.push(names.slice(i, i + size));
  }
  return result;
}

async function assertSegmentCount(page: import('@playwright/test').Page, expected: number) {
  await page.waitForTimeout(3000);
  const pathCount = await page.evaluate(() => document.querySelectorAll('[data-testid="wheel-segment"]').length);
  const labelCount = await page.evaluate(() => document.querySelectorAll('.wheel-label').length);
  const memoSegmentsLength = await page.evaluate(() => ((window as any).__segments ?? []).length);
  const participantsLength = await page.evaluate(() => ((window as any).__participantsList ?? []).length);
  const rowCount = await page.evaluate(() => document.querySelectorAll('[data-testid="participant-row"]').length);
  const eligibleLength = await page.evaluate(() => ((window as any).__debugEligible ?? []).length);
  const missingNames = await page.evaluate(() => {
    const list = (window as any).__participantsList ?? [];
    const eligible = new Set(((window as any).__debugEligible ?? []).map((p: any) => p.name));
    return list.filter((p: any) => !eligible.has(p.name)).slice(0, 5).map((p: any) => p.name);
  });
  const sampleRow = await page.evaluate(() => {
    const el = document.querySelector('[data-testid="participant-row"] strong');
    return el ? el.textContent : null;
  });
  const sampleEntryCount = await page.evaluate(() => {
    const input = document.querySelector('[data-testid="participant-row"] input');
    return input ? input.value : null;
  });
  console.log('[test] paths', pathCount, 'labels', labelCount);
  console.log('[test] memo segments', memoSegmentsLength);
  console.log('[test] participants state', participantsLength);
  console.log('[test] row count', rowCount);
  console.log('[test] eligible length', eligibleLength);
  console.log('[test] missing names sample', missingNames);
  console.log('[test] sample row', sampleRow);
  console.log('[test] sample entry count', sampleEntryCount);
  await expect(pathCount).toBe(expected);
  await expect(labelCount).toBe(expected);
}

test.describe('룰렛 참가자 세그먼트 검증', () => {
  test.beforeEach(async ({page}) => {
    page.on('console', (message) => {
      console.log('[browser]', message.type(), message.text());
    });
    await page.goto('/');
    await page.waitForSelector('[data-testid="participant-input"]');
  });

  test('100명의 참가자가 모두 표시된다', async ({page}) => {
    const names = Array.from({length: 100}, (_, index) => `참가자${index + 1}`);
    await addParticipants(page, names);
    await assertSegmentCount(page, 100);
  });

  test('500명의 참가자가 모두 표시된다', async ({page}) => {
    const names = Array.from({length: 500}, (_, index) => `참가자${index + 1}`);
    await addParticipants(page, names);
    await assertSegmentCount(page, 500);
  });
});
