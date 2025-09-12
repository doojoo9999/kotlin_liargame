const { chromium } = require('playwright');
const { BASE_URL } = require('./env-base');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  let navigationCount = 0;
  
  // 네비게이션 이벤트 세밀하게 모니터링
  page.on('framenavigated', frame => {
    if (frame === page.mainFrame()) {
      navigationCount++;
      console.log(`🔄 네비게이션 #${navigationCount}: ${frame.url()}`);
      console.log(`   시간: ${new Date().toISOString()}`);
    }
  });
  
  // URL 변화 감지
  page.on('response', response => {
    if (response.url().includes('main/demo')) {
      console.log(`📄 데모 페이지 응답: ${response.status()} ${response.url()}`);
    }
  });
  
  // React Router와 관련된 로그 모니터링
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('router') || text.includes('Router') || text.includes('navigate') || text.includes('Navigate')) {
      console.log(`[ROUTER] ${text}`);
    }
    if (text.includes('lazy') || text.includes('Suspense')) {
      console.log(`[LAZY] ${text}`);
    }
    if (text.includes('Error') || text.includes('error')) {
      console.log(`[ERROR] ${text}`);
    }
  });
  
  try {
    console.log('🔍 React Router 네비게이션 분석...');
    
    await page.goto(`${BASE_URL}/main/demo`, { waitUntil: 'domcontentloaded' });

    // 첫 로드 후 잠시 대기하여 추가 네비게이션 확인
    await page.waitForTimeout(3000);
    
    console.log(`📊 총 네비게이션 횟수: ${navigationCount}`);
    
    if (navigationCount > 1) {
      console.log('❌ 중복 네비게이션 감지됨!');
      
      // React Router 상태 확인
      const routerInfo = await page.evaluate(() => {
        try {
          // 현재 URL과 라우터 상태 확인
          const currentPath = window.location.pathname;
          const currentSearch = window.location.search;
          const currentHash = window.location.hash;
          
          // React Router가 로드되었는지 확인
          const hasReactRouter = typeof window.__reactRouterVersion !== 'undefined';
          
          return {
            currentPath,
            currentSearch,
            currentHash,
            hasReactRouter,
            fullUrl: window.location.href
          };
        } catch (error) {
          return { error: error.message };
        }
      });
      
      console.log('🔍 라우터 상태:', routerInfo);
      
      // 컴포넌트 로딩 상태 확인
      const componentInfo = await page.evaluate(() => {
        const demoElements = document.querySelectorAll('[class*="demo"], [class*="Demo"]');
        const errorElements = document.querySelectorAll('[class*="error"], [class*="Error"]');
        const loadingElements = document.querySelectorAll('[class*="loading"], [class*="Loading"]');
        
        return {
          demoElementsCount: demoElements.length,
          errorElementsCount: errorElements.length,
          loadingElementsCount: loadingElements.length,
          hasMainContent: document.querySelector('main') !== null,
          bodyClasses: document.body.className
        };
      });
      
      console.log('🧩 컴포넌트 상태:', componentInfo);
    } else {
      console.log('✅ 네비게이션이 정상적으로 1회만 발생했습니다');
    }
    
    // 현재 페이지 내용 확인
    const pageContent = await page.evaluate(() => {
      return {
        title: document.title,
        hasGameDemo: document.querySelector('.game-demo-container') !== null,
        hasGameCard: document.querySelector('.game-card') !== null,
        bodyText: document.body.innerText.substring(0, 200)
      };
    });
    
    console.log('📄 페이지 내용:', pageContent);
    
    await page.screenshot({ path: 'debug-router-state.png' });
    console.log('📸 라우터 상태 스크린샷 저장');
    
  } catch (error) {
    console.error('❌ 분석 오류:', error);
  } finally {
    await browser.close();
  }
})();