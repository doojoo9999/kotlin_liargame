import {expect, test} from '@playwright/test';

const createUniqueNickname = () => `E2EUser-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

test.describe('Realtime Chat Connection', () => {
  test('does not show realtime connection warning after joining a fresh room', async ({ page }) => {
    const nickname = createUniqueNickname();

    await page.goto('/');

    const nicknameInput = page.getByLabel('닉네임');
    await nicknameInput.fill(nickname);

    // Only one primary action button on login page
    await page.getByRole('button').first().click();

    await expect(page).toHaveURL(/\/lobby$/);

    // allow lobby data and websocket bootstrap hooks to run
    await page.waitForLoadState('networkidle');

    const buttonTexts = await page.locator('button').allInnerTexts();
    console.log('Lobby buttons:', buttonTexts);

    const createButton = page.getByRole('button', { name: /만들|생성|새.*게임/ });
    await expect(createButton).toBeVisible();
    await createButton.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    const createRoomBtn = dialog.getByRole('button', { name: /생성|시작/ });
    await expect(createRoomBtn).toBeEnabled();
    await createRoomBtn.click();

    await expect(page).toHaveURL(/\/game\//);

    // Wait briefly for game screen to settle
    await page.waitForTimeout(1500);

    const connectionError = page.getByText('실시간 연결이 필요합니다');
    await expect(connectionError).toHaveCount(0);

    const connectionReady = page.getByText('실시간 연결');
    await expect(connectionReady).toBeVisible();
  });
});
