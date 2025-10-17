import {expect, test} from '@playwright/test';

test.describe('Game Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the homepage
    await page.goto('/');
  });

  test('should navigate through basic game flow', async ({ page }) => {
    // Test navigation to login page
    await test.step('Navigate to login page', async () => {
      await page.click('text=로그인');
      await expect(page).toHaveURL(/.*login/);
      await expect(page.locator('h1')).toContainText('로그인');
    });

    // Mock login (since we don't have a real backend)
    await test.step('Mock login process', async () => {
      // Fill in mock credentials
      await page.fill('[data-testid="username-input"]', 'testuser');
      await page.fill('[data-testid="password-input"]', 'password123');
      
      // Mock successful login response
      await page.route('**/api/auth/login', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            user: {
              id: 'user-123',
              name: 'Test User',
              avatar: null
            },
            token: 'mock-jwt-token'
          })
        });
      });

      await page.click('[data-testid="login-button"]');
    });

    // Should redirect to lobby
    await test.step('Verify redirect to lobby', async () => {
      await expect(page).toHaveURL(/.*lobby/);
      await expect(page.locator('[data-testid="lobby-title"]')).toBeVisible();
    });

    // Test game room creation
    await test.step('Create game room', async () => {
      // Mock game room creation API
      await page.route('**/api/rooms', async route => {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'room-123',
            name: 'Test Room',
            hostId: 'user-123',
            hostName: 'Test User',
            status: 'waiting',
            currentPlayers: 1,
            maxPlayers: 6,
            isPrivate: false,
            hasPassword: false,
            settings: {
              roundTime: 300,
              discussionTime: 180,
              defenseTime: 60,
              allowSpectators: true
            },
            players: [{
              id: 'user-123',
              name: 'Test User',
              avatar: null,
              isReady: false
            }],
            createdAt: new Date().toISOString()
          })
        });
      });

      await page.click('[data-testid="create-room-button"]');
      
      // Fill room creation form
      await page.fill('[data-testid="room-name-input"]', 'Test Room');
      await page.click('[data-testid="confirm-create-room"]');
    });

    // Should navigate to game page
    await test.step('Verify navigation to game page', async () => {
      await expect(page).toHaveURL(/.*game\/room-123/);
      await expect(page.locator('[data-testid="game-room-title"]')).toContainText('Test Room');
    });

    // Test player ready functionality
    await test.step('Test ready status toggle', async () => {
      const readyButton = page.locator('[data-testid="ready-button"]');
      
      // Initially not ready
      await expect(readyButton).toContainText('준비');
      
      // Click to become ready
      await readyButton.click();
      await expect(readyButton).toContainText('준비 취소');
      
      // Click again to become not ready
      await readyButton.click();
      await expect(readyButton).toContainText('준비');
    });
  });

  test('should handle game room joining flow', async ({ page }) => {
    // Mock existing game rooms
    await page.route('**/api/rooms', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          rooms: [
            {
              id: 'room-456',
              name: 'Existing Room',
              hostId: 'host-123',
              hostName: 'Host User',
              status: 'waiting',
              currentPlayers: 2,
              maxPlayers: 6,
              isPrivate: false,
              hasPassword: false,
              settings: {
                roundTime: 300,
                discussionTime: 180,
                defenseTime: 60,
                allowSpectators: true
              },
              players: [
                { id: 'host-123', name: 'Host User', avatar: null, isReady: true },
                { id: 'player-2', name: 'Player 2', avatar: null, isReady: false }
              ],
              createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString() // 5 minutes ago
            }
          ]
        })
      });
    });

    // Navigate directly to lobby
    await page.goto('/lobby');

    // Wait for rooms to load
    await test.step('View available rooms', async () => {
      await expect(page.locator('[data-testid="game-room-card"]')).toBeVisible();
      await expect(page.locator('text=Existing Room')).toBeVisible();
      await expect(page.locator('text=2 / 6 명')).toBeVisible();
      await expect(page.locator('text=대기 중')).toBeVisible();
    });

    // Join a room
    await test.step('Join existing room', async () => {
      // Mock join room API
      await page.route('**/api/rooms/room-456/join', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            room: {
              id: 'room-456',
              name: 'Existing Room',
              // ... room details with current user added
            }
          })
        });
      });

      await page.click('[data-testid="join-room-button"]');
    });

    // Should navigate to game page
    await test.step('Verify joined room', async () => {
      await expect(page).toHaveURL(/.*game\/room-456/);
      await expect(page.locator('[data-testid="game-room-title"]')).toContainText('Existing Room');
      
      // Should show other players
      await expect(page.locator('text=Host User')).toBeVisible();
      await expect(page.locator('text=Player 2')).toBeVisible();
    });
  });

  test('should display room filters and search', async ({ page }) => {
    await page.goto('/lobby');

    await test.step('Test room filtering', async () => {
      // Test status filter
      await page.selectOption('[data-testid="status-filter"]', 'waiting');
      
      // Test player count filter  
      await page.selectOption('[data-testid="players-filter"]', 'available');
      
      // Test private room toggle
      await page.check('[data-testid="show-private-toggle"]');
    });

    await test.step('Test room search', async () => {
      const searchInput = page.locator('[data-testid="room-search-input"]');
      
      await searchInput.fill('Test');
      await expect(searchInput).toHaveValue('Test');
      
      // Clear search
      await searchInput.fill('');
    });

    await test.step('Test room sorting', async () => {
      await page.selectOption('[data-testid="sort-select"]', 'newest');
      await page.selectOption('[data-testid="sort-select"]', 'players');
      await page.selectOption('[data-testid="sort-select"]', 'name');
    });
  });

  test('should handle error states gracefully', async ({ page }) => {
    await test.step('Test network error handling', async () => {
      // Mock network failure for room loading
      await page.route('**/api/rooms', async route => {
        await route.abort('failed');
      });

      await page.goto('/lobby');

      // Should show error state
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
      await expect(page.locator('text=방 목록을 불러오는데 실패했습니다')).toBeVisible();
    });

    await test.step('Test retry functionality', async () => {
      // Mock successful retry
      await page.route('**/api/rooms', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ rooms: [] })
        });
      });

      await page.click('[data-testid="retry-button"]');
      await expect(page.locator('[data-testid="error-message"]')).not.toBeVisible();
    });
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/lobby');

    await test.step('Test mobile navigation', async () => {
      // Check if mobile menu is present
      if (await page.locator('[data-testid="mobile-menu-button"]').isVisible()) {
        await page.click('[data-testid="mobile-menu-button"]');
        await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
      }
    });

    await test.step('Test mobile room cards layout', async () => {
      // Room cards should stack vertically on mobile
      const roomCards = page.locator('[data-testid="game-room-card"]');
      const firstCard = roomCards.first();
      
      if (await firstCard.isVisible()) {
        const box = await firstCard.boundingBox();
        expect(box?.width).toBeLessThan(400); // Should be narrow on mobile
      }
    });
  });
});

