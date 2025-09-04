import {chromium} from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('=== 현재 데모 페이지 디자인 상태 확인 ===\n');
    
    await page.goto('http://localhost:5173/main/demo', { waitUntil: 'networkidle' });
    
    // 전체 스크린샷
    await page.screenshot({ path: 'current-demo-full.png', fullPage: true });
    console.log('✅ 전체 스크린샷 저장: current-demo-full.png');
    
    // CSS 분석
    console.log('\n=== CSS 프레임워크 분석 ===');
    
    // Tailwind CSS 체크
    const tailwindClasses = await page.locator('[class*="bg-"], [class*="text-"], [class*="p-"], [class*="m-"], [class*="flex"], [class*="grid"]').count();
    console.log(`Tailwind CSS 클래스 요소 개수: ${tailwindClasses}`);
    
    // Shadcn/ui 컴포넌트 체크
    const shadcnComponents = await page.locator('[data-radix-collection-item], [data-state], [class*="shadcn"], [class*="ui-"]').count();
    console.log(`Shadcn/ui 컴포넌트 개수: ${shadcnComponents}`);
    
    // 현재 스타일링 상태
    const bodyStyles = await page.evaluate(() => {
      const body = document.body;
      const computedStyle = window.getComputedStyle(body);
      return {
        fontFamily: computedStyle.fontFamily,
        backgroundColor: computedStyle.backgroundColor,
        color: computedStyle.color
      };
    });
    console.log('Body 스타일:', bodyStyles);
    
    // 각 탭별 스크린샷
    const tabs = ['버튼', '뱃지', '카드', '타이머', '플레이어', '게임 UI'];
    
    for (let i = 0; i < tabs.length; i++) {
      console.log(`\n📸 "${tabs[i]}" 탭 스크린샷 촬영 중...`);
      
      // 탭 클릭
      await page.locator('button[role="tab"]').nth(i).click();
      await page.waitForTimeout(1000);
      
      // 탭 내용 스크린샷
      await page.screenshot({ 
        path: `current-tab-${i}-${tabs[i]}.png`, 
        clip: { x: 0, y: 200, width: 1200, height: 800 } 
      });
      
      // 탭 내용의 실제 HTML 확인
      const tabContent = await page.locator('[role="tabpanel"]').innerHTML().catch(() => 'No content');
      console.log(`   HTML 길이: ${tabContent.length} characters`);
      
      // 스타일 있는 요소 확인
      const styledElements = await page.locator('[role="tabpanel"] *[style], [role="tabpanel"] *[class]').count();
      console.log(`   스타일이 있는 요소: ${styledElements}개`);
    }
    
    // 버튼 스타일 분석
    console.log('\n=== 버튼 스타일 분석 ===');
    await page.locator('button[role="tab"]').first().click();
    await page.waitForTimeout(500);
    
    const buttons = await page.locator('button').all();
    for (let i = 0; i < Math.min(buttons.length, 5); i++) {
      const buttonStyles = await buttons[i].evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          backgroundColor: styles.backgroundColor,
          color: styles.color,
          padding: styles.padding,
          borderRadius: styles.borderRadius,
          border: styles.border,
          className: el.className
        };
      });
      console.log(`Button ${i+1}:`, buttonStyles);
    }
    
    console.log('\n=== 종합 분석 ===');
    console.log('현재 상태: CSS 프레임워크가 제대로 적용되지 않은 것으로 보임');
    console.log('필요한 작업: Shadcn/ui + Tailwind CSS 재설정 및 Modern 디자인 적용');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
})();