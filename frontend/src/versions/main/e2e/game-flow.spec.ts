import {expect, test} from '@playwright/test'

test.describe('Main Version Game Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to lobby
    await page.goto('/main/lobby')
  })

  test('complete game creation and joining flow', async ({ browser }) => {
    // Create contexts for multiple players
    const context1 = await browser.newContext()
    const context2 = await browser.newContext()
    const page1 = await context1.newPage()
    const page2 = await context2.newPage()

    // Player 1: Create game
    await page1.goto('/main/lobby')
    await page1.click('[data-testid="create-game-button"]')

    // Fill game creation form
    await page1.fill('[data-testid="game-title"]', 'E2E Test Game')
    await page1.selectOption('[data-testid="game-participants"]', '4')
    await page1.selectOption('[data-testid="liar-count"]', '1')
    await page1.selectOption('[data-testid="total-rounds"]', '3')
    await page1.click('[data-testid="game-mode-liars-know"]')
    await page1.click('[data-testid="submit-create-game"]')

    // Wait for game room creation
    await page1.waitForURL(/\/main\/room\/\d+/)
    const roomUrl = page1.url()
    const roomId = roomUrl.split('/').pop()

    // Verify game room elements
    await expect(page1.locator('[data-testid="game-title"]')).toContainText('E2E Test Game')
    await expect(page1.locator('[data-testid="host-badge"]')).toBeVisible()
    await expect(page1.locator('[data-testid="player-count"]')).toContainText('1/4')

    // Player 2: Join game
    await page2.goto(`/main/room/${roomId}`)
    await expect(page2.locator('[data-testid="game-title"]')).toContainText('E2E Test Game')
    await expect(page2.locator('[data-testid="player-count"]')).toContainText('2/4')

    // Host starts game (need minimum 4 players for real test)
    // For now, test the UI behavior
    const startButton = page1.locator('[data-testid="start-game-button"]')
    await expect(startButton).toBeDisabled() // Not enough players

    await context1.close()
    await context2.close()
  })

  test('real-time chat functionality', async ({ page }) => {
    await page.goto('/main/room/1') // Mock room

    // Test chat input
    const chatInput = page.locator('[data-testid="chat-input"]')
    const sendButton = page.locator('[data-testid="chat-send"]')

    await chatInput.fill('Hello, this is a test message!')
    await sendButton.click()

    // Verify message appears in chat
    await expect(page.locator('[data-testid="chat-messages"]')).toContainText('Hello, this is a test message!')

    // Test message type indicators
    await expect(page.locator('[data-testid="message-type-badge"]')).toContainText('💬 대화')
  })

  test('connection status monitoring', async ({ page }) => {
    await page.goto('/main/game/1') // Mock game

    // Check connection status indicator
    const connectionStatus = page.locator('[data-testid="connection-status"]')
    await expect(connectionStatus).toBeVisible()

    // Should show connected state initially
    await expect(connectionStatus).toContainText('연결됨')

    // Test offline simulation
    await page.context().setOffline(true)
    await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible()

    // Test reconnection
    await page.context().setOffline(false)
    await page.locator('[data-testid="reconnect-button"]').click()
    await expect(connectionStatus).toContainText('연결됨')
  })

  test('game phase transitions', async ({ page }) => {
    await page.goto('/main/game/1') // Mock game

    // Test waiting phase
    await expect(page.locator('[data-testid="game-phase"]')).toContainText('대기')

    // Test role assignment phase
    await page.locator('[data-testid="next-phase-button"]').click()
    await expect(page.locator('[data-testid="game-phase"]')).toContainText('역할 배정')

    // Test role reveal
    await page.locator('[data-testid="reveal-role-button"]').click()
    await expect(page.locator('[data-testid="player-role"]')).toBeVisible()

    // Test hint providing phase
    await page.locator('[data-testid="next-phase-button"]').click()
    await expect(page.locator('[data-testid="game-phase"]')).toContainText('힌트 제공')

    // Test hint input (if it's player's turn)
    const hintInput = page.locator('[data-testid="hint-input"]')
    if (await hintInput.isVisible()) {
      await hintInput.fill('This is a test hint')
      await page.locator('[data-testid="submit-hint"]').click()
      await expect(page.locator('[data-testid="hint-list"]')).toContainText('This is a test hint')
    }
  })

  test('voting interface functionality', async ({ page }) => {
    await page.goto('/main/game/1') // Mock game in voting phase

    // Navigate to voting phase
    await page.locator('[data-testid="skip-to-voting"]').click()
    await expect(page.locator('[data-testid="game-phase"]')).toContainText('투표')

    // Test player selection for voting
    const playerCards = page.locator('[data-testid="voteable-player"]')
    const firstPlayer = playerCards.first()

    await firstPlayer.click()
    await expect(firstPlayer).toHaveClass(/ring-blue-500/)

    // Test vote confirmation
    await page.locator('[data-testid="confirm-vote"]').click()
    await expect(page.locator('[data-testid="vote-status"]')).toContainText('투표 완료')
  })

  test('responsive design on mobile', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 } // iPhone SE
    })
    const page = await context.newPage()

    await page.goto('/main/lobby')

    // Test mobile navigation
    await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible()
    await page.locator('[data-testid="mobile-menu-button"]').click()
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible()

    // Test mobile game room layout
    await page.goto('/main/room/1')
    await expect(page.locator('[data-testid="mobile-layout"]')).toBeVisible()

    // Test mobile chat toggle
    await page.locator('[data-testid="mobile-chat-toggle"]').click()
    await expect(page.locator('[data-testid="mobile-chat-sheet"]')).toBeVisible()

    await context.close()
  })

  test('accessibility compliance', async ({ page }) => {
    await page.goto('/main/lobby')

    // Test keyboard navigation
    await page.keyboard.press('Tab')
    await expect(page.locator(':focus')).toBeVisible()

    // Test form labels
    await page.goto('/main/create')
    const gameTitle = page.locator('[data-testid="game-title"]')
    await expect(gameTitle).toHaveAttribute('aria-label')

    // Test color contrast (this would be checked with axe-core in unit tests)
    // Here we just verify important elements are visible
    await expect(page.locator('[data-testid="create-game-button"]')).toBeVisible()
    await expect(page.locator('[data-testid="game-title"]')).toBeVisible()
  })

  test('error handling and recovery', async ({ page }) => {
    await page.goto('/main/game/999') // Non-existent game

    // Should show error message
    await expect(page.locator('[data-testid="error-message"]')).toContainText('게임을 찾을 수 없습니다')

    // Should provide navigation back to lobby
    await page.locator('[data-testid="back-to-lobby"]').click()
    await expect(page).toHaveURL('/main/lobby')

    // Test network error simulation
    await page.route('**/api/**', route => route.abort())
    await page.goto('/main/lobby')
    await expect(page.locator('[data-testid="network-error"]')).toBeVisible()
  })
})
