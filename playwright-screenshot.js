const { chromium } = require('playwright');

async function takeLoginScreenshot() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    console.log('Navigating to login page...');
    
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
    
    await page.goto('http://localhost:5173/main/login', { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    
    // 페이지 제목과 URL 확인
    const title = await page.title();
    const url = page.url();
    console.log(`Page title: ${title}`);
    console.log(`Page URL: ${url}`);
    
    // 페이지 내용 확인
    const bodyContent = await page.evaluate(() => document.body.textContent);
    console.log('Page content preview:', bodyContent.substring(0, 200));
    
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
      } catch (e) {
        console.log(`Selector ${selector} not found, trying next...`);
      }
    }
    
    if (!elementFound) {
      console.log('No target elements found, taking screenshot anyway...');
    }
    
    // 추가 대기 시간
    await page.waitForTimeout(3000);
    
    // 스크린샷 촬영
    await page.screenshot({ 
      path: 'docs/upgrade_1/improved-login-screenshot.png',
      fullPage: true 
    });
    
    console.log('Screenshot saved: docs/upgrade_1/improved-login-screenshot.png');
    
  } catch (error) {
    console.error('Error taking screenshot:', error.message);
    console.error('Full error:', error);
  } finally {
    await browser.close();
  }
}

takeLoginScreenshot();