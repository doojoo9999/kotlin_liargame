const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // 콘솔 에러 모니터링
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error('❌ 브라우저 에러:', msg.text());
    }
  });
  
  // 페이지 에러 모니터링
  page.on('pageerror', error => {
    console.error('❌ 페이지 에러:', error.message);
  });
  
  try {
    console.log('🔍 흰색 화면 문제 분석 중...');
    
    await page.goto('http://localhost:5173/main/demo', { waitUntil: 'networkidle' });
    
    // 페이지 상태 확인
    const pageState = await page.evaluate(() => {
      return {
        title: document.title,
        bodyContent: document.body.innerHTML.length,
        rootContent: document.getElementById('root')?.innerHTML.length || 0,
        hasGameDemo: document.querySelector('.game-demo-container') !== null,
        hasContent: document.body.textContent.trim().length > 0,
        backgroundColor: window.getComputedStyle(document.body).backgroundColor,
        isWhiteScreen: document.body.textContent.trim().length === 0
      };
    });
    
    console.log('📄 페이지 상태:', pageState);
    
    if (pageState.isWhiteScreen) {
      console.log('❌ 흰색 화면 확인됨!');
      
      // React 에러 확인
      const reactError = await page.evaluate(() => {
        const errorElements = document.querySelectorAll('div[data-testid="error-boundary"], [class*="error"]');
        if (errorElements.length > 0) {
          return Array.from(errorElements).map(el => el.textContent);
        }
        return null;
      });
      
      if (reactError) {
        console.log('🚨 React 에러:', reactError);
      }
      
    } else {
      console.log('✅ 페이지에 콘텐츠가 있습니다');
    }
    
    // 스크린샷 찍기
    await page.screenshot({ path: 'white-screen-debug.png', fullPage: true });
    console.log('📸 현재 화면 스크린샷 저장');
    
  } catch (error) {
    console.error('❌ 분석 오류:', error);
  } finally {
    await browser.close();
  }
})();