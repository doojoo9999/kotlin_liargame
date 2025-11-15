import {expect, test, type Page} from '@playwright/test'
import {MockBackend} from './support/mockBackend'

const RAW_BASE_PATH = process.env.APP_BASE_PATH ?? '/liargame'
const APP_BASE_PATH = RAW_BASE_PATH === '/' ? '' : RAW_BASE_PATH.replace(/\/$/, '')
const GAME_NUMBER = 95432

const appPath = (target = '/'): string => {
  if (!APP_BASE_PATH) {
    return target === '/' ? '/' : target.startsWith('/') ? target : `/${target}`
  }
  if (target === '/' || target === '') {
    return `${APP_BASE_PATH}/`
  }
  return `${APP_BASE_PATH}${target.startsWith('/') ? target : `/${target}`}`
}

const urlRegex = (target: string) => new RegExp(`${appPath(target).replace(/\//g, '\\/')}$`)

async function navigateToLogin(page: Page): Promise<void> {
  await page.goto(appPath('/'))
  await expect(page.locator('h1')).toContainText('라이어 게임')
}

async function loginFromLanding(page: Page, nickname = '테스터'): Promise<void> {
  await navigateToLogin(page)
  await page.locator('input#nickname').fill(nickname)
  const loginButton = page.getByRole('button', {name: /게임 시작/})
  await Promise.all([
    page.waitForURL(urlRegex('/lobby')),
    loginButton.click(),
  ])
  await expect(page.getByText('라이어 게임 로비')).toBeVisible()
}

test.describe('Game Flow', () => {
  let backend: MockBackend

  test.beforeEach(async ({context}) => {
    backend = new MockBackend(GAME_NUMBER)
    await context.route('**/api/v1/**', route => backend.handle(route))
    await context.route('**/ws/**', route => route.abort())
    await context.route('**/sockjs-node/**', route => route.abort())
    await context.route('**/stomp/**', route => route.abort())
  })

  test('should navigate through basic game flow', async ({page}) => {
    await loginFromLanding(page)

    await test.step('Create game room', async () => {
      const createButton = page.getByRole('button', {name: '게임방 만들기'}).first()
      await expect(createButton).toBeEnabled()
      await createButton.click()

      await expect(page.getByRole('heading', {name: '새 게임방 생성'})).toBeVisible()
      await page.locator('#room-name').fill('테스트 라운드')
      const confirmButton = page.getByRole('button', {name: '생성하기'})
      await Promise.all([
        page.waitForURL(urlRegex(`/game/${GAME_NUMBER}`)),
        confirmButton.click(),
      ])
    })

    await test.step('Verify navigation to game page', async () => {
      await expect(page.getByRole('button', {name: '준비 완료'})).toBeVisible()
    })

    await test.step('Test ready status toggle', async () => {
      const readyButton = page.getByRole('button', {name: '준비 완료'})
      await readyButton.click()
      await expect(page.getByRole('button', {name: '준비 해제'})).toBeVisible()
      await page.getByRole('button', {name: '준비 해제'}).click()
      await expect(page.getByRole('button', {name: '준비 완료'})).toBeVisible()
    })
  })

  test('should handle game room joining flow', async ({page}) => {
    backend.seedRoomList('waiting')
    await loginFromLanding(page)

    await test.step('View available rooms', async () => {
      await expect(page.getByRole('heading', {name: /라이어 게임 로비/})).toBeVisible()
      await expect(page.getByText('게임방 목록')).toBeVisible()
      await expect(page.getByRole('heading', {name: /테스터 님의 방/})).toBeVisible()
    })

    await test.step('Join existing room', async () => {
      const joinButton = page.getByRole('button', {name: '참여하기'}).first()
      await Promise.all([
        page.waitForURL(urlRegex(`/game/${GAME_NUMBER}`)),
        joinButton.click(),
      ])
    })

    await test.step('Verify joined room', async () => {
      await expect(page.getByRole('button', {name: /준비/})).toBeVisible()
    })
  })

  test('should display room filters and search', async ({page}) => {
    backend.seedRoomList('waiting')
    await loginFromLanding(page)

    const refreshButton = page.getByRole('button', {name: '새로고침'})
    await expect(refreshButton).toBeVisible()
    await refreshButton.click()

    const codeJoinButton = page.getByRole('button', {name: '코드로 참여'})
    await codeJoinButton.click()
    const codeInput = page.locator('#game-code')
    await expect(codeInput).toBeVisible()
    await codeInput.fill(String(GAME_NUMBER))
    const codeJoinConfirm = page.getByRole('button', {name: /^참여하기$/}).last()
    await codeJoinConfirm.click()
    await page.waitForURL(urlRegex(`/game/${GAME_NUMBER}`))
  })

  test('should handle error states gracefully', async ({page}) => {
    await page.route('**/api/v1/game/rooms', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({success: false, message: 'rooms unavailable'}),
      })
    })

    await loginFromLanding(page)

    await test.step('Show error state', async () => {
      await expect(page.getByText('게임방을 가져오지 못했습니다')).toBeVisible()
      const retryButton = page.getByRole('button', {name: '다시 시도'})
      await expect(retryButton).toBeVisible()
    })

    await page.unroute('**/api/v1/game/rooms')

    await test.step('Retry successfully', async () => {
      const retryButton = page.getByRole('button', {name: '다시 시도'})
      await Promise.all([
        page.waitForResponse(resp => resp.url().includes('/api/v1/game/rooms')),
        retryButton.click(),
      ])
      await expect(page.getByText('현재 대기 중인 게임방이 없습니다.')).toBeVisible()
    })
  })

  test('should be responsive on mobile devices', async ({page}) => {
    backend.seedRoomList('waiting')
    await page.setViewportSize({width: 375, height: 667})
    await loginFromLanding(page)

    const grid = page.locator('div.grid').first()
    const template = await grid.evaluate(node => window.getComputedStyle(node as HTMLElement).gridTemplateColumns)
    expect(template.split(' ').length).toBe(1)
  })
})
