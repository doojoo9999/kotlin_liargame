import {chromium} from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('=== 새로운 Linear 스타일 데모 테스트 ===\n');
    
    await page.goto('http://localhost:5175/main/design', { waitUntil: 'networkidle' });
    console.log('✅ 페이지 로드됨:', page.url());
    
    // 전체 스크린샷
    await page.screenshot({ path: 'linear-demo-full.png', fullPage: true });
    console.log('📸 전체 스크린샷: linear-demo-full.png');
    
    // 페이지 내용 확인
    const title = await page.locator('h1').first().textContent().catch(() => 'No title');
    console.log('제목:', title);
    
    // 사이드바 메뉴 확인
    const menuItems = await page.locator('nav button').count();
    console.log('사이드바 메뉴 항목:', menuItems, '개');
    
    if (menuItems > 0) {
      const menuTexts = await page.locator('nav button').allTextContents();
      console.log('메뉴 항목들:', menuTexts);
    }
    
    // 각 섹션 테스트
    const sections = ['overview', 'players', 'chat', 'voting', 'components'];
    
    for (const section of sections) {
      console.log(`\n📋 "${section}" 섹션 테스트 중...`);
      
      // 섹션 버튼 클릭
      const sectionButton = page.locator(`nav button:has-text("${section}")`).first();
      if (await sectionButton.count() > 0) {
        await sectionButton.click();
        await page.waitForTimeout(1000);
        
        // 섹션별 스크린샷
        await page.screenshot({ 
          path: `linear-demo-${section}.png`, 
          fullPage: true 
        });
        console.log(`   ✅ 스크린샷: linear-demo-${section}.png`);
        
        // 콘텐츠 확인
        const content = await page.locator('main, [role="main"], .flex-1').textContent().catch(() => '');
        console.log(`   📝 콘텐츠 길이: ${content.length} characters`);
      } else {
        console.log(`   ❌ "${section}" 버튼을 찾을 수 없음`);
      }
    }
    
    // 컴포넌트 분석
    console.log('\n=== UI 컴포넌트 분석 ===');
    
    const buttons = await page.locator('button').count();
    console.log(`버튼 개수: ${buttons}개`);
    
    const cards = await page.locator('[class*="bg-white"], [class*="rounded"]').count();
    console.log(`카드형 요소: ${cards}개`);
    
    const gradients = await page.locator('[class*="gradient"], [class*="from-"], [class*="to-"]').count();
    console.log(`그래디언트 요소: ${gradients}개`);
    
    // 다크 테마 확인
    const bodyBg = await page.evaluate(() => {
      const body = document.body;
      return window.getComputedStyle(body).backgroundColor;
    });
    console.log('배경 색상:', bodyBg);
    
    console.log('\n✨ Linear 스타일 데모 테스트 완료!');
    
  } catch (error) {
    console.error('❌ 에러:', error);
  } finally {
    // 5초 대기 후 브라우저 닫기 (수동 확인용)
    console.log('\n⏳ 5초 후 브라우저를 닫습니다...');
    await page.waitForTimeout(5000);
    await browser.close();
  }
})();