import {expect, Page, test} from '@playwright/test';

const createUniqueRoomName = () => 'room-' + Date.now().toString();

const waitForLobbyData = async (page: Page) => {
  await page.waitForTimeout(1000);
  await page.waitForLoadState('networkidle');
};

test.describe('Realtime Chat', () => {
  test('shows realtime connection error after creating a room and sending chat', async ({ page }) => {
    await page.goto('/');

    const nicknameInput = page.locator('#nickname');
    await expect(nicknameInput).toBeVisible();
    await nicknameInput.fill('TEST');

    await page.locator('form button[type="submit"]').click();
    await expect(page).toHaveURL(/\/lobby$/);

    await waitForLobbyData(page);

    const createRoomButton = page
      .getByRole('button', {
        name: /\uAC8C\uC784\uBC29\uB9CC\uB4E4\uAE30|\uCCAB\uAC8C\uC784\uBC29\uB9CC\uB4E4\uAE30/
      })
      .first();
    await expect(createRoomButton).toBeVisible();
    await createRoomButton.click();

    const modal = page.getByRole('dialog', { name: '\uC0C8 \uAC8C\uC784\uBC29 \uC0DD\uC131' });
    await expect(modal).toBeVisible();

    const roomNameInput = modal.locator('input[id="room-name"]');
    if (await roomNameInput.count()) {
      await roomNameInput.fill(createUniqueRoomName());
    }

    const createButton = modal.getByRole('button', { name: '\uC0DD\uC131\uD558\uAE30' });
    await expect(createButton).toBeEnabled();
    await createButton.click();

    await expect(page).toHaveURL(/\/game\//);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const chatInput = page.locator('input[placeholder*="\uBA54\uC2DC"][placeholder*="\uC785\uB825"]');
    await expect(chatInput).toBeVisible();
    await chatInput.fill('chat message');

    const sendButton = page.getByRole('button', { name: '\uC804\uC1A1' });
    await expect(sendButton).toBeVisible();
    await sendButton.click();

    const errorMessage = page.getByText('\uC2E4\uC2DC\uAC04 \uC5F0\uACB0\uC774 \uD544\uC694\uD569\uB2C8\uB2E4', { exact: false });
    await expect(errorMessage).toBeVisible();
  });
});