test.describe('Accessibility', () => {
  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/lobby');

    await test.step('Test keyboard navigation', async () => {
      // Focus should be manageable with tab key
      await page.press('body', 'Tab');
      
      // First focusable element should be highlighted
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
      
      // Should be able to navigate to next element
      await page.press('body', 'Tab');
      // Add more specific keyboard navigation tests based on your UI
    });

    await test.step('Test escape key functionality', async () => {
      // If any modals are open, escape should close them
      if (await page.locator('[role="dialog"]').isVisible()) {
        await page.press('body', 'Escape');
        await expect(page.locator('[role="dialog"]')).not.toBeVisible();
      }
    });
  });

  test('should have proper ARIA labels and roles', async ({ page }) => {
    await page.goto('/lobby');

    await test.step('Check ARIA attributes', async () => {
      // Check for proper button roles and labels
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();

      for (let i = 0; i < Math.min(buttonCount, 5); i++) {
        const button = buttons.nth(i);
        const ariaLabel = await button.getAttribute('aria-label');
        const textContent = await button.textContent();
        
        // Either should have aria-label or meaningful text content
        expect(ariaLabel || textContent?.trim()).toBeTruthy();
      }
    });

    await test.step('Check heading hierarchy', async () => {
      // Should have proper heading structure (h1 -> h2 -> h3, etc.)
      const h1Count = await page.locator('h1').count();
      expect(h1Count).toBeGreaterThan(0);
      
      // Main page should have exactly one h1
      expect(h1Count).toBeLessThanOrEqual(1);
    });
  });

  test('should have sufficient color contrast', async ({ page }) => {
    await page.goto('/lobby');

    // Note: This is a basic test - for comprehensive color contrast testing,
    // you'd typically use specialized tools like axe-core
    await test.step('Check basic contrast elements', async () => {
      const textElements = page.locator('p, span, button, a').first();
      const styles = await textElements.evaluate(el => {
        const computed = getComputedStyle(el);
        return {
          color: computed.color,
          backgroundColor: computed.backgroundColor
        };
      });
      
      // Basic check that text color is not the same as background
      expect(styles.color).not.toBe(styles.backgroundColor);
    });
  });
});