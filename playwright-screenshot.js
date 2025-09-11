const { chromium } = require('playwright');

async function takeLoginScreenshot() {
  const portArg = process.argv[2];
  const port = portArg || process.env.PORT || '5173';
  const url = `http://localhost:${port}/main/login`;
  const outPath = 'docs/upgrade_5/login-screenshot.png';

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    console.log('Navigating to login page...', url);

    // 콘솔 에러 로그 수집
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Browser console error:', msg.text());
      }
    });
    
    // 페이지 에러 수집
    page.on('pageerror', error => {
      console.log('Page error:', error.message);
    });
    
    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    
    // 페이지 제목과 URL 확인
    const title = await page.title();
    const currentUrl = page.url();
    console.log(`Page title: ${title}`);
    console.log(`Page URL: ${currentUrl}`);

    // 여러 가능한 셀렉터 시도
    const selectors = ['form', 'input[type="text"]', 'button', '[class*="Card"]'];
    let elementFound = false;
    
    for (const selector of selectors) {
      try {
        console.log(`Trying selector: ${selector}`);
        await page.waitForSelector(selector, { timeout: 5000 });
        console.log(`Found element with selector: ${selector}`);
        elementFound = true;
        break;
      } catch {
        console.log(`Selector ${selector} not found, trying next...`);
      }
    }
    
    if (!elementFound) {
      console.log('No target elements found, taking screenshot anyway...');
    }
    
    // 추가 대기 시간
    await page.waitForTimeout(1500);

    // 스크린샷 촬영
    await page.screenshot({ 
      path: outPath,
      fullPage: true
    });
    
    console.log('Screenshot saved:', outPath);

  } catch (error) {
    console.error('Error taking screenshot:', error.message);
    console.error('Full error:', error);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

if (require.main === module) {
  takeLoginScreenshot();
}
