import {chromium} from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // 콘솔 로그와 에러 캐치
  page.on('console', msg => console.log('CONSOLE:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error));
  
  try {
    console.log('디자인 데모 페이지로 이동...');
    await page.goto('http://localhost:5173/main/demo', { waitUntil: 'networkidle' });
    console.log('Current URL:', page.url());
    
    // 페이지 내용 확인
    const title = await page.title();
    console.log('Page title:', title);
    
    const h1 = await page.locator('h1').first().textContent().catch(() => 'No h1 found');
    console.log('H1 content:', h1);
    
    // 탭들 확인
    const tabs = await page.locator('button[role="tab"]').count();
    console.log('Number of tabs:', tabs);
    
    if (tabs > 0) {
      const tabTexts = await page.locator('button[role="tab"]').allTextContents();
      console.log('Tab names:', tabTexts);
    }
    
    // 카드들 확인
    const cards = await page.locator('[class*="card"], [data-testid*="card"]').count();
    console.log('Number of cards:', cards);
    
    // 버튼들 확인
    const buttons = await page.locator('button').count();
    console.log('Number of buttons:', buttons);
    
    // 스크린샷 캡처
    await page.screenshot({ path: 'design-demo-page.png', fullPage: true });
    console.log('Screenshot saved as design-demo-page.png');
    
    // 각 탭 클릭해서 내용 확인
    if (tabs > 0) {
      console.log('\n=== 각 탭 내용 확인 ===');
      for (let i = 0; i < Math.min(tabs, 5); i++) {
        const tabButton = page.locator('button[role="tab"]').nth(i);
        const tabText = await tabButton.textContent();
        console.log(`\n${i+1}. "${tabText}" 탭 클릭...`);
        
        await tabButton.click();
        await page.waitForTimeout(1000);
        
        // 해당 탭의 내용 확인
        const content = await page.locator('[role="tabpanel"]').textContent().catch(() => 'No content');
        console.log(`Content preview: ${content.slice(0, 100)}...`);
        
        // 이미지/아이콘 개수
        const images = await page.locator('img, svg').count();
        console.log(`Images/SVGs in this tab: ${images}`);
      }
    }
    
  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    await browser.close();
  }
})();