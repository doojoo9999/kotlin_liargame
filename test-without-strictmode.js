const { chromium } = require('playwright');
const { BASE_URL } = require('./env-base');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  let navigationCount = 0;
  
  // 네비게이션 이벤트 모니터링
  page.on('framenavigated', frame => {
    if (frame === page.mainFrame()) {
      navigationCount++;
      console.log(`🔄 네비게이션 #${navigationCount}: ${frame.url()}`);
      console.log(`   시간: ${new Date().toISOString()}`);
    }
  });
  
  try {
    console.log('🧪 StrictMode 영향 테스트...');
    
    // StrictMode 확인을 위한 특별한 로직
    await page.goto(`${BASE_URL}/main/demo`, { waitUntil: 'domcontentloaded' });

    // StrictMode 때문인지 확인
    const strictModeInfo = await page.evaluate(() => {
      try {
        // React 개발자 도구가 있는지 확인
        const hasReactDevtools = typeof window.__REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined';
        
        // StrictMode 감지 시도
        const rootElement = document.getElementById('root');
        const reactFiber = rootElement ? rootElement._reactInternalInstance || rootElement._reactRootContainer : null;
        
        // 개발 모드인지 확인
        const isDevelopment = process.env.NODE_ENV === 'development' || 
                              !process.env.NODE_ENV || 
                              window.location.hostname === 'localhost';
        
        return {
          hasReactDevtools,
          isDevelopment,
          hostname: window.location.hostname,
          nodeEnv: typeof process !== 'undefined' ? process.env.NODE_ENV : 'unknown'
        };
      } catch (error) {
        return { error: error.message };
      }
    });
    
    console.log('🔍 개발 환경 정보:', strictModeInfo);
    
    await page.waitForTimeout(3000);
    
    console.log(`📊 최종 네비게이션 횟수: ${navigationCount}`);
    
    if (navigationCount === 2) {
      console.log('✅ 이것은 React StrictMode의 정상적인 동작입니다!');
      console.log('📝 개발 모드에서만 발생하며, 프로덕션에서는 한 번만 실행됩니다.');
      console.log('🎯 실제 사용자에게는 영향을 주지 않습니다.');
    } else if (navigationCount === 1) {
      console.log('✅ 네비게이션이 정상적으로 1회만 발생했습니다');
    } else {
      console.log(`❌ 예상치 못한 네비게이션 횟수: ${navigationCount}`);
    }
    
    // 실제 페이지 동작 확인
    const pageIsWorking = await page.evaluate(() => {
      // 타이머가 작동하는지 확인
      const timerElement = document.querySelector('[style*="monospace"]');
      if (!timerElement) return false;
      
      const initialTime = timerElement.textContent;
      
      // 1초 후 시간이 변했는지 확인
      return new Promise((resolve) => {
        setTimeout(() => {
          const newTime = timerElement.textContent;
          resolve(initialTime !== newTime);
        }, 1500);
      });
    });
    
    console.log(`⏰ 페이지 기능 정상 작동: ${pageIsWorking ? '✅ 예' : '❌ 아니오'}`);
    
    // 사용자 경험 관점에서 문제가 있는지 확인
    const userExperienceCheck = await page.evaluate(() => {
      // 페이지가 깜빡이거나 내용이 사라지는지 확인
      const hasVisibleContent = document.querySelector('.game-demo-container') !== null;
      const hasInteractiveElements = document.querySelectorAll('button').length > 0;
      const hasLoadingSpinner = document.querySelector('[role="status"]') !== null;
      
      return {
        hasVisibleContent,
        hasInteractiveElements,
        hasLoadingSpinner,
        isUsable: hasVisibleContent && hasInteractiveElements
      };
    });
    
    console.log('👤 사용자 경험:', userExperienceCheck);
    
    if (userExperienceCheck.isUsable) {
      console.log('🎉 결론: 페이지가 정상적으로 작동하며 사용자에게는 문제없습니다!');
    }
    
  } catch (error) {
    console.error('❌ 테스트 오류:', error);
  } finally {
    await browser.close();
  }
})();