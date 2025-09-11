const { chromium } = require('playwright')

async function run() {
  const port = process.argv[2] || '4173'
  const url = `http://localhost:${port}/`
  const loginUrl = `http://localhost:${port}/login`
  const outPath = 'docs/upgrade_5/login-screenshot.png'

  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  try {
    console.log('Opening preview page:', url)
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
    // Redirect to login if needed
    try {
      await page.waitForSelector('form', { timeout: 3000 })
    } catch {
      console.log('Form not found on /, navigating to /login')
      await page.goto(loginUrl, { waitUntil: 'domcontentloaded', timeout: 30000 })
    }

    // Wait a bit for animations/styles
    await page.waitForTimeout(1200)

    // Ensure gradient is applied by checking class on main container
    const hasGradient = await page.evaluate(() => {
      const el = document.querySelector('div.min-h-screen')
      return el && el.className.includes('bg-gradient-to-br')
    })
    console.log('Gradient class present:', !!hasGradient)

    await page.screenshot({ path: outPath, fullPage: true })
    console.log('Saved screenshot:', outPath)
  } catch (e) {
    console.error('Screenshot error:', e && e.message)
    process.exitCode = 1
  } finally {
    await browser.close()
  }
}

run()

