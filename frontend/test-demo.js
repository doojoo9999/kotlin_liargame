import {chromium} from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // 콘솔 로그와 에러 캐치
  page.on('console', msg => console.log('CONSOLE:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error));
  
  try {
    console.log('1. 메인 페이지로 이동...');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    console.log('Current URL:', page.url());
    
    console.log('2. demo-full 페이지로 직접 이동...');
    await page.goto('http://localhost:5173/main/demo-full', { waitUntil: 'networkidle' });
    console.log('Current URL after demo-full:', page.url());
    
    // 페이지 내용 확인
    const title = await page.title();
    console.log('Page title:', title);
    
    const bodyText = await page.textContent('body');
    console.log('Body content (first 200 chars):', bodyText.slice(0, 200));
    
    // 특정 요소들 확인
    const h1 = await page.locator('h1').first().textContent().catch(() => 'No h1 found');
    console.log('H1 content:', h1);
    
    // 라우터 관련 요소 확인
    const routerElements = await page.locator('[data-testid], [class*="router"], [class*="route"]').count();
    console.log('Router-related elements:', routerElements);
    
    // 에러 메시지 확인
    const errorElements = await page.locator('[class*="error"], [class*="Error"]').count();
    console.log('Error elements:', errorElements);
    
    // 로딩 상태 확인
    const loadingElements = await page.locator('[class*="loading"], [class*="Loading"]').count();
    console.log('Loading elements:', loadingElements);
    
    // 스크린샷 캡처
    await page.screenshot({ path: 'demo-full-page.png', fullPage: true });
    console.log('Screenshot saved as demo-full-page.png');
    
    // 3초 대기하여 동적 로딩 확인
    console.log('3초 대기 중...');
    await page.waitForTimeout(3000);
    
    const finalUrl = page.url();
    console.log('Final URL:', finalUrl);
    
    const finalBodyText = await page.textContent('body');
    console.log('Final body content (first 200 chars):', finalBodyText.slice(0, 200));
    
  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    await browser.close();
  }
})();